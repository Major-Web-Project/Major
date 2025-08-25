import moment from "moment-timezone";
import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
    },
    // Task details
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["learning", "practice", "project", "review"],
      default: "learning",
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    estimatedTime: {
      type: Number, // in hours
      default: 1,
    },
    status: {
      type: String,
      enum: ["queued", "pending", "in_progress", "completed", "cancelled"],
      default: "queued",
    },
    // Gated Sequential Task System fields
    sequenceOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    assignedDate: {
      type: Date,
      default: () => {
        const now = new Date();
        return new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        );
      },
      required: true,
    },
    // AI-specific fields
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
    // AI-generated task metadata
    aiMetadata: {
      ptt: { type: String }, // Phase-Topic-Task identifier (e.g., "001")
      phase: { type: Number }, // Phase number
      topic: { type: Number }, // Topic number
      task: { type: Number }, // Task number
      resources: [
        {
          type: { type: String },
          title: { type: String },
          url: { type: String },
        },
      ],
      originalDuration: { type: String }, // Original duration string from AI
    },
    resources: [
      {
        type: {
          type: String,
          enum: [
            "video",
            "article",
            "documentation",
            "project",
            "github",
            "tutorial",
            "course",
            "book",
            // Extended to support AI outputs
            "tool",
            "other",
          ],
        },
        title: String,
        url: String,
        description: String,
      },
    ],
    // Topics/tags for the task (missing earlier, used by controllers/UI)
    topics: [
      {
        type: String,
        trim: true,
      },
    ],
    realWorldApplication: {
      type: String,
      trim: true,
    },
    successCriteria: [
      {
        type: String,
        trim: true,
      },
    ],
    // Task scheduling
    scheduledDate: {
      type: Date,
      default: () => {
        const now = new Date();
        return new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        );
      },
      required: false, // Not required for queued tasks
    },
    // --- Simplified Carry Forward Tracking (single document) ---
    // Total number of times this task has been carried (not completed by end of day)
    carriedCount: {
      type: Number,
      default: 0,
    },
    // Flag set true if this task has been carried at least once
    wasEverCarried: {
      type: Boolean,
      default: false,
      index: true,
    },
    // The last date (start-of-day) when the task was carried forward
    lastCarriedDate: {
      type: Date,
      index: true,
    },
    // Whether the task is considered "active for today" (assignedDate adjusted)
    isCarriedToday: {
      type: Boolean,
      default: false,
      index: true,
    },
    phase: {
      type: Number,
      default: 1,
    },
    // Day number within a phase (referenced in controllers)
    dayNumber: {
      type: Number,
      default: 1,
    },
    // Submission data
    submissionType: {
      type: String,
      enum: ["pdf", "excel", "link", "text", "none"],
    },
    submissionText: {
      type: String,
    },
    submissionLink: {
      type: String,
    },
    // Reference to GridFS file id (hex string)
    submissionFile: {
      type: String,
    },
    submissionFileName: {
      type: String,
    },
    submissionContentType: {
      type: String,
    },
    submittedAt: {
      type: Date,
    },
    actualTime: {
      type: Number, // actual time spent in hours
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TaskSchema.index({ user: 1, goal: 1 });
TaskSchema.index({ user: 1, scheduledDate: 1 });
TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ goal: 1, scheduledDate: 1 });
// Gated Sequential Task System indexes
TaskSchema.index({ user: 1, goal: 1, status: 1, sequenceOrder: 1 });
TaskSchema.index({ goal: 1, status: 1, sequenceOrder: 1 });
// Carry Forward indexes
TaskSchema.index({ user: 1, goal: 1, wasEverCarried: 1 });

// Virtual for formatted task data (for backward compatibility)
TaskSchema.virtual("formattedData").get(function () {
  return {
    id: this._id,
    name: this.title,
    title: this.title,
    description: this.description,
    status: this.status,
    priority: this.priority,
    notes: this.description,
    estimatedTime: this.estimatedTime,
    completionTime: this.actualTime,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    submissionType: this.submissionType,
    submissionFile: this.submissionFile,
    submissionFileName: this.submissionFileName,
    submissionContentType: this.submissionContentType,
    actualTime: this.actualTime,
    submittedAt: this.submittedAt,
    category: this.category,
    isAIGenerated: this.isAIGenerated,
    // Include AI-specific fields at root level for easier access
    topics: this.topics,
    resources: this.resources,
    realWorldApplication: this.realWorldApplication,
    successCriteria: this.successCriteria,
    phase: this.phase,
    sequenceOrder: this.sequenceOrder,
    assignedDate: this.assignedDate,
    goal: this.goal,
    carriedCount: this.carriedCount,
    wasEverCarried: this.wasEverCarried,
    lastCarriedDate: this.lastCarriedDate,
    isCarriedToday: this.isCarriedToday,
    data: {
      ...this.data,
      title: this.title,
      description: this.description,
      type: this.type,
      category: this.category,
      difficulty: this.difficulty,
      priority: this.priority,
      estimatedTime: this.estimatedTime,
      status: this.status,
      isAIGenerated: this.isAIGenerated,
      topics: this.topics,
      resources: this.resources,
      realWorldApplication: this.realWorldApplication,
      successCriteria: this.successCriteria,
      scheduledDate: this.scheduledDate,
      phase: this.phase,
      sequenceOrder: this.sequenceOrder,
      assignedDate: this.assignedDate,
      submissionType: this.submissionType,
      submissionFile: this.submissionFile,
      submissionText: this.submissionText,
      submissionLink: this.submissionLink,
      submittedAt: this.submittedAt,
      actualTime: this.actualTime,
      carriedCount: this.carriedCount,
      wasEverCarried: this.wasEverCarried,
      lastCarriedDate: this.lastCarriedDate,
      isCarriedToday: this.isCarriedToday,
    },
  };
});

// Ensure virtuals are included when converting to JSON

// Pre-save hook to convert date fields to Asia/Kolkata local time
TaskSchema.pre("save", function (next) {
  if (this.scheduledDate) {
    this.scheduledDate = moment(this.scheduledDate).tz("Asia/Kolkata").toDate();
  }
  if (this.assignedDate) {
    this.assignedDate = moment(this.assignedDate).tz("Asia/Kolkata").toDate();
  }
  if (this.createdAt) {
    this.createdAt = moment(this.createdAt).tz("Asia/Kolkata").toDate();
  }
  if (this.updatedAt) {
    this.updatedAt = moment(this.updatedAt).tz("Asia/Kolkata").toDate();
  }
  next();
});
TaskSchema.set("toJSON", { virtuals: true });
TaskSchema.set("toObject", { virtuals: true });

const Task = mongoose.model("Task", TaskSchema);
export default Task;
