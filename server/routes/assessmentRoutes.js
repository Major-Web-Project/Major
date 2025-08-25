import express from "express";
import AssessmentAnswers from "../models/AssessmentAnswers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/assessment/answers - Save or update assessment answers for the current user
router.post("/answers", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { answers, personalize, duration, path, pathMetadata } = req.body;

    // Generic validation - no hardcoded path restrictions
    if (!Array.isArray(answers) || typeof duration !== "number" || !path) {
      return res.status(400).json({
        error: "Missing required fields",
        details:
          "answers (array), duration (number), and path (string) are required",
      });
    }

    // Validate path is a non-empty string
    if (typeof path !== "string" || path.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid path",
        details: "Path must be a non-empty string",
      });
    }

    // Prepare update object
    const update = {
      answers,
      personalize: personalize || "",
      duration,
      path: path.trim(),
      updatedAt: new Date(),
    };

    // Include metadata if provided
    if (pathMetadata && typeof pathMetadata === "object") {
      update.pathMetadata = pathMetadata;
    }

    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const doc = await AssessmentAnswers.findOneAndUpdate(
      { user: userId },
      { $set: update },
      opts
    );

    res.status(200).json({
      success: true,
      data: doc,
      message: "Assessment answers saved successfully",
    });
  } catch (err) {
    console.error("[AssessmentRoutes] Error saving answers:", err);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

// GET /api/assessment/paths - Get all unique paths from saved assessments (analytics)
router.get("/paths", protect, async (req, res) => {
  try {
    const uniquePaths = await AssessmentAnswers.distinct("path");
    res.status(200).json({
      success: true,
      data: uniquePaths,
      count: uniquePaths.length,
    });
  } catch (err) {
    console.error("[AssessmentRoutes] Error fetching paths:", err);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

export default router;
