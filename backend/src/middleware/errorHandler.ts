import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";
import { env } from "../config/env";
import {
  ApiError,
  DatabaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ResourceNotFoundError,
  RateLimitError,
  ConflictError,
  BadRequestError,
  InternalServerError,
} from "../types/error";

/**
 * Global error handler middleware for the application
 * Handles different types of errors and returns appropriate responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging
  logger.error("Error Handler:", {
    error: err.message,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
  });

  // Default status code and error message
  let statusCode = 500;
  let message = "Internal Server Error";
  let errorDetails: Record<string, any> | undefined = undefined;

  // Determine error type and set appropriate status code and message
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.details;
  } else if (err instanceof DatabaseError) {
    statusCode = 500;
    message = "Database Error";
    errorDetails =
      env.NODE_ENV === "development" ? { detail: err.message } : undefined;
  } else if (err instanceof ValidationError) {
    statusCode = 400;
    message = "Validation Error";
    errorDetails = err.errors;
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof ResourceNotFoundError) {
    statusCode = 404;
    message = err.message;
  } else if (err instanceof RateLimitError) {
    statusCode = 429;
    message = err.message;
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    message = err.message;
  } else if (err instanceof BadRequestError) {
    statusCode = 400;
    message = err.message;
  } else if ((err as any).status === 404) {
    statusCode = 404;
    message = err.message || "Resource not found";
  }

  // For JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Structure the response in a consistent format
  const errorResponse = {
    success: false,
    message,
    ...(errorDetails && { errors: errorDetails }),
    ...(env.NODE_ENV === "development" && {
      stack: err.stack,
      type: err.constructor.name,
    }),
  };

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler to catch errors in async route handlers
 * Eliminates the need for try/catch blocks in route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler middleware
 * Creates a 404 error for any routes that don't exist
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new ResourceNotFoundError(`Not Found - ${req.originalUrl}`);
  next(error);
};
