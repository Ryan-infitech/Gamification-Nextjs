import winston from "winston";
import path from "path";
import fs from "fs";
import { env } from "./env";

// Make sure logs directory exists
const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define custom log formats
const consoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Define different log levels based on environment
const getLogLevel = () => {
  const level = env.LOG_LEVEL || "info";
  return level;
};

// Create Winston logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  defaultMeta: { service: "gamification-cs-api" },
  transports: [
    // Console logger for all environments
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // File logger for all logs
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),

    // Separate file for error logs
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "rejections.log"),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Create Express middleware for HTTP request logging
export const httpLogger = (req: any, res: any, next: any) => {
  // Record start time
  const start = Date.now();

  // Log when the response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "http";

    logger.log(logLevel, `${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      userAgent: req.headers["user-agent"],
      responseTime: `${duration}ms`,
      userId: req.user?.id,
    });
  });

  next();
};

// Add custom log methods for different components
export const createComponentLogger = (component: string) => {
  return {
    debug: (message: string, meta = {}) =>
      logger.debug(message, { component, ...meta }),
    info: (message: string, meta = {}) =>
      logger.info(message, { component, ...meta }),
    warn: (message: string, meta = {}) =>
      logger.warn(message, { component, ...meta }),
    error: (message: string, meta = {}) =>
      logger.error(message, { component, ...meta }),
  };
};

// Create specific loggers for different parts of the application
export const authLogger = createComponentLogger("auth");
export const gameLogger = createComponentLogger("game");
export const dbLogger = createComponentLogger("database");
export const apiLogger = createComponentLogger("api");
export const socketLogger = createComponentLogger("socket");

// Default export
export default logger;

/**
 * Contoh penggunaan:
 *
 * // Di app.ts/server.ts untuk HTTP logging
 * import { httpLogger } from './config/logger';
 * app.use(httpLogger);
 *
 * // Di service atau controller
 * import logger, { authLogger } from '../config/logger';
 *
 * // Logger umum
 * logger.info('Server started', { port: 3001 });
 *
 * // Logger spesifik untuk komponen
 * authLogger.info('User logged in', { userId: '123' });
 * gameLogger.error('Game error', { error: 'Game not found', gameId: '456' });
 */
