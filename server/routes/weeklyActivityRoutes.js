import express from "express";
import { protect } from "../middleware/auth.js";
import WeeklyActivity from "../models/WeeklyActivity.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const userId = req.user._id;
  const activities = await WeeklyActivity.find({ user: userId }).sort({
    weekStart: -1,
  });
  res.json({ success: true, activities });
});

export default router;
