import mongoose from "mongoose";

const CardSchema = new mongoose.Schema(
  {
    rank: {
      type: String,
      enum: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"],
      required: true,
    },
    suit: {
      type: String,
      enum: ["♠", "♥", "♦", "♣"],
      required: true,
    },
  },
  { _id: false },
);

const PlayerSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    socketId: { type: String, default: null },
    name: { type: String, default: "Player" },

    holeCards: { type: [CardSchema], default: [] },
    chips: { type: Number, default: 1000 },
    currentBet: { type: Number, default: 0 },
    hasActed: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["active", "folded", "allin", "waiting"],
      default: "waiting",
    },
  },
  { _id: false },
);

const HoldemCardRoomSchema = new mongoose.Schema(
  {
    roomId: { type: String, unique: true, index: true },

    players: { type: [PlayerSchema], default: [] },

    deck: { type: [CardSchema], default: [] },
    communityCards: { type: [CardSchema], default: [] },

    pot: { type: Number, default: 0 },
    street: {
      type: String,
      enum: ["pre-flop", "flop", "turn", "river", "showdown"],
      default: "pre-flop",
    },

    dealerIndex: { type: Number, default: 0 },
    currentTurnIndex: { type: Number, default: 0 },
    minimumBet: { type: Number, default: 10 },

    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },

    winner: { type: String, default: null },
    isDraw: { type: Boolean, default: false },
    handNumber: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export default mongoose.model("HoldemCardRoom", HoldemCardRoomSchema);
