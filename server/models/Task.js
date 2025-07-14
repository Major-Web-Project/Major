import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // stores the AI-provided task JSON
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
