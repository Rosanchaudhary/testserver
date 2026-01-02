import mongoose from "mongoose";

const RouletteGameSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },

    betNumber: { type: Number, min: 0, max: 36 },
    betAmount: { type: Number, default: 0, min: 0 },

    resultNumber: { type: Number, default: null },

    status: {
      type: String,
      enum: ["betting", "finished"],
      default: "betting",
    },

    winAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("RouletteGame", RouletteGameSchema);
