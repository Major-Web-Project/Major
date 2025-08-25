import Goal from "../models/Goal.js";
import Task from "../models/Task.js";
import AssessmentAnswers from "../models/AssessmentAnswers.js";
import { generateRoadmapForContext } from "./aiController.js";
import catchAsync from "../utils/catchAsync.js";
import ErrorResponse from "../utils/ErrorResponse.js";

// Utility function to clean up incomplete goals and unused roadmaps
export const cleanupIncompleteGoals = async (userId) => {
  let cleanedCount = 0;
  try {
    // Find goals that have a roadmap but NO tasks in the DB
    const incompleteGoals = await Goal.find({
      user: userId,
      roadmap: { $exists: true, $ne: {} },
    });
    for (const goal of incompleteGoals) {
      const tasks = await Task.find({ goal: goal._id });
      if (!tasks || tasks.length === 0) {
        await Goal.findByIdAndDelete(goal._id);
        cleanedCount++;
        console.log(`Cleaned up incomplete goal: ${goal._id} (${goal.field})`);
      }
    }
  } catch (error) {
    console.error("Error cleaning up incomplete goals:", error);
  }
  return cleanedCount;
};
// Utility function to clean up incomplete goals
// Create new goal and roadmap only (no tasks)
export const createGoalWithRoadmap = catchAsync(async (req, res) => {
  // Debug: Log incoming request and user
  console.log("[createGoalWithRoadmap] req.user:", req.user);
  console.log(
    "[createGoalWithRoadmap] req.body:",
    JSON.stringify(req.body, null, 2)
  );

  const userId = req.user._id;
  const body = req.body || {};

  // Resolve core fields
  const path = body.path || body.field || "";
  if (!path || typeof path !== "string") {
    throw new ErrorResponse("'path' (or 'field') is required", 400);
  }
  const duration = Number(
    typeof body.duration !== "undefined" ? body.duration : body.timeline || 3
  );
  const description = body.description || `AI-generated roadmap for ${path}`;
  const personalNeeds = body.personalNeeds || {};

  // Extract assessment answers/personalize
  const answers = Array.isArray(body.answers)
    ? body.answers
    : Array.isArray(body.assessmentAnswers)
    ? body.assessmentAnswers
    : Array.isArray(body.goalSetup?.assessmentAnswers)
    ? body.goalSetup.assessmentAnswers
    : [];
  const personalize = body.personalize || "";

  // Upsert assessment data for the user (useful for future generations)
  try {
    if (answers.length > 0 || personalize || duration) {
      await AssessmentAnswers.findOneAndUpdate(
        { user: userId },
        { answers, personalize, duration },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  } catch (e) {
    console.warn(
      "[createGoalWithRoadmap] Could not upsert AssessmentAnswers:",
      e?.message
    );
  }

  // Generate roadmap with AI
  const generatedRoadmap = await generateRoadmapForContext({
    answers,
    personalize,
    duration,
    path,
    userId,
  });

  const validTimeline = Math.max(
    1,
    Math.min(24, Number(generatedRoadmap?.totalDuration || duration || 1))
  );

  // Save goal with roadmap (no tasks here)
  const goal = new Goal({
    user: userId,
    field: path,
    path,
    description,
    timeline: validTimeline,
    personalNeeds,
    roadmap: generatedRoadmap,
    userProfile: body.personalize || {},
    assessmentData: body.assessmentData || {},
    goalSetup: body.goalSetup || {},
    status: "active",
  });
  await goal.save();

  return res.status(201).json({
    success: true,
    message: "Roadmap generated successfully!",
    data: {
      goal: goal.toJSON(),
      roadmap: generatedRoadmap,
    },
  });
});
// ...existing code...

// Legacy one-shot task generation endpoint removed. Use per-phase SSE on the client.

// (The rest of the file remains the same)
// Get all goals for the authenticated user
export const getUserGoals = catchAsync(async (req, res) => {
  // Return all goals for the user; frontend will handle generation status
  const goals = await Goal.find({ user: req.user._id })
    .populate({
      path: "tasks",
      select: "title status scheduledDate",
      options: { sort: { scheduledDate: -1 } },
    })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: goals,
  });
});

// Get goal by ID with tasks
export const getGoalById = catchAsync(async (req, res) => {
  const goal = await Goal.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate({
    path: "tasks",
    options: { sort: { scheduledDate: 1 } },
  });

  if (!goal) {
    throw new ErrorResponse("Goal not found", 404);
  }

  console.log("[getGoalById] Returning goal:", {
    goalId: goal._id,
    roadmap: goal.roadmap,
    totalTasks: Array.isArray(goal.tasks) ? goal.tasks.length : 0,
  });

  res.json({
    success: true,
    data: goal,
  });
});

// Get tasks for a specific goal
export const getGoalTasks = catchAsync(async (req, res) => {
  const { goalId } = req.params;
  const { date } = req.query;

  // Verify goal belongs to user
  const goal = await Goal.findOne({ _id: goalId, user: req.user._id });
  if (!goal) {
    throw new ErrorResponse("Goal not found", 404);
  }

  let query = { goal: goalId, user: req.user._id };

  // If date is provided, filter by scheduled date
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    query.scheduledDate = { $gte: startDate, $lte: endDate };
  }

  const tasks = await Task.find(query).sort({ scheduledDate: -1 });

  // Format tasks for frontend compatibility
  const formattedTasks = tasks.map((task) => task.formattedData);

  res.json({
    success: true,
    data: formattedTasks,
  });
});

// Update goal
export const updateGoal = catchAsync(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });

  if (!goal) {
    throw new ErrorResponse("Goal not found", 404);
  }

  // Update allowed fields
  const allowedUpdates = [
    "status",
    "currentPhase",
    "currentDay",
    "description",
  ];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      goal[field] = req.body[field];
    }
  });

  await goal.save();

  res.json({
    success: true,
    message: "Goal updated successfully",
    data: goal,
  });
});

// Delete goal and all associated tasks with transaction support
export const deleteGoal = catchAsync(async (req, res) => {
  const goalId = req.params.id;
  const userId = req.user._id;

  // Validate goalId format
  if (!goalId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ErrorResponse("Invalid goal ID format", 400);
  }

  const goal = await Goal.findOne({ _id: goalId, user: userId });

  if (!goal) {
    throw new ErrorResponse("Goal not found", 404);
  }

  try {
    // Count tasks before deletion for logging
    const taskCount = await Task.countDocuments({ goal: goalId, user: userId });

    // Delete all uploaded files for tasks under this goal (GridFS)
    const { deleteGridFSFile } = await import("../utils/gridfsDelete.js");
    const tasksWithFiles = await Task.find({
      goal: goalId,
      user: userId,
      submissionFile: { $exists: true, $ne: null },
    });
    for (const task of tasksWithFiles) {
      if (task.submissionFile) {
        await deleteGridFSFile(task.submissionFile);
      }
    }

    // Delete all tasks associated with this goal
    const taskDeletionResult = await Task.deleteMany({
      goal: goalId,
      user: userId,
    });

    // Update user's activeGoalId if this was the active goal
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId);
    if (user && user.activeGoalId && user.activeGoalId.toString() === goalId) {
      // Find another goal to set as active, or set to null
      const otherGoals = await Goal.find({
        user: userId,
        _id: { $ne: goalId },
      }).limit(1);

      const newActiveGoalId = otherGoals.length > 0 ? otherGoals[0]._id : null;
      await User.findByIdAndUpdate(userId, {
        activeGoalId: newActiveGoalId,
        $pull: { goals: goalId },
      });
    } else {
      // Just remove the goal from user's goals array
      await User.findByIdAndUpdate(userId, {
        $pull: { goals: goalId },
      });
    }

    // Delete the goal
    await Goal.findByIdAndDelete(goalId);

    // Deletion completed successfully
    res.json({
      success: true,
      message: "Goal and all associated tasks deleted successfully",
      data: {
        deletedGoalId: goalId,
        goalField: goal.field,
        goalDescription: goal.description,
      },
    });
  } catch (error) {
    console.error("Error during goal deletion:", error);

    throw new ErrorResponse("Failed to delete goal and associated data.", 500);
  }
});

// Set active goal for user
export const setActiveGoal = catchAsync(async (req, res) => {
  const { goalId } = req.params;
  const userId = req.user._id;

  // Validate goalId format
  if (!goalId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ErrorResponse("Invalid goal ID format", 400);
  }

  // Verify goal belongs to user
  const goal = await Goal.findOne({ _id: goalId, user: userId });
  if (!goal) {
    throw new ErrorResponse("Goal not found", 404);
  }

  // Update user's activeGoalId
  const User = (await import("../models/User.js")).default;
  await User.findByIdAndUpdate(userId, { activeGoalId: goalId });

  res.json({
    success: true,
    message: "Active goal updated successfully",
    data: {
      activeGoalId: goalId,
      goalField: goal.field,
      goalDescription: goal.description,
    },
  });
});

// Clean up incomplete goals (goals without tasks)
// Clean up incomplete goals (goals without tasks)
// Only export the function, do not call automatically. Call this after tasks are generated and status is updated.
export const cleanupIncompleteGoalsEndpoint = catchAsync(async (req, res) => {
  const cleanedCount = await cleanupIncompleteGoals(req.user._id);
  res.json({
    success: true,
    message: `Cleaned up ${cleanedCount} incomplete goals`,
    data: {
      cleanedGoalsCount: cleanedCount,
    },
  });
});

// Clean up a specific incomplete goal by goalId (for frontend reload/leave)
export const cleanupSpecificIncompleteGoal = catchAsync(async (req, res) => {
  const goalId = req.params.id;
  const userId = req.user._id;
  const goal = await Goal.findOne({ _id: goalId, user: userId });
  if (!goal) {
    return res.status(404).json({ success: false, message: "Goal not found" });
  }
  const tasks = await Task.find({ goal: goalId });
  if (!tasks || tasks.length === 0) {
    await Goal.findByIdAndDelete(goalId);
    return res.json({
      success: true,
      message: "Incomplete goal and roadmap deleted",
    });
  }
  return res.json({
    success: false,
    message: "Goal is already complete, not deleted",
  });
});

// Regenerate AI tasks for an existing goal
// Legacy regenerateGoalTasks removed
