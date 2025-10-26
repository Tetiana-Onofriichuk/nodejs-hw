// src/services/auth.js

import crypto from 'crypto';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/time.js';
import { Session } from '../models/session.js';

export const createSession = async (userId) => {
  const accessToken = crypto.randomBytes(30).toString('base64');
  const refreshToken = crypto.randomBytes(30).toString('base64');

  return Session.create({
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  });
};

export const setSessionCookies = (res, session) => {
  const cookieBase = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/', // ✅ обов’язково
  };

  res.cookie('accessToken', session.accessToken, {
    ...cookieBase,
    maxAge: FIFTEEN_MINUTES,
  });

  res.cookie('refreshToken', session.refreshToken, {
    ...cookieBase,
    maxAge: ONE_DAY,
  });

  res.cookie('sessionId', session._id.toString(), {
    // ✅ .toString()
    ...cookieBase,
    maxAge: ONE_DAY,
  });
};
