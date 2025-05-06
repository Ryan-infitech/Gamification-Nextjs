/**
 * Global error handling middleware
 * Processes and formats all errors caught in the application
 */
const env = require("../config/env");

/**
 * Error response structure:
 * {
 *   status: 'error',
 *   statusCode: number,
 *   message: string,
 *   errors: array (for validation errors),
 *   stack: string (only in development)
 * }
 */
function errorHandler(err, req, res, next) {
  // Default error values
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  console.error(
    `${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );

  if (err.stack && env.isDevelopment) {
    console.error(err.stack);
  }

  // Prepare error response
  const errorResponse = {
    status: "error",
    statusCode,
    message,
  };

  // Add validation errors if they exist
  if (err.errors) {
    errorResponse.errors = err.errors;
  }

  // Include stack trace in development
  if (env.isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }

  return res.status(statusCode).json(errorResponse);
}

// Custom error class for API errors
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new ApiError(400, message || "Bad Request", errors);
  }

  static unauthorized(message) {
    return new ApiError(401, message || "Unauthorized");
  }

  static forbidden(message) {
    return new ApiError(403, message || "Forbidden");
  }

  static notFound(message) {
    return new ApiError(404, message || "Resource not found");
  }

  static internal(message) {
    return new ApiError(500, message || "Internal server error");
  }
}

module.exports = errorHandler;
module.exports.ApiError = ApiError;
