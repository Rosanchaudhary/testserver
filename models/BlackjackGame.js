import mongoose from "mongoose";

const CardSchema = new mongoose.Schema(
  {
    suit: { type: String, required: true },
    rank: { type: String, required: true },
  },
  { _id: false }
);

const BlackjackGameSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },

    deck: [CardSchema], // hidden from client
    playerHand: [CardSchema],
    dealerHand: [CardSchema],

    status: {
      type: String,
      enum: ["playing", "finished"],
      default: "playing",
    },

    result: {
      type: String,
      enum: ["player", "dealer", "push", null],
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BlackjackGame", BlackjackGameSchema);
