export default function leaveRoomHandler(io, socket) {
  socket.on("leave-room", ({ roomId, userId }) => {
    socket.leave(roomId);
    console.log(`User ${userId} left room ${roomId}`);

    socket.to(roomId).emit("user-left", { userId });
  });
}
