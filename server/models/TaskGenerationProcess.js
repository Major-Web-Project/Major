import mongoose from "mongoose";

const TaskGenerationProcessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed"],
      default: "pending",
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    error: { type: String },
  },
  {
    timestamps: true,
  }
);

const TaskGenerationProcess = mongoose.model(
  "TaskGenerationProcess",
  TaskGenerationProcessSchema
);

export default TaskGenerationProcess;
