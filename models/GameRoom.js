//models/GameRoom.ts
import mongoose, { Schema, model, models } from "mongoose";

const playerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seat: { type: String, enum: ["A", "B", "C", "D"], required: true },
    isReady: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    connected: { type: Boolean, default: true },
  },
  { _id: false }
);

const gameRoomSchema = new Schema(
  {
    code: { type: String, unique: true, required: true }, // short room code for joining
    players: { type: [playerSchema], default: [] },
    maxPlayers: { type: Number, default: 4 },
    status: {
      type: String,
      enum: ["waiting", "dealing", "playing", "scoring", "finished"],
      default: "waiting",
    },
    currentTurn: { type: String, enum: ["A", "B", "C", "D"], default: null },
    currentState: { type: Schema.Types.ObjectId, ref: "GameState", default: null },
    deck: { type: [String], default: [] }, // e.g. ["AS", "10H", ...]
    discardPile: { type: [String], default: [] },
    winner: { type: Schema.Types.ObjectId, ref: "User", default: null },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

// Optional: automatically clean up old rooms (6 hours after creation)
gameRoomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 21600 });

export default models.GameRoom || model("GameRoom", gameRoomSchema);
