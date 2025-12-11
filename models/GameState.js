//models/GameState.ts
import mongoose, { Schema, model, models } from "mongoose";

const actionLogSchema = new Schema(
  {
    player: { type: String }, // seat or userId
    action: { type: String }, // "played 10H", "picked KD"
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const handSchema = new Schema(
  {
    A: [{ type: String }],
    B: [{ type: String }],
    C: [{ type: String }],
    D: [{ type: String }],
  },
  { _id: false }
);

const gameStateSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "GameRoom", required: true },
    turnOrder: { type: [String], default: [] }, // ["A", "B", "C", "D"]
    currentPlayer: { type: String, enum: ["A", "B", "C", "D"], default: null },
    phase: {
      type: String,
      enum: ["deal", "play", "score"],
      default: "deal",
    },
    hands: { type: handSchema, default: () => ({ A: [], B: [], C: [], D: [] }) },
    centerCards: {
      type: Map,
      of: String, // e.g. { A: "10H", B: "KD" }
      default: {},
    },
    round: { type: Number, default: 1 },
    lastAction: { type: String, default: null },
    actionLog: { type: [actionLogSchema], default: [] },
  },
  { timestamps: true }
);

export default models.GameState || model("GameState", gameStateSchema);
