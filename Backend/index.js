import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import env from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";

const app = express();

// Middleware
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/emails", emailRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (err.name === "MulterError") {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  res.status(500).json({ message: "Internal server error" });
});

// Start server
const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
};

start();
