import mongoose from "mongoose";


const RouletteGameSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    betNumber: {
      type: String,
      enum: [
        "0","00","1","2","3","4","5","6","7","8","9",
        "10","11","12","13","14","15","16","17","18",
        "19","20","21","22","23","24","25","26","27",
        "28","29","30","31","32","33","34","35","36"
      ],
      required: true
    },

    betAmount: { type: Number, required: true, min: 1 },

    resultNumber: { type: String, default: null },

    winAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["betting", "finished"],
      default: "betting"
    },

    locked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("RouletteGame", RouletteGameSchema);
