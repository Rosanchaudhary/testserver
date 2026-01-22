import dotenv from "dotenv";
dotenv.config(); // Load environment variables

import { Router } from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import CardRoom from "../models/CardRoom.js";
import HoldemCardRoom from "../models/HoldemCardRoom.js";
var router = Router();

/**
 * POST /rooms
 * Create a new room (authenticated user is the creator)
 */
router.post("/twocard-rooms", auth, async (req, res) => {
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

router.post("/texascard-rooms", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user data from User model
    const user = await User.findById(userId).select("_id name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    const room = await HoldemCardRoom.create({
      roomId: `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    });

    res.redirect(`/game/holdem/${room.roomId}`);
    //res.status(201).json({ message: "Room created", room });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});

export default router;
