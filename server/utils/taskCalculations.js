import WeeklyActivity from "../models/WeeklyActivity.js";
import Task from "../models/Task.js";
import moment from "moment-timezone";

/**
 * Calculates and stores advanced weekly activity stats for a user.
 * Updates/creates WeeklyActivity for the current week (Mon-Sun).
 * Tracks: total/completed tasks, daily breakdown, streak, averages, best day, etc.
 * @param {string|ObjectId} userId
 */
export const calculateAndStoreWeeklyActivity = async (userId) => {
  // Get start of current week (Monday)
  const now = moment().tz("UTC");
  const weekStart = now.clone().startOf("isoWeek").toDate();
  const weekEnd = now.clone().endOf("isoWeek").toDate();

  // Get all tasks for this user in this week
  const tasks = await Task.find({
    user: userId,
    assignedDate: { $gte: weekStart, $lte: weekEnd },
  });

  // Prepare daily stats
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayStats = daysOfWeek.map((day, i) => {
    const dayStart = moment(weekStart).add(i, "days").toDate();
    const dayEnd = moment(dayStart).endOf("day").toDate();
    const dayTasks = tasks.filter(
      (t) => t.assignedDate >= dayStart && t.assignedDate <= dayEnd
    );
    const completed = dayTasks.filter((t) => t.status === "completed").length;
    const goal = dayTasks.length;
    return { day, goal, completed };
  });

  // Totals
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  // Averages
  const avgGoal =
    dayStats.reduce((sum, d) => sum + d.goal, 0) / daysOfWeek.length;
  const avgCompleted =
    dayStats.reduce((sum, d) => sum + d.completed, 0) / daysOfWeek.length;

  // Streak calculation (consecutive days with completed > 0)
  let streak = 0;
  for (let i = daysOfWeek.length - 1; i >= 0; i--) {
    if (dayStats[i].completed > 0) {
      streak++;
    } else {
      break;
    }
  }

  // Best day (most completed)
  let bestDay = null;
  let maxCompleted = 0;
  dayStats.forEach((d) => {
    if (d.completed > maxCompleted) {
      maxCompleted = d.completed;
      bestDay = d.day;
    }
  });

  // Upsert WeeklyActivity
  await WeeklyActivity.findOneAndUpdate(
    { user: userId, weekStart },
    {
      user: userId,
      weekStart,
      days: dayStats,
      totalTasks,
      completedTasks,
      avgGoal,
      avgCompleted,
      streak,
      bestDay,
      createdAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};
// Task calculation utilities based on task_count_by_duration.js reference

/**
 * Calculate basic task requirements based only on months.
 * @param {number} months - Timeline in months (1-24)
 * @returns {object} - Object containing task requirements
 */
export const calculateTaskRequirements = (months) => {
  // Ensure months is a valid number between 1-24
  const validMonths = Math.max(1, Math.min(24, Number(months)));
  const totalDays = Math.max(30, Math.round(validMonths * 30));
  return {
    months: validMonths,
    totalDays,
    // Add more fields as needed, but no userProfile logic
  };
};

// All other logic removed. Only months-based calculation remains.

/**
 * Calculate task complexity based on user's time commitment and experience level
 * @param {number} timeCommitment - User's time commitment (1-5)
 * @param {number} experienceLevel - User's experience level (1-5)
 * @returns {object} - Task complexity configuration
 */
const calculateTaskComplexity = (timeCommitment, experienceLevel) => {
  // Higher time commitment + higher experience = more complex, comprehensive tasks
  const complexityScore = timeCommitment * 0.6 + experienceLevel * 0.4;

  if (complexityScore >= 4.5) {
    return {
      level: "Expert",
      type: "Comprehensive Projects",
      description: "Complex, multi-part projects combining multiple concepts",
      taskMultiplier: 0.8, // Still comprehensive but more tasks for engagement
    };
  } else if (complexityScore >= 3.5) {
    return {
      level: "Advanced",
      type: "Integrated Challenges",
      description: "Multi-topic tasks with real-world applications",
      taskMultiplier: 0.85, // Good balance of complexity and frequency
    };
  } else if (complexityScore >= 2.5) {
    return {
      level: "Intermediate",
      type: "Focused Sessions",
      description: "Single-topic deep dives with practical exercises",
      taskMultiplier: 0.9, // Slightly more tasks for engagement
    };
  } else {
    return {
      level: "Beginner",
      type: "Guided Learning",
      description: "Step-by-step learning with clear guidance",
      taskMultiplier: 1.0, // More frequent, smaller tasks for beginners
    };
  }
};

/**
 * Calculate optimal task count using hybrid approach: 80% baseline + user capacity adjustment + realistic completion check
 * @param {number} totalDays - Total calendar days in timeline
 * @param {number} effectiveStudyDays - Actual days user will study
 * @param {number} dailyHours - Available hours per day
 * @param {object} taskComplexity - Task complexity configuration
 * @param {number} daysPerWeek - Days per week user can study
 * @param {number} experienceLevel - User's experience level (1-5)
 * @param {number} consistency - User's consistency level (1-5)
 * @returns {number} - Optimal number of tasks
 */
const calculateOptimalTaskCount = (
  totalDays,
  effectiveStudyDays,
  dailyHours,
  taskComplexity,
  daysPerWeek,
  experienceLevel,
  consistency
) => {
  // Parameter validation to prevent undefined errors
  if (typeof experienceLevel !== "number" || typeof consistency !== "number") {
    // ...existing code...
    // For AI prompt use, fallback to simple base hours
    const aiBaseTaskHours = getBaseTaskHours(userProfile);
    // ...existing code...

    // SMART TASK SIZING: Adjust task duration based on user capacity and experience
    // Lower capacity users get shorter, easier tasks
    // Higher capacity users get longer, more complex tasks
    const baseTaskHours = getBaseTaskHours(
      dailyHours,
      daysPerWeek,
      taskComplexity
    );
    const capacityBasedTasks = Math.round(totalAvailableHours / baseTaskHours);

    // HYBRID APPROACH: Use the higher of baseline or capacity-based count
    // This ensures we have enough tasks for engagement while respecting user capacity
    const optimalTaskCount = Math.max(baselineMinTasks, capacityBasedTasks);

    // REALISTIC COMPLETION CAPACITY CHECK
    // Consider user's experience level and consistency for realistic task completion
    const experienceMultiplier = experienceLevel / 5; // 0.2 to 1.0
    const consistencyMultiplier = consistency / 5; // 0.2 to 1.0
    const realismFactor = (experienceMultiplier + consistencyMultiplier) / 2; // Average of both

    // Calculate maximum tasks user can realistically complete
    // Based on: study days available, task complexity, and user capability
    // BUT: Don't let realism factor go below 0.5 to avoid too few tasks
    const adjustedRealismFactor = Math.max(0.5, realismFactor); // Minimum 50% capacity
    const maxTasksPerStudyDay = Math.min(
      1.5, // Never more than 1.5 tasks per study day
      adjustedRealismFactor * 2 // Experience/consistency affects max tasks per day
    );
    const realisticMaxTasks = Math.round(
      effectiveStudyDays * maxTasksPerStudyDay
    );

    // REASONABLE LIMITS: Ensure task count is within practical bounds
    // IMPORTANT: Always respect the 80% baseline as minimum
    const maxReasonableTasks = Math.max(
      baselineMinTasks, // Never go below 80% baseline
      Math.min(
        totalDays, // Never more than total days
        realisticMaxTasks, // Never more than user can realistically complete
        effectiveStudyDays * 1.5 // Original safety limit
      )
    );
    const minReasonableTasks = baselineMinTasks; // Use only the 80% baseline, no arbitrary minimum

    // Final task count: ALWAYS respect the 80% baseline minimum
    const finalTaskCount = Math.max(
      minReasonableTasks,
      Math.min(optimalTaskCount, maxReasonableTasks)
    );

    // Debug logging to understand task count calculation
    console.log(`🔍 Task Count Calculation Debug:
    - Total Days: ${totalDays}
    - Effective Study Days: ${effectiveStudyDays}
    - Experience Level: ${experienceLevel}/5
    - Consistency: ${consistency}/5
    - Realism Factor: ${realismFactor.toFixed(
      2
    )} → Adjusted: ${adjustedRealismFactor.toFixed(2)}
    - Max Tasks Per Study Day: ${maxTasksPerStudyDay.toFixed(2)}
    - Baseline Min Tasks (80%): ${baselineMinTasks}
    - Capacity Based Tasks: ${capacityBasedTasks}
    - Realistic Max Tasks: ${realisticMaxTasks}
    - Optimal Task Count: ${optimalTaskCount}
    - Max Reasonable Tasks: ${maxReasonableTasks}
    - FINAL TASK COUNT: ${finalTaskCount}`);

    return finalTaskCount;
  }

  /**
   * Calculate base task hours based on user capacity and complexity level
   * @param {number} dailyHours - Hours available per day
   * @param {number} daysPerWeek - Days per week available
   * @param {object} taskComplexity - Task complexity configuration
   * @returns {number} - Base hours per task
   */
  const getBaseTaskHours = (dailyHours, daysPerWeek, taskComplexity) => {
    // Calculate user's weekly capacity
    const weeklyHours = dailyHours * daysPerWeek;

    // Base task hours depend on user's weekly capacity and experience level
    let baseHours;

    if (weeklyHours >= 35) {
      // High capacity (35+ hours/week)
      baseHours =
        taskComplexity.level === "Expert"
          ? 4
          : taskComplexity.level === "Advanced"
          ? 3
          : taskComplexity.level === "Intermediate"
          ? 2.5
          : 2;
    } else if (weeklyHours >= 20) {
      // Medium capacity (20-34 hours/week)
      baseHours =
        taskComplexity.level === "Expert"
          ? 3
          : taskComplexity.level === "Advanced"
          ? 2.5
          : taskComplexity.level === "Intermediate"
          ? 2
          : 1.5;
    } else if (weeklyHours >= 10) {
      // Low capacity (10-19 hours/week)
      baseHours =
        taskComplexity.level === "Expert"
          ? 2.5
          : taskComplexity.level === "Advanced"
          ? 2
          : taskComplexity.level === "Intermediate"
          ? 1.5
          : 1;
    } else {
      // Very low capacity (< 10 hours/week)
      baseHours =
        taskComplexity.level === "Expert"
          ? 2
          : taskComplexity.level === "Advanced"
          ? 1.5
          : taskComplexity.level === "Intermediate"
          ? 1
          : 0.5;
    }

    if (isNaN(baseHours)) {
      console.error("[ERROR] getBaseTaskHours returned NaN:", {
        dailyHours,
        daysPerWeek,
        taskComplexity,
      });
      return 1; // Default to 1 hour per task if calculation fails
    }
    return baseHours;
  };

  /**
   * Get workload intensity level based on tasks per day and available hours
   * @param {number} tasksPerDay - Average tasks per day
   * @param {number} dailyHours - Available hours per day
   * @returns {string} - Intensity level
   */
  const getWorkloadIntensity = (tasksPerDay, dailyHours = 3) => {
    const hoursPerTask = dailyHours / tasksPerDay;

    if (hoursPerTask <= 1.5) return "Intensive";
    if (hoursPerTask <= 2.5) return "Moderate";
    if (hoursPerTask <= 4) return "Light";
    return "Very Light";
  };

  /**
   * Get supported duration options with their task requirements
   * @param {object} userProfile - User's assessment profile
   * @returns {array} - Array of duration options with task counts
   */
  const getSupportedDurations = (userProfile = {}) => {
    const durations = [1, 2, 3, 4, 6, 12];

    return durations.map((months) => ({
      months,
      label: `${months} Month${months > 1 ? "s" : ""}`,
      ...calculateTaskRequirements(months, userProfile),
    }));
  };

  /**
   * Print task count breakdown for all supported durations (for debugging)
   * @param {object} userProfile - User's assessment profile for personalized breakdown
   */
  const printTaskCountBreakdown = (userProfile = {}) => {
    const timeCommitment = userProfile.timeCommitment || 3;
    const experienceLevel = userProfile.experienceLevel || 2;
    const dailyHoursMap = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 7 };
    const dailyHours = dailyHoursMap[Math.round(timeCommitment)] || 3;

    console.log("=== SMART TASK GENERATION BREAKDOWN ===");
    console.log(
      `User Profile: Time Commitment ${timeCommitment}/5 (${dailyHours}h/day), Experience Level ${experienceLevel}/5`
    );
    console.log("\n📊 OPTIMIZED TASK COUNT BREAKDOWN:");
    console.log(
      "Duration | Tasks | Hrs/Task | Task Type | Complexity | Utilization"
    );
    console.log(
      "---------|-------|----------|-----------|------------|------------"
    );

    const durations = getSupportedDurations(userProfile);
    // All debug logging removed
  };
};
