//route/twocard.js
import express from "express";
import auth from "../middleware/auth.js";
import CardGameRoom from "../models/CardGameRoom.js";
import mongoose from "mongoose";
import { parsePlayers } from "../utils/twocard/parsePlayers.js";
import { startGame } from "../utils/twocard/startGame.js";

const router = express.Router();

// play start
router.post("/", auth, async (req, res) => {
  try {
    // Emit via Socket.IO
    const io = req.app.get("io");
    io.to(req.body.roomId).emit("card-message", req.body.card);

    res.json({ room: "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ CREATE GAME ------------------
router.post("/create", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = await CardGameRoom.create({
      roomId,
      players: [
        {
          user: new mongoose.Types.ObjectId(userId),
        },
      ],
      turn: userId,
      status: "waiting",
    });
    // populate user name
    const populated = await room.populate("players.user", "name");

    res.status(201).json({
      success: true,
      room: populated,
      roomId: populated.roomId,
    });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
});

// ------------------ GET ALL WAITING ROOMS ------------------
router.get("/active", async (req, res) => {
  try {
    const rooms = await CardGameRoom.find(
      { status: "waiting" },
      "roomId players createdAt"
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      rooms,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ------------------ SET PLAYER READY ------------------
router.post("/ready", auth, async (req, res) => {
  try {
    const io = req.app.get("io");
    const userId = req.user.id;
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    // Check room existence
    let room = await CardGameRoom.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check player exists in room
    const player = room.players.find((p) => p.user.toString() === userId);
    if (!player) {
      return res.status(403).json({ error: "You are not in this room" });
    }

    // Check if player already ready
    if (player.ready === true) {
      return res.status(400).json({ error: "Player already marked as ready" });
    }

    // Update player ready state
    room = await CardGameRoom.findOneAndUpdate(
      { roomId, "players.user": userId },
      { $set: { "players.$.ready": true } },
      { new: true }
    ).populate("players.user", "name");

    // Check if all players are ready
    const allReady =
      room.players.length >= 2 && room.players.every((p) => p.ready === true);

    if (allReady) {
      await startGame(io, room);
    } else {
      io.to(room.roomId).emit("player-update", {
        playerState: parsePlayers(room.players),
        turn: room.turn,
      });
    }

    return res.status(200).json({
      success: true,
      allReady,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ------------------ JOIN ROOM ------------------
router.post("/join", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: "Room ID is required" });
    }

    // ---- 1. Check room exists ----
    const room = await CardGameRoom.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // ---- 2. Check if user already joined ----
    const alreadyJoined = room.players.some(
      (p) => p.user.toString() === userId.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({ error: "User already joined the room" });
    }

    // ---- 3. Check if room is full (max 2 players) ----
    if (room.players.length >= 2) {
      return res.status(400).json({ error: "Room is full" });
    }

    // ---- 4. Add new player ----
    room.players.push({
      user: userId,
    });

    await room.save();

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (err) {
    console.error("Join room error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ------------------ PLAY CARD ------------------
router.post("/play-card", auth, async (req, res) => {
  try {
    const io = req.app.get("io");
    const { roomId, userId, card } = req.body;

    if (!roomId || !userId || !card) {
      return res
        .status(400)
        .json({ error: "roomId, userId and card are required" });
    }

    // ---- 1. Get the room first (we need list of players to compute next turn) ----
    const room = await CardGameRoom.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Determine NEXT TURN (circular)
    const playerIds = room.players.map((p) => p.user.toString());
    const currentIndex = playerIds.indexOf(userId.toString());
    const nextIndex = (currentIndex + 1) % playerIds.length;
    const nextTurnUserId = playerIds[nextIndex];

    // ---- 1. Atomically pull the card from user's hand ----
    const updatedRoom = await CardGameRoom.findOneAndUpdate(
      {
        roomId,
        "players.user": userId,
        "players.hand": card, // only update if user actually has this card
      },
      {
        $set: {
          "players.$.center": card,
          "players.$.throw": true,
          "players.$.lastActive": new Date(),
          turn: nextTurnUserId,
        },
        $pull: {
          "players.$.hand": card, // atomic removal of the card
        },
      },
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(400).json({
        error: "Room not found or card does not exist in player's hand",
      });
    }

    // ---- 2. Emit new player state ----
    io.to(roomId).emit("player-update", {
      playerState: parsePlayers(updatedRoom.players),
      turn: updatedRoom.turn,
    });

    // ---- 3. Check if all players have thrown ----
    const allThrown = updatedRoom.players.every((p) => p.throw === true);

    if (allThrown) {
      setTimeout(async () => {
        try {
          const freshRoom = await CardGameRoom.findOne({ roomId });
          if (!freshRoom) return;

          freshRoom.players.forEach((p) => {
            p.throw = false;
            p.center = null;
          });

          const savedRoom = await freshRoom.save();

          io.to(roomId).emit("player-update", {
            playerState: parsePlayers(savedRoom.players),
            turn: savedRoom.turn,
          });
        } catch (err) {
          console.error("Throw reset failed:", err);
        }
      }, 2000);
    }

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (err) {
    console.error("Play card error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
