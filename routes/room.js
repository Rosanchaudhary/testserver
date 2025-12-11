import express from "express";
import Room from "../models/Room.js";
import auth from "../middleware/auth.js";


const router = express.Router();

// Create room
router.post("/", auth, async (req, res) => {
  try {

    
    const room = await Room.create({
      name: req.body.name,
      participants: [{ userId: req.user.id }],
    });


    res.json(room);
  } catch (err) {

    res.status(500).json({ error: err.message });
  }
});

// Join room
router.post("/:roomId/join", auth, async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const alreadyIn = room.participants.some(p => p.userId.toString() === req.userId);
    if (!alreadyIn) {
      room.participants.push({ userId: req.userId });
      await room.save();
    }

    // emit user joined
    const io = req.app.get("io");
    io.to(roomId).emit("user-joined", { userId: req.userId });

    res.json({ message: "Joined room", room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave room
router.post("/:roomId/leave", auth, async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findByIdAndUpdate(
      roomId,
      {
        $pull: { participants: { userId: req.userId } },
      },
      { new: true }
    );

    const io = req.app.get("io");
    io.to(roomId).emit("user-left", { userId: req.userId });

    res.json({ message: "Left room", room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all rooms for user
router.get("/my", auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      "participants.userId": req.user.id,
    });

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
