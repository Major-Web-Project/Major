// Assign the first two tasks in sequential order when goal is created (proper sequential logic)
export const assignFirstTwoTasksForToday = async (userId, goalId) => {
  try {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Find the first two tasks in sequential order (lowest sequenceOrder) that are still queued
    const tasksToAssign = await Task.find({
      user: userId,
      goal: goalId,
      status: "queued",
    })
      .sort({ sequenceOrder: 1 })
      .limit(2);

    if (tasksToAssign.length === 0) {
      // No queued tasks found for initial assignment
      return [];
    }

    // Only assign the first two tasks for today
    for (const task of tasksToAssign) {
      task.status = "pending";
      task.assignedDate = startOfDay;
      task.scheduledDate = startOfDay;
      await task.save();
    }

    // All other tasks remain queued with no assignedDate/scheduledDate
    // (Do not update any other tasks here)

    return tasksToAssign;
  } catch (error) {
    // Error assigning first two tasks for today
    throw error;
  }
};
import cron from "node-cron";
import Task from "../models/Task.js";
import Goal from "../models/Goal.js";
import { ensureCarryForward } from "../controllers/taskController.js";

// Midnight task assignment - runs at 12:00 AM every day
export const startTaskScheduler = () => {
  // Run at midnight (00:00) every day in Asia/Kolkata local time
  cron.schedule(
    "0 0 * * *",
    async () => {
      await assignMidnightTasks();
    },
    {
      timezone: "Asia/Kolkata", // Use local India time for midnight
    }
  );
};

// Assign next sequential task to all active goals at midnight
const assignMidnightTasks = async () => {
  try {
    // Get all active goals
    const activeGoals = await Goal.find({
      isActive: true, // Assuming goals have an isActive field
    }).populate("user");

    for (const goal of activeGoals) {
      try {
        await assignNextTaskForGoal(goal.user._id, goal._id);
      } catch (error) {
        console.error(
          `[TaskScheduler] Failed to assign task for goal ${goal._id}:`,
          error
        );
        // Continue with other goals even if one fails
      }
    }
  } catch (error) {
    console.error("[TaskScheduler] Error in midnight task assignment:", error);
  }
};

// Assign next sequential task for a specific goal (only if previous day's tasks are completed)
const assignNextTaskForGoal = async (userId, goalId) => {
  try {
    // Establish day boundaries first
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    // Normalize stale tasks (moves assignedDate to today)
    await ensureCarryForward(userId, goalId);

    // Check if user has any pending/in_progress tasks from today
    const todaysPending = await Task.find({
      user: userId,
      goal: goalId,
      assignedDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "in_progress"] },
    });

    if (todaysPending.length > 0) {
      console.log(
        `[TaskScheduler] User has ${todaysPending.length} pending tasks for today, not assigning new tasks`
      );
      return; // Don't assign new tasks if current day's tasks aren't completed
    }

    // Check if user completed yesterday's tasks before assigning new ones
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );
    const endOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
      999
    );

    const yesterdaysPending = await Task.find({
      user: userId,
      goal: goalId,
      assignedDate: { $gte: startOfYesterday, $lte: endOfYesterday },
      status: { $in: ["pending", "in_progress"] },
    });

    if (yesterdaysPending.length > 0) {
      console.log(
        `[TaskScheduler] User has ${yesterdaysPending.length} incomplete tasks from yesterday, not assigning new tasks`
      );
      return; // Don't assign new tasks if yesterday's tasks aren't completed
    }

    // Find next two queued tasks in sequential order
    const nextQueuedTasks = await Task.find({
      user: userId,
      goal: goalId,
      status: "queued",
    })
      .sort({ sequenceOrder: 1 })
      .limit(2);

    if (nextQueuedTasks.length > 0) {
      for (const task of nextQueuedTasks) {
        task.status = "pending";
        task.assignedDate = startOfDay;
        task.scheduledDate = startOfDay;
        await task.save();
        // Optionally log assignment
        // console.log(`[TaskScheduler] Assigned task ${task.sequenceOrder} (${task.title}) to user for today`);
      }
    } else {
      // console.log(`[TaskScheduler] No more queued tasks available for goal ${goalId}`);
    }
  } catch (error) {
    console.error(
      `[TaskScheduler] Error assigning task for user ${userId}, goal ${goalId}:`,
      error
    );
    throw error;
  }
};

// Manual task assignment (when user clicks "Generate New Task") - follows sequential order
export const assignNextTaskManually = async (userId, goalId) => {
  try {
    // Prepare carry-forward tasks so user isn't blocked by past days
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    await ensureCarryForward(userId, goalId);

    // Check if user has pending tasks for today
    const todaysPending = await Task.find({
      user: userId,
      goal: goalId,
      assignedDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "in_progress"] },
    });

    if (todaysPending.length > 0) {
      throw new Error(
        "Complete today's pending tasks before requesting a new one"
      );
    }

    // Find next queued task in sequential order
    const nextQueuedTask = await Task.findOne({
      user: userId,
      goal: goalId,
      status: "queued",
    }).sort({ sequenceOrder: 1 }); // Get next task in sequence (0, 1, 2, 3...)

    if (!nextQueuedTask) {
      // Check if goal is completed (all tasks are completed)
      const totalTasks = await Task.countDocuments({
        user: userId,
        goal: goalId,
      });

      const completedTasks = await Task.countDocuments({
        user: userId,
        goal: goalId,
        status: "completed",
      });

      if (totalTasks > 0 && completedTasks === totalTasks) {
        // Update goal status to completed
        await Goal.findByIdAndUpdate(goalId, {
          status: "completed",
          completedAt: new Date(),
        });
        throw new Error(
          "Congratulations! You have completed all tasks for this goal. Your goal is now marked as completed."
        );
      } else {
        throw new Error(
          "No more tasks available in the sequence. Please check if there are any issues with task generation."
        );
      }
    }

    // Assign the next sequential task to today
    nextQueuedTask.status = "pending";
    nextQueuedTask.assignedDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    nextQueuedTask.scheduledDate = nextQueuedTask.assignedDate;
    await nextQueuedTask.save();

    console.log(
      `[TaskScheduler] Manually assigned next sequential task ${nextQueuedTask.sequenceOrder} (${nextQueuedTask.title}) to user`
    );
    return [nextQueuedTask];
  } catch (error) {
    console.error(`[TaskScheduler] Error in manual task assignment:`, error);
    throw error;
  }
};

export default {
  startTaskScheduler,
  assignNextTaskManually,
  assignNextTaskForGoal,
};
