import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '@/config/env.config';
import { ITokenPayload } from '@shared/types/interfaces';

export const generateAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
};

export const generateRefreshToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as ITokenPayload;
};

export const generateEmailToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashEmailToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
