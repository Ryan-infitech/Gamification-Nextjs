/**
 * Base API Error class
 * All custom errors should extend this class
 */
export class ApiError extends Error {
  statusCode: number;
  details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database Error
 * Used for any database-related errors
 */
export class DatabaseError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 500, details);
  }
}

/**
 * Validation Error
 * Used when input validation fails
 */
export class ValidationError extends ApiError {
  errors: Record<string, string[]>;

  constructor(
    message: string = "Validation Error",
    errors: Record<string, string[]>
  ) {
    super(message, 400, { fieldErrors: errors });
    this.errors = errors;
  }
}

/**
 * Authentication Error
 * Used when authentication fails (e.g., invalid credentials)
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = "Authentication failed") {
    super(message, 401);
  }
}

/**
 * Authorization Error
 * Used when a user doesn't have permission to access a resource
 */
export class AuthorizationError extends ApiError {
  constructor(
    message: string = "You do not have permission to access this resource"
  ) {
    super(message, 403);
  }
}

/**
 * Resource Not Found Error
 * Used when a requested resource is not found
 */
export class ResourceNotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

/**
 * Rate Limit Error
 * Used when rate limiting is triggered
 */
export class RateLimitError extends ApiError {
  constructor(message: string = "Too many requests, please try again later") {
    super(message, 429);
  }
}

/**
 * Conflict Error
 * Used for resource conflicts (e.g., duplicate entries)
 */
export class ConflictError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 409, details);
  }
}

/**
 * Bad Request Error
 * Used for general client errors
 */
export class BadRequestError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, details);
  }
}

/**
 * Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends ApiError {
  constructor(
    message: string = "An unexpected error occurred",
    details?: Record<string, any>
  ) {
    super(message, 500, details);
  }
}

/**
 * Utility function to convert unknown errors to ApiError
 */
export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message);
  }

  return new InternalServerError("An unknown error occurred");
};

/**
 * Error codes enum for specific error types
 * Useful for client-side error handling
 */
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  CONFLICT_ERROR = "CONFLICT_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

/**
 * Error responses types used for API documentation
 */
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, any>;
  code?: ErrorCode;
}

export interface ValidationErrorResponse extends ErrorResponse {
  errors: Record<string, string[]>;
  code: ErrorCode.VALIDATION_ERROR;
}
