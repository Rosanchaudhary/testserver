import dotenv from "dotenv";
dotenv.config(); // Load environment variables

import { Router } from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import CardRoom from "../models/CardRoom.js";
var router = Router();

/**
 * POST /rooms
 * Create a new room (authenticated user is the creator)
 */
router.post("/rooms", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user data from User model
    const user = await User.findById(userId).select("_id name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create new room with random ID
    const room = new CardRoom({
      roomId: `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      players: [
        {
          userId: user._id,
          name: user.name,
          status: "ready", // creator is ready by default
        },
      ],
      status: "waiting",
    });

    await room.save();
    res.redirect(`/game/twocard/${room.roomId}`);
    //res.status(201).json({ message: "Room created", room });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});

/**
 * GET /rooms
 * Get list of playable rooms (status === "waiting")
 */
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await CardRoom.find({ status: "waiting" })
      .select("roomId players status")
      .lean();

    const playableRooms = rooms.map((room) => {
      const readyPlayers = room.players.filter(
        (p) => p.status === "ready",
      ).length;
      return {
        ...room,
        totalPlayers: room.players.length,
        readyPlayers,
      };
    });

    res.json(playableRooms);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});

export default router;
