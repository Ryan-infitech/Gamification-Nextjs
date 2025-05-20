import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import rateLimit from "express-rate-limit";

// Import konfigurasi
import { env } from "./config/env";
import logger, { httpLogger } from "./config/logger";
import { setupSwagger } from "./docs/swagger";
import { verifyConnection } from "./config/database";
import { csrfProtection } from "./middleware/csrf";
import notificationService from "./services/notificationService";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";

// Import routes
import indexRouter from "./routes/index";
import usersRouter from "./routes/users";
// Ini akan diganti dengan import route lainnya seiring pengembangan project
// import authRouter from './routes/authRoutes';
// import gameRouter from './routes/gameRoutes';
// dan sebagainya

// Import socket handlers
// Ini akan diimplementasikan nanti
// import { setupSocketHandlers } from './socket/socketManager';

// Initialize Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// Setup Socket.io
const io = new SocketServer(server, {
  cors: {
    origin: env.CORS_ORIGINS,
    credentials: true,
  },
});

// Pass socket.io instance to notification service
notificationService.setSocketInstance(io);

// Basic security middleware
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
  })
);

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // Default: 15 minutes
  max: env.RATE_LIMIT_MAX, // Default: 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api/", apiLimiter);

// Configure CORS
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
  })
);

// HTTP Request Logging
app.use(httpLogger);

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Parse cookies
app.use(cookieParser(env.COOKIE_SECRET));

// Setup session
app.use(
  session({
    secret: env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Apply CSRF protection
app.use(csrfProtection());

// Static file serving
app.use(express.static(path.join(__dirname, "../public")));

// Setup API documentation
setupSwagger(app);

// Mount routes
app.use("/", indexRouter);
app.use("/api/users", usersRouter);

// Ini akan diganti dengan mounting route lainnya seiring pengembangan project
// app.use('/api/auth', authRouter);
// app.use('/api/game', gameRouter);
// dan sebagainya

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Handle 404
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  (error as any).status = 404;
  next(error);
});

// Global error handler
app.use(errorHandler);

// Setup socket handlers - akan diimplementasikan nanti
// setupSocketHandlers(io);

// Verify database connection before starting server
const startServer = async () => {
  try {
    const dbConnected = await verifyConnection();

    if (!dbConnected) {
      logger.error(
        "Failed to connect to database. Application will not start."
      );
      process.exit(1);
    }

    // Start server
    const PORT = parseInt(env.PORT) || 3001;

    server.listen(PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
      logger.info(
        `📚 API Documentation available at http://localhost:${PORT}/api-docs`
      );
    });

    // Handle graceful shutdown
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    logger.error("Server initialization error:", error);
    process.exit(1);
  }
};

// Graceful shutdown function
const gracefulShutdown = () => {
  logger.info("SIGTERM/SIGINT received. Shutting down gracefully...");

  server.close(() => {
    logger.info("HTTP server closed.");

    // Close database connections, etc.
    // Implement additional cleanup here if needed

    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error("Forced shutdown due to timeout");
    process.exit(1);
  }, 10000);
};

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  // We don't shut down for unhandled rejections, but we log them
});

// Start the server
startServer().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});

export default server;
