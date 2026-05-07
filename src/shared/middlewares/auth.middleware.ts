import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyAccessToken } from '@shared/utils/token.util';
import { sendError } from '@shared/utils/response.util';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Try to get token from cookies first, then Authorization header
    let token: string | undefined;

    const cookieToken = req.cookies?.accessToken as string | undefined;
    if (cookieToken) {
      token = cookieToken;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      sendError({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    sendError({
      res,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Invalid or expired access token.',
    });
  }
};

/**
 * Optional auth middleware — attaches user if token exists but doesn't block.
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined;

    const cookieToken = req.cookies?.accessToken as string | undefined;
    if (cookieToken) {
      token = cookieToken;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }
  } catch {
    // Token invalid — continue without user
  }

  next();
};
