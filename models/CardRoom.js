import mongoose from "mongoose";

const CardSchema = new mongoose.Schema(
  {
    rank: String,
    suit: String,
    playedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // stores userId
  },
  { _id: false }
);

const PlayerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    socketId: { type: String, default: null },
    name: String,
    hand: [CardSchema],
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ready", "not ready", "offline"],
      default: "not ready",
    },
  },
  { _id: false }
);

const CardRoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, unique: true, index: true },

    players: [PlayerSchema], // supports any number of players

    deck: [CardSchema],
    centerPile: [CardSchema],

    turn: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // current player's userId

    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },

    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDraw: { type: Boolean, default: false }, // separate flag for draw
  },
  { timestamps: true }
);

export default mongoose.model("CardRoom", CardRoomSchema);
