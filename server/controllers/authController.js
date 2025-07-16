import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

class AuthController {
  // Signup function
  static async signup(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
          message: "Username, email, and password are required",
        });
      }

      // Check if user already exists with email
      const existingUserByEmail = await User.findOne({
        email: email.toLowerCase(),
      });
      if (existingUserByEmail) {
        return res.status(409).json({
          success: false,
          error: "Email already exists",
          message: "A user with this email already exists",
        });
      }

      // Check if user already exists with username
      const existingUserByUsername = await User.findOne({ username });
      if (existingUserByUsername) {
        return res.status(409).json({
          success: false,
          error: "Username already exists",
          message: "A user with this username already exists",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = new User({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
      });

      // Save user to database
      await user.save();

      // Generate JWT token
      console.log(process.env.JWT_SECRET);
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRE || "7d",
        }
      );

      // Set cookie options
      const isProduction = process.env.NODE_ENV === "production";
      const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: isProduction, // true in production, false in dev
        sameSite: isProduction ? "strict" : "lax", // "lax" in dev, "strict" in prod
      };

      // Set token in cookie
      res.cookie("token", token, cookieOptions);

      // Return success response
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error("Signup error:", error);

      // Handle mongoose validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input",
          details: validationErrors,
        });
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(409).json({
          success: false,
          error: `${field} already exists`,
          message: `A user with this ${field} already exists`,
        });
      }

      // Handle other errors
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Something went wrong during registration",
      });
    }
  }

  // Login function (for future use)
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
          message: "Email and password are required",
        });
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
          message: "Email or password is incorrect",
        });
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials",
          message: "Email or password is incorrect",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRE || "7d",
        }
      );

      // Set cookie options
      const isProduction = process.env.NODE_ENV === "production";
      const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: isProduction, // true in production, false in dev
        sameSite: isProduction ? "strict" : "lax", // "lax" in dev, "strict" in prod
      };

      // Set token in cookie
      res.cookie("token", token, cookieOptions);

      // Return success response
      res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Something went wrong during login",
      });
    }
  }

  // Logout function
  static async logout(req, res) {
    try {
      // Clear the token cookie
      res.cookie("token", "none", {
        expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
        httpOnly: true,
      });

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Something went wrong during logout",
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Something went wrong while fetching profile",
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
          message: "Current password and new password are required",
        });
      }

      // Validate new password length
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Invalid password",
          message: "New password must be at least 6 characters long",
        });
      }

      // Get user from request (set by auth middleware)
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
          message: "User not found",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          error: "Incorrect password",
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // Update user password
      user.password = hashedNewPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Something went wrong while changing password",
      });
    }
  }
}

export default AuthController;
