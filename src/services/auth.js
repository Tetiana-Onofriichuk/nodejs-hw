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
  const isProd = process.env.NODE_ENV === 'production';

  const cookieBase = {
    httpOnly: true,
    secure: isProd, // локально false, у проді true
    sameSite: isProd ? 'none' : 'lax', // локально 'lax', у проді 'none'
    path: '/', // ОБОВ'ЯЗКОВО
  };

  res.cookie('accessToken', session.accessToken, {
    ...cookieBase,
    maxAge: FIFTEEN_MINUTES,
  });

  res.cookie('refreshToken', session.refreshToken, {
    ...cookieBase,
    maxAge: ONE_DAY,
  });

  // важливо привести _id до рядка
  res.cookie('sessionId', session._id.toString(), {
    ...cookieBase,
    maxAge: ONE_DAY,
  });
};
