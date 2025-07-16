import Task from "../models/Task.js";
import User from "../models/User.js";

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("username email");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const tasks = await Task.find({ user: userId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.data.status === "completed"
    ).length;
    const pendingTasks = tasks.filter(
      (t) => t.data.status === "pending"
    ).length;
    const assignments = tasks.filter(
      (t) => t.data.type === "assignment" && t.data.status === "completed"
    ).length;
    const selfStudy = tasks.filter(
      (t) => t.data.type === "selfStudy" && t.data.status === "completed"
    ).length;
    const lectures = tasks.filter(
      (t) => t.data.type === "lecture" && t.data.status === "completed"
    ).length;

    res.json({
      success: true,
      user,
      dashboard: {
        totalTasks,
        completedTasks,
        pendingTasks,
        statistics: {
          assignments,
          selfStudy,
          lectures,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

export const getStatusHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({ user: userId });
    const days = 14;
    const history = [];

    function calculateDailyProgress(allTasks, currentDate = new Date()) {
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const parseDate = (dateStr) => new Date(dateStr);

      // TASKS THAT WERE PENDING AT START OF DAY
      const tasksPendingAtStartOfDay = allTasks.filter((task) => {
        const createdAt = parseDate(task.createdAt);
        const updatedAt = parseDate(task.updatedAt);
        const status = task.data?.status;

        if (createdAt > endOfDay) return false;
        if (status === "completed" && updatedAt < startOfDay) return false;
        return createdAt <= endOfDay;
      });

      // TASKS COMPLETED TODAY
      const tasksCompletedToday = allTasks.filter((task) => {
        const updatedAt = parseDate(task.updatedAt);
        const status = task.data?.status;
        return (
          status === "completed" &&
          updatedAt >= startOfDay &&
          updatedAt <= endOfDay
        );
      });

      const totalGoal = tasksPendingAtStartOfDay.length;
      const completedCount = tasksCompletedToday.length;
      const completionPercent =
        totalGoal === 0 ? 0 : Math.round((completedCount / totalGoal) * 100);

      return {
        totalGoal,
        completedCount,
        completionPercent,
      };
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const { completionPercent } = calculateDailyProgress(tasks, date);
      history.push({
        date: date.toISOString().slice(0, 10),
        value: completionPercent,
      });
    }

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch status history",
      error: error.message,
    });
  }
};

// New: Calendar daily stats for a month
export const getCalendarDailyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;
    if (!month || !year) {
      return res
        .status(400)
        .json({ success: false, message: "Month and year are required" });
    }
    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);
    if (isNaN(monthInt) || isNaN(yearInt)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid month or year" });
    }
    // Get start and end of month
    const startDate = new Date(yearInt, monthInt, 1);
    const endDate = new Date(yearInt, monthInt + 1, 0, 23, 59, 59, 999);
    // Fetch all tasks for this user in this month
    const tasks = await Task.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate },
    });
    // Prepare daily stats
    const daysInMonth = new Date(yearInt, monthInt + 1, 0).getDate();
    const dailyStats = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearInt, monthInt, day);
      const nextDate = new Date(yearInt, monthInt, day + 1);
      const dateStr = date.toISOString().split("T")[0];
      const dayTasks = tasks.filter(
        (t) => t.createdAt >= date && t.createdAt < nextDate
      );
      const totalTasks = dayTasks.length;
      const completedTasks = dayTasks.filter(
        (t) => t.data.status === "completed"
      ).length;
      const inProgressTasks = dayTasks.filter(
        (t) => t.data.status === "in-progress"
      ).length;
      const pendingTasks = dayTasks.filter(
        (t) => t.data.status === "pending"
      ).length;
      const overdueTasks = dayTasks.filter(
        (t) => t.data.status === "overdue"
      ).length;
      dailyStats[dateStr] = {
        date: dateStr,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks,
        tasks: dayTasks, // Optionally include task details
      };
    }
    res.json({ success: true, dailyStats });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch calendar daily stats",
      error: error.message,
    });
  }
};
