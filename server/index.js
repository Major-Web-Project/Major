import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import apiRoutes from "./routes/index.mjs";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import { startTaskScheduler } from "./services/taskScheduler.js";

dotenv.config();

const app = express();

// --- Middleware ---
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Dynamically set allowed origins for CORS based on environment
const devOrigin = process.env.CLIENT_URL || "http://localhost:5173";
const prodOrigin = "https://infinite-learning-beta.vercel.app";
const allowedOrigins =
  process.env.NODE_ENV === "production" ? [prodOrigin] : [devOrigin];

const corsOptions = {
  credentials: true,
  optionsSuccessStatus: 200,
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// --- API Routes ---
app.use("/api", apiRoutes);

// --- Error Handling ---
app.use(notFound);
app.use(errorHandler);

// --- Database Connection & Scheduler ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully.");
    startTaskScheduler();
    console.log("✅ Task scheduler started.");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  });

// --- Export the app for Vercel ---
export default app;
