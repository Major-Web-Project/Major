import express from "express";
import AuthController from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/signup - Register new user
router.post("/signup", AuthController.signup);

// POST /api/auth/login - Login user
router.post("/login", AuthController.login);

// POST /api/auth/logout - Logout user
router.post("/logout", AuthController.logout);

// GET /api/auth/profile - Get current user profile (protected route)
router.get("/profile", protect, AuthController.getProfile);

export default router;
