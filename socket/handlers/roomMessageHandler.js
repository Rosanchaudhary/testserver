// socket/handlers/roomMessageHandler.js

export default function roomMessageHandler(io, socket) {
  socket.on("room-message", ({ roomId, userId, message }) => {
    io.to(roomId).emit("room-message", {
      userId,
      message,
      time: Date.now(),
    });
  });
}
