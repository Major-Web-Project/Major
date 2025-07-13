import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes and middleware
import apiRoutes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced middleware with better error handling
app.use(
  cors({
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// ONLY serve static files in production environment
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
}

// Mount API routes
app.use("/api", apiRoutes);

// 404 middleware for API routes
app.use(notFound);

// ONLY serve React app in production environment
if (process.env.NODE_ENV === "production") {
  // Catch all handler: send back React's index.html file for client-side routing
  app.get("*", (req, res) => {
    try {
      res.sendFile(path.join(__dirname, "../dist/index.html"));
    } catch (error) {
      console.error("Error serving index.html:", error);
      res.status(500).send("Server Error");
    }
  });
} else {
  // In development, let Vite handle the frontend routing
  app.get("*", (req, res) => {
    res.status(404).json({
      error: "Route not found",
      message: "In development mode, frontend routes are handled by Vite",
      suggestion: "Make sure Vite dev server is running on port 5173",
    });
  });
}

// Enhanced error handling middleware
app.use(errorHandler);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/infinite-learning"
    );
    console.log(`Connected to database`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Start server
app.listen(PORT, async () => {
  // Connect to database first
  await connectDB();

  console.log(`Server is running on port ${PORT}`);
});

export default app;
