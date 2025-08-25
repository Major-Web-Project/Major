import mongoose from "mongoose";

const AssessmentAnswersSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    answers: {
      type: [Number],
      required: true,
      default: [],
    },
    personalize: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    // Dynamic path field - accepts any string value from frontend
    path: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200, // Reasonable limit for path names
    },
    // Optional: Store additional path metadata for analytics
    pathMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by path
AssessmentAnswersSchema.index({ path: 1 });

export default mongoose.model("AssessmentAnswers", AssessmentAnswersSchema);
