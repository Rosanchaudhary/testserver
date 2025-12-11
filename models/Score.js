import { Schema, model, models } from "mongoose";

const scoreSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  turns: Number,
  timestamp: { type: Date, default: Date.now },
});

export default models.Score || model("Score", scoreSchema);
