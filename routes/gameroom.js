import express from "express";
import GameRoom from "../models/GameRoom.js";
import User from "../models/User.js";

const router = express.Router();

// Create a room
router.post("/create", async (req, res) => {
  try {
    const { userId } = req.body;
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();

    const room = await GameRoom.create({
      code,
      players: [{ userId, seat: "A" }],
    });

    await User.findByIdAndUpdate(userId, { currentRoom: room._id });

    res.json({ room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// Join room by code
router.post("/join", async (req, res) => {
  try {
    const { userId, code } = req.body;
    const room = await GameRoom.findOne({ code });
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (room.players.length >= room.maxPlayers)
      return res.status(400).json({ error: "Room is full" });

    const seat = ["A", "B", "C", "D"][room.players.length];
    room.players.push({ userId, seat });
    await room.save();

    await User.findByIdAndUpdate(userId, { currentRoom: room._id });

    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: "Join failed" });
  }
});

export default router;
