import mongoose from "mongoose";
import moment from "moment-timezone";

const GoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    field: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    timeline: {
      type: Number, // Number of months
      required: true,
      min: 1,
      max: 24,
    },

    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled"],
      default: "active",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // AI-generated roadmap data
    roadmap: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Raw AI-generated task output (delimited string)
    taskPromptOutput: {
      type: String,
      default: "",
    },
    // User profile data used for task generation
    userProfile: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Assessment data
    assessmentData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Goal setup data
    goalSetup: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Current learning progress
    currentPhase: {
      type: Number,
      default: 1,
    },
    currentDay: {
      type: Number,
      default: 1,
    },
    // Task generation status
    tasksGenerated: {
      type: Boolean,
      default: false,
    },
    isGeneratingTasks: {
      type: Boolean,
      default: false,
    },
    totalTasksGenerated: {
      type: Number,
      default: 0,
    },
    // 5D tasks matrix (phases -> topics -> tasks -> slot[title|description|resources] -> strings)
    // Phase-wise completed task IDs: [{ phase: Number, topic: String, taskIds: [ObjectId] }]
    completedTaskIds: {
      type: [
        {
          phase: { type: Number, required: true },
          topic: { type: String, required: false },
          taskIds: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Task",
            },
          ],
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
GoalSchema.index({ user: 1, status: 1 });
GoalSchema.index({ user: 1, createdAt: -1 });

// Virtual for getting tasks associated with this goal
// Pre-save hook to convert date fields to Asia/Kolkata local time
GoalSchema.pre("save", function (next) {
  if (this.createdAt) {
    this.createdAt = moment(this.createdAt).tz("Asia/Kolkata").toDate();
  }
  if (this.updatedAt) {
    this.updatedAt = moment(this.updatedAt).tz("Asia/Kolkata").toDate();
  }
  if (this.completedAt) {
    this.completedAt = moment(this.completedAt).tz("Asia/Kolkata").toDate();
  }
  next();
});
GoalSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "goal",
});

// Ensure virtuals are included when converting to JSON
GoalSchema.set("toJSON", { virtuals: true });
GoalSchema.set("toObject", { virtuals: true });

// Static method to validate goal data
GoalSchema.statics.validate = function (goalData) {
  const { field, description, timeline } = goalData;
  const errors = [];

  if (!field) errors.push("Field is required");
  if (!description) errors.push("Description is required");
  if (!timeline) errors.push("Timeline is required");
  if (timeline && (timeline < 1 || timeline > 24)) {
    errors.push("Timeline must be between 1 and 24 months");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Instance method to get progress
GoalSchema.methods.getProgress = function () {
  if (!this.roadmap || !this.roadmap.phases) {
    return { progress: 0, currentPhase: 1, totalPhases: 0, isCompleted: false };
  }

  const totalPhases = this.roadmap.phases.length;
  const currentPhase = this.currentPhase;
  const progress = ((currentPhase - 1) / totalPhases) * 100;

  return {
    progress: Math.round(progress),
    currentPhase,
    totalPhases,
    isCompleted: currentPhase > totalPhases,
  };
};

const Goal = mongoose.model("Goal", GoalSchema);
export default Goal;
