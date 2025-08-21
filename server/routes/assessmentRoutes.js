import express from "express";
import AssessmentAnswers from "../models/AssessmentAnswers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/assessment/answers - Save or update assessment answers for the current user
router.post("/answers", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { answers, personalize, duration, path } = req.body;
    if (!Array.isArray(answers) || typeof duration !== "number" || !path) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const update = {
      answers,
      personalize: personalize || "",
      duration,
      path,
      updatedAt: new Date(),
    };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const doc = await AssessmentAnswers.findOneAndUpdate(
      { user: userId },
      { $set: update },
      opts
    );
    res.status(200).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
