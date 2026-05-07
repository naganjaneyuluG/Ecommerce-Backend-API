import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface SuccessOptions<T> {
  res: Response;
  statusCode?: number;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ErrorOptions {
  res: Response;
  statusCode?: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export const sendSuccess = <T>({
  res,
  statusCode = StatusCodes.OK,
  message,
  data,
  pagination,
}: SuccessOptions<T>): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(pagination && { pagination }),
  });
};

export const sendError = ({
  res,
  statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
  message,
  errors,
}: ErrorOptions): void => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    statusCode,
  });
};
