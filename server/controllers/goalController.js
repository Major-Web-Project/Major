import Goal from "../models/Goal.js";
import Task from "../models/Task.js";
import { generateTasksForContext } from "./aiController.js";
import catchAsync from "../utils/catchAsync.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import { enhanceResourcesWithDefaults } from "../utils/resourceValidator.js";

// Create new goal with AI-generated tasks
export const createGoalWithTasks = catchAsync(async (req, res) => {
  const {
    field,
    description,
    timeline,
    personalNeeds,
    strengths,
    weaknesses,
    userProfile,
    assessmentData,
    goalSetup,
    roadmap,
  } = req.body;

  // Validate goal data
  const validation = Goal.validate({ field, description, timeline });
  if (!validation.isValid) {
    throw new ErrorResponse(
      `Validation failed: ${validation.errors.join(", ")}`,
      400
    );
  }

  // Create the goal
  const goal = new Goal({
    user: req.user._id,
    field,
    description,
    timeline,
    personalNeeds: personalNeeds || null,
    strengths: strengths || [],
    weaknesses: weaknesses || [],
    userProfile: userProfile || {},
    assessmentData: assessmentData || {},
    goalSetup: goalSetup || {},
    roadmap: roadmap || {},
  });

  await goal.save();

  // Generate AI tasks for the entire timeline
  try {
    const totalDays = Math.max(1, Math.round((timeline || 1) * 30));
    const aiData = await generateTasksForContext({
      userProfile: {
        experienceLevel: goal.userProfile?.experienceLevel || 2,
        timeCommitment: goal.userProfile?.timeCommitment || 3,
        learningStyle: goal.userProfile?.preferredStyle || "balanced",
        motivation: goal.userProfile?.motivation || 3,
      },
      assessment: goal.assessmentData,
      goal: {
        ...goal.goalSetup,
        field: goal.field,
        personalNeeds: goal.personalNeeds
      },
      roadmap: goal.roadmap?.phases || [],
      currentPhase: 1,
      learningPath: goal.roadmap?.id || "general",
      totalDays, // Pass total days for the prompt
      personalNeeds: goal.personalNeeds
    });

    // If AI task generation was successful, create tasks in database
    if (aiData && aiData.tasks) {
      const tasks = aiData.tasks;
      const createdTasks = [];
      const startDate = new Date();

      // Mark goal as generating tasks
      goal.tasksGenerated = false;
      goal.isGeneratingTasks = true;
      await goal.save();

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        // Use AI-provided dayNumber, fallback to round-robin if missing
        const dayNumber = task.dayNumber || (i % totalDays) + 1;
        const scheduledDate = new Date(startDate);
        scheduledDate.setDate(startDate.getDate() + (dayNumber - 1));
        // Use AI-provided phase, fallback to 1
        const phase = Number(task.phase) || 1;

        const newTask = new Task({
          user: req.user._id,
          goal: goal._id,
          title: task.title,
          description: task.description,
          type: task.type || "learning",
          category: task.topics?.[0] || "General",
          difficulty: task.difficulty || 3,
          priority: task.priority || "medium",
          estimatedTime: task.estimatedHours || 1,
          isAIGenerated: true,
          topics: task.topics || [],
          resources: enhanceResourcesWithDefaults(task.resources || [], task.topics || []),
          realWorldApplication: task.realWorldApplication || "",
          successCriteria: task.successCriteria || [],
          scheduledDate,
          phase,
          dayNumber,
          status: "pending",
        });

        await newTask.save();
        createdTasks.push(newTask);
      }

      // Update goal with task generation status
      goal.tasksGenerated = true;
      goal.isGeneratingTasks = false;
      goal.totalTasksGenerated = createdTasks.length;
      await goal.save();

      res.status(201).json({
        success: true,
        message: "Goal created successfully with AI-generated tasks!",
        data: {
          goal: goal.toJSON(),
          tasksGenerated: createdTasks.length,
          totalTasks: createdTasks.length,
          isGeneratingTasks: false,
        },
      });
    } else {
      // If AI generation failed, still save the goal but mark tasks as not generated
      goal.tasksGenerated = false;
      goal.isGeneratingTasks = false;
      await goal.save();

      res.status(201).json({
        success: true,
        message:
          "Goal created successfully, but AI task generation failed. You can generate tasks later.",
        data: {
          goal: goal.toJSON(),
          tasksGenerated: 0,
          totalTasks: 0,
          isGeneratingTasks: false,
        },
      });
    }
  } catch (error) {
    console.error("Error generating AI tasks:", error);

    // Save goal even if AI task generation fails
    goal.tasksGenerated = false;
    goal.isGeneratingTasks = false;
    await goal.save();

    res.status(201).json({
      success: true,
      message:
        "Goal created successfully, but AI task generation failed. You can generate tasks later.",
      data: {
        goal: goal.toJSON(),
        tasksGenerated: 0,
        totalTasks: 0,
        isGeneratingTasks: false,
        error: "AI task generation failed",
      },
    });
  }
});

// Get all goals for the authenticated user
export const getUserGoals = catchAsync(async (req, res) => {
  const goals = await Goal.find({ user: req.user._id })
    .populate({
      path: "tasks",
      select: "title status scheduledDate",
      options: { sort: { scheduledDate: 1 } },
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

  const tasks = await Task.find(query).sort({ scheduledDate: 1 });

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
    
    // Delete all tasks associated with this goal
    const taskDeletionResult = await Task.deleteMany({ 
      goal: goalId, 
      user: userId 
    });

    console.log(`Deleted ${taskDeletionResult.deletedCount} tasks for goal ${goalId}`);

    // Update user's activeGoalId if this was the active goal
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId);
    if (user && user.activeGoalId && user.activeGoalId.toString() === goalId) {
      // Find another goal to set as active, or set to null
      const otherGoals = await Goal.find({ 
        user: userId, 
        _id: { $ne: goalId } 
      }).limit(1);
      
      const newActiveGoalId = otherGoals.length > 0 ? otherGoals[0]._id : null;
      await User.findByIdAndUpdate(userId, { 
        activeGoalId: newActiveGoalId,
        $pull: { goals: goalId }
      });
      
      console.log(`Updated user's active goal from ${goalId} to ${newActiveGoalId}`);
    } else {
      // Just remove the goal from user's goals array
      await User.findByIdAndUpdate(userId, { 
        $pull: { goals: goalId }
      });
    }

    // Delete the goal
    await Goal.findByIdAndDelete(goalId);

    console.log(`Successfully deleted goal ${goalId} with ${taskCount} associated tasks`);

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
    
    throw new ErrorResponse(
      "Failed to delete goal and associated data.",
      500
    );
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

// Regenerate AI tasks for an existing goal
export const regenerateGoalTasks = catchAsync(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });

  if (!goal) {
    throw new ErrorResponse("Goal not found", 404);
  }

  // Delete existing tasks for this goal
  await Task.deleteMany({ goal: goal._id });

  // Generate new AI tasks
  try {
    const aiData = await generateTasksForContext({
      userProfile: {
        experienceLevel: goal.userProfile?.experienceLevel || 2,
        timeCommitment: goal.userProfile?.timeCommitment || 3,
        learningStyle: goal.userProfile?.preferredStyle || "balanced",
        motivation: goal.userProfile?.motivation || 3,
      },
      assessment: goal.assessmentData,
      goal: goal.goalSetup,
      roadmap: goal.roadmap?.phases || [],
      currentPhase: goal.currentPhase || 1,
      learningPath: goal.roadmap?.id || "general",
    });

    if (aiData && aiData.tasks) {
      const tasks = aiData.tasks;
      const createdTasks = [];

      // Calculate dates for the entire timeline
      const startDate = new Date();
      const totalDays = goal.timeline * 30;

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        // Determine phase: prefer AI-provided phase
        let phase = Number(task.phase) || 0;
        if (!phase || phase < 1 || phase > numPhases) {
          phase = Math.floor((i / tasks.length) * numPhases) + 1;
        }

        // Increment count for dayNumber sequencing within phase
        phaseCounts[phase - 1] += 1;
        const dayNumber = phaseCounts[phase - 1];

        // Distribute tasks across the timeline
        const dayOffset = Math.floor((i / tasks.length) * totalDays);
        const scheduledDate = new Date(startDate);
        scheduledDate.setDate(startDate.getDate() + dayOffset);

        const newTask = new Task({
          user: req.user._id,
          goal: goal._id,
          title: task.title,
          description: task.description,
          type: task.type || "learning",
          category: task.topics?.[0] || "General",
          difficulty: task.difficulty || 3,
          priority: task.priority || "medium",
          estimatedTime: task.estimatedHours || 1,
          isAIGenerated: true,
          topics: task.topics || [],
          resources: enhanceResourcesWithDefaults(task.resources || [], task.topics || []),
          realWorldApplication: task.realWorldApplication || "",
          successCriteria: task.successCriteria || [],
          scheduledDate,
          phase,
          dayNumber,
          status: "pending",
        });

        await newTask.save();
        createdTasks.push(newTask);
      }

      // Update goal
      goal.tasksGenerated = true;
      goal.totalTasksGenerated = createdTasks.length;
      await goal.save();

      res.json({
        success: true,
        message: "Tasks regenerated successfully!",
        data: {
          goal: goal.toJSON(),
          tasksGenerated: createdTasks.length,
          totalTasks: createdTasks.length,
        },
      });
    } else {
      throw new Error("AI task generation failed");
    }
  } catch (error) {
    console.error("Error regenerating AI tasks:", error);
    throw new ErrorResponse("Failed to regenerate tasks", 500);
  }
});
