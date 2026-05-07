import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodEffects } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '@shared/utils/response.util';

type ZodSchema = AnyZodObject | ZodEffects<AnyZodObject>;

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Generic Zod validation middleware.
 * Validates request body, query, and/or params against provided schemas.
 */
export const validate = (schemas: ValidateOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query) as Record<string, string>;
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params) as Record<string, string>;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        sendError({
          res,
          statusCode: StatusCodes.BAD_REQUEST,
          message: 'Validation failed',
          errors,
        });
        return;
      }
      next(error);
    }
  };
};
