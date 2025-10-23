import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { Session } from '../models/session.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendMail.js';

import Handlebars from 'handlebars';
import fs from 'node:fs/promises';
import path from 'node:path';

export const registerUser = async (req, res, next) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(createHttpError(400, 'Email in use'));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    email,
    password: hashedPassword,
  });

  const newSession = await createSession(newUser._id);

  setSessionCookies(res, newSession);

  res.status(201).json(newUser);
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(createHttpError(401, 'User not found'));
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return next(createHttpError(401, 'Invalid credentials'));
  }

  await Session.deleteMany({ userId: user._id });

  const newSession = await createSession(user._id);

  setSessionCookies(res, newSession);

  res.status(200).json(user);
};

export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(204).send();
};

export const refreshUserSession = async (req, res, next) => {
  const session = await Session.findOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  if (!session) {
    return next(createHttpError(401, 'Session not found'));
  }

  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  if (isSessionTokenExpired) {
    return next(createHttpError(401, 'Session token expired'));
  }

  await Session.deleteOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  res.status(200).json({
    message: 'Session refreshed',
  });
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'reset-password-email.html',
    );
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const renderResetEmail = Handlebars.compile(templateSource);

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(createHttpError(404, 'User not found'));
    }

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

    const link = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${token}`;
    const name =
      (typeof user.username === 'string' && user.username.trim()) ||
      email.split('@')[0];

    const html = renderResetEmail({ name, link });

    await sendEmail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your password',
      html,
    });

    return res.status(200).json({
      message: 'Password reset email sent successfully',
    });
  } catch {
    return next(
      createHttpError(500, 'Failed to send the email, please try again later.'),
    );
  }
};

export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    next(createHttpError(401, 'Invalid or expired token'));
    return;
  }

  const user = await User.findOne({ _id: payload.sub, email: payload.email });
  if (!user) {
    next(createHttpError(404, 'User not found'));
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: user._id }, { password: hashedPassword });

  await Session.deleteMany({ userId: user._id });

  res.status(200).json({
    message: 'Password reset successfully. Please log in again.',
  });
};

export const checkSession = async (req, res, next) => {
  try {
    const { sessionId, accessToken } = req.cookies;

    // Якщо немає жодного cookie — користувач не авторизований
    if (!sessionId || !accessToken) {
      return res
        .status(401)
        .json({ success: false, message: 'Not authenticated' });
    }

    // Знаходимо сесію в базі
    const session = await Session.findById(sessionId);
    if (!session) {
      return res
        .status(401)
        .json({ success: false, message: 'Session not found' });
    }

    // Перевіряємо чи сесія ще дійсна
    const isExpired = new Date() > new Date(session.accessTokenValidUntil);
    if (isExpired) {
      return res
        .status(401)
        .json({ success: false, message: 'Session expired' });
    }

    // Знаходимо користувача
    const user = await User.findById(session.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    // Якщо все добре — повертаємо true
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch {
    next(createHttpError(500, 'Failed to verify session'));
  }
};
