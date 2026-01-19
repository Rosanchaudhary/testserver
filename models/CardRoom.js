import mongoose from "mongoose";

/* =======================
   Card + Player Schemas
======================= */

const CardSchema = new mongoose.Schema(
  {
    rank: String,
    suit: String,
    playedBy: { type: String }, // store userId as string
  },
  { _id: false }
);

const PlayerSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    socketId: { type: String, default: null },
    name: String,
    hand: [CardSchema],
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ready", "offline"],
      default: "ready",
    },
  },
  { _id: false }
);

const CardRoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, unique: true, index: true },
    players: [PlayerSchema],
    centerPile: [CardSchema],
    trumpSuit: String,
    turn: { type: String, default: null },
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },
    winner: { type: String, default: null },
    isDraw: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("CardRoom", CardRoomSchema);
