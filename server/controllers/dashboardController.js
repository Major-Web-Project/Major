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

    res.json({
      success: true,
      user,
      dashboard: {
        totalTasks,
        completedTasks,
        pendingTasks,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch dashboard data",
        error: error.message,
      });
  }
};
