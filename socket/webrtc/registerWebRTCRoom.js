const roomUsers = {};

export default function registerWebRTCRoom(io, socket) {
  socket.on("join-room-webrtc", ({ roomId }) => {
    socket.join(roomId);

    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    roomUsers[roomId].push(socket.id);
    io.to(roomId).emit("room-user-list", roomUsers[roomId]);
  });

  socket.on("call-user", ({ targetId, offer, from }) => {
    io.to(targetId).emit("incoming-call", { offer, from });
  });

  socket.on("answer-call", ({ targetId, answer, from }) => {
    io.to(targetId).emit("call-answered", { answer, from });
  });

  socket.on("webrtc-ice", ({ targetId, candidate, from }) => {
    io.to(targetId).emit("webrtc-ice", { candidate, from });
  });

  socket.on("end-call", ({ targetId }) => {
    io.to(targetId).emit("call-ended");
  });

  socket.on("disconnect", () => {
    for (const roomId in roomUsers) {
      roomUsers[roomId] = roomUsers[roomId].filter((id) => id !== socket.id);
      io.to(roomId).emit("room-user-list", roomUsers[roomId]);
    }
  });
}
