import mongoose from "mongoose";
const AssessmentAnswersSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true, unique: true },
  answers: { type: [Number], required: true, default: [] },
  personalize: { type: String, default: "" },
  duration: { type: Number, required: true, min: 1 },
  path: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("AssessmentAnswers", AssessmentAnswersSchema);
