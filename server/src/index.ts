import "dotenv/config";

import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { z } from "zod/v4";

import { errorHandler } from "./middleware/errorHandler.js";
import { AppError } from "./utils/AppError.js";

// ─── Validate Environment Variables ──────────────────────────────────────────

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  PORT: z
    .string()
    .default("3001")
    .transform((val) => parseInt(val, 10)),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:",
    JSON.stringify(parsedEnv.error.format(), null, 2)
  );
  process.exit(1);
}

const env = parsedEnv.data;

// ─── Express App ─────────────────────────────────────────────────────────────

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: env.NODE_ENV === "production" ? true : env.CLIENT_URL,
    credentials: true,
  })
);

app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Rate Limiting ───────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────

import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import youthRoutes from "./routes/youth.js";
import clientRoutes from "./routes/clients.js";
import reportRoutes from "./routes/reports.js";
import notificationRoutes from "./routes/notifications.js";
import uploadRoutes from "./routes/uploads.js";

// Health check (before auth-protected routes)
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Maisha Kazi API is running",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Static File Serving ────────────────────────────────────────────────────

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
app.use("/uploads", express.static(path.resolve(uploadDir)));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/youth", youthRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", uploadRoutes);

// ─── Serve React Client in Production ───────────────────────────────────────

if (env.NODE_ENV === "production") {
  const clientDist = path.resolve(import.meta.dirname, "../../client-dist");
  app.use(express.static(clientDist));

  // SPA fallback: serve index.html for any non-API route
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404));
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────

const server = app.listen(env.PORT, () => {
  console.log(
    `Server running in ${env.NODE_ENV} mode on port ${env.PORT}`
  );
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
