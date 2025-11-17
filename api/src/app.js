const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Initialize Passport
const passport = require("./config/passport");

const { sequelize, testConnection } = require("./config/sequelize");

// Import models with associations
require("./models");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const homepageRoutes = require("./routes/homepageRoutes");
const courseRoutes = require("./routes/courseRoutes");
const problemRoutes = require("./routes/problemRoutes");
const documentRoutes = require("./routes/documentRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const contestRoutes = require("./routes/contestRoutes");
const chatRoutes = require("./routes/chatRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const friendshipRoutes = require("./routes/friendshipRoutes");
const privateChatRoutes = require("./routes/privateChatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const courseAdminRoutes = require("./routes/courseAdminRoutes");
const documentAdminRoutes = require("./routes/documentAdminRoutes");
const problemAdminRoutes = require("./routes/problemAdminRoutes");
const contestAdminRoutes = require("./routes/contestAdminRoutes");
const userAdminRoutes = require("./routes/userAdminRoutes");
const dashboardAdminRoutes = require("./routes/dashboardAdminRoutes");
const courseContentRoutes = require("./routes/courseContentRoutes");
const chatAIRoutes = require("./routes/chatAIRoutes");
const gameRoutes = require("./routes/gameRoutes");

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:4200",
    methods: ["GET", "POST"],
  },
});

// Import and setup Socket.IO chat handler
const { handleConnection } = require("./socket/chatHandler");
handleConnection(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize Passport middleware
app.use(passport.initialize());

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Add Socket.IO instance to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
const apiPrefix = process.env.API_PREFIX || "/api/v1";

// Core resource routes
app.use(apiPrefix + "/auth", authRoutes);
app.use(apiPrefix + "/users", userRoutes);
app.use(apiPrefix + "/courses", courseRoutes);
app.use(apiPrefix + "/problems", problemRoutes);
app.use(apiPrefix + "/documents", documentRoutes);
app.use(apiPrefix + "/leaderboard", leaderboardRoutes);
app.use(apiPrefix + "/contests", contestRoutes);
app.use(apiPrefix + "/chat", chatRoutes);
app.use(apiPrefix + "/submissions", submissionRoutes);
app.use(apiPrefix + "/friendship", friendshipRoutes);
app.use(apiPrefix + "/private-chat", privateChatRoutes);
app.use(apiPrefix + "/notifications", notificationRoutes);
app.use(apiPrefix + "/chat-ai", chatAIRoutes);
app.use(apiPrefix + "/games", gameRoutes);

// Admin routes
app.use(apiPrefix + "/admin/dashboard", dashboardAdminRoutes);
app.use(apiPrefix + "/admin/courses", courseAdminRoutes);
app.use(apiPrefix + "/admin/documents", documentAdminRoutes);
app.use(apiPrefix + "/admin/problems", problemAdminRoutes);
app.use(apiPrefix + "/admin/contests", contestAdminRoutes);
app.use(apiPrefix + "/admin/users", userAdminRoutes);

// Course content routes
app.use(apiPrefix + "/course-content", courseContentRoutes);

// Homepage-specific routes
app.use(apiPrefix + "/homepage", homepageRoutes);

// Alternative homepage routes (for direct access)
app.use(
  apiPrefix + "/overview",
  (req, res, next) =>
    (req.originalUrl = req.originalUrl.replace(
      "/overview",
      "/homepage/overview"
    )),
  homepageRoutes
);
app.use(
  apiPrefix + "/leaderboard",
  (req, res, next) =>
    (req.originalUrl = req.originalUrl.replace(
      "/leaderboard",
      "/homepage/leaderboard"
    )),
  homepageRoutes
);
app.use(
  apiPrefix + "/testimonials",
  (req, res, next) =>
    (req.originalUrl = req.originalUrl.replace(
      "/testimonials",
      "/homepage/testimonials"
    )),
  homepageRoutes
);

// Catch-all route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Database connection and server startup
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database (create tables if they don't exist)
    // await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("✅ Database connection ready");

    // Start server with Socket.IO - listen on all network interfaces
    const HOST = process.env.HOST || "0.0.0.0";
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server is running on ${HOST}:${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API base URL: http://localhost:${PORT}${apiPrefix}`);
      console.log(`🌐 Server is accessible from all network interfaces`);
      console.log(`💬 Socket.IO server is ready`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
