import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes - requires authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from cookie or Authorization header
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized",
        message: "Access denied. No token provided.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Not authorized",
          message: "User not found",
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        message: "Token is invalid or expired",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Authentication failed",
    });
  }
};

// Optional auth middleware - doesn't require authentication but adds user if available
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from cookie or Authorization header
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id);

        if (user) {
          req.user = user;
        }
      } catch (jwtError) {
        // Token is invalid, but we don't fail the request
        console.warn("Invalid token in optional auth:", jwtError.message);
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Don't fail the request for optional auth errors
    next();
  }
};
