import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Role } from '@shared/types/enums';
import { sendError } from '@shared/utils/response.util';

/**
 * Role-Based Access Control middleware.
 * Checks if the authenticated user has one of the allowed roles.
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: 'You do not have permission to perform this action.',
      });
      return;
    }

    next();
  };
};
