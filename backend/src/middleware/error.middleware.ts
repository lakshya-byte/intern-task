import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import logger from '../config/logger';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/response';

const handleCastError = (err: mongoose.Error.CastError): AppError => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicateKeyError = (err: Error & { code?: number; keyValue?: Record<string, unknown> }): AppError => {
  const field = Object.keys(err.keyValue || {}).join(', ');
  return new AppError(`Duplicate field value: ${field}. Please use a different value.`, 409);
};

const handleValidationError = (err: mongoose.Error.ValidationError): AppError => {
  const message = Object.values(err.errors)
    .map((e) => e.message)
    .join('. ');
  return new AppError(message, 400);
};

const handleJWTError = (): AppError => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = (): AppError => new AppError('Token expired. Please log in again.', 401);

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = err;

  // Log error with context
  logger.error('Request error', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: (error as AppError).statusCode || 500,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Handle known error types
  if (error instanceof mongoose.Error.CastError) error = handleCastError(error);
  if ((error as { code?: number }).code === 11000)
    error = handleDuplicateKeyError(error as Error & { code?: number; keyValue?: Record<string, unknown> });
  if (error instanceof mongoose.Error.ValidationError) error = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  const appError = error as AppError;
  const statusCode = appError.statusCode || 500;
  const message =
    appError.isOperational
      ? appError.message
      : process.env.NODE_ENV === 'development'
      ? appError.message
      : 'Something went wrong. Please try again later.';

  sendError(res, message, statusCode);
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};
