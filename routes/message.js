import express from "express";
import Message from "../models/Message.js";
import Room from "../models/Room.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Send message (also emit)
router.post("/", auth, async (req, res) => {
  const { roomId, content, type } = req.body;

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Must be a participant
    const isInRoom = room.participants.some(p => p.userId.toString() === req.user.id);
    if (!isInRoom)
      return res.status(403).json({ message: "You are not in this room" });

    // Save in DB
    const message = await Message.create({
      roomId,
      senderId: req.user.id,
      content,
      type: type || "text",
    });

    // Emit via Socket.IO
    const io = req.app.get("io");
    io.to(roomId).emit("new-message", {
      _id: message._id,
      roomId,
      senderId: req.user.id,
      content,
      type: message.type,
      createdAt: message.createdAt,
    });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch messages from room
router.get("/:roomId", auth, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .populate("senderId", "name email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
