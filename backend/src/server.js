/**
 * Main server entry point for CodeQuest Pixels backend
 */
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { createServer } = require("http");
const { Server } = require("socket.io");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");

// Create Express app
const app = express();

// HTTP server (needed for Socket.io)
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: env.corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(morgan(env.isDevelopment ? "dev" : "combined"));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// API Routes (will be added in future)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/game', require('./routes/game'));

// Socket.io event handlers (will be added in future)
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// 404 Handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global error handler
app.use(errorHandler);

// Start the server
const PORT = env.port;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running in ${env.nodeEnv} mode on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`🧪 Health check: http://localhost:${PORT}/health`);
});

// Export for testing
module.exports = { app, httpServer, io };
