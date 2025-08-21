import cron from "node-cron";
import TaskGenerationProcess from "../models/TaskGenerationProcess.js";
import Task from "../models/Task.js";
import Goal from "../models/Goal.js";

// Runs every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  try {
    // Find all processes older than 1 hour
    const processes = await TaskGenerationProcess.find({
      startedAt: { $lte: oneHourAgo },
    });
    for (const process of processes) {
      if (process.status !== "completed") {
        // Delete all tasks and the goal for this goalId
        await Task.deleteMany({ goalId: process.goalId });
        await Goal.deleteOne({ _id: process.goalId });
      }
      // Delete the process itself
      await TaskGenerationProcess.deleteOne({ _id: process._id });
    }
  } catch (err) {
    console.error("Error in TaskGenerationProcess cleanup:", err);
  }
});

export default null;
