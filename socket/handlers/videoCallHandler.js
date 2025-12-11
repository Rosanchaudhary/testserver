export default function initializeSocketTwo(io) {
  const roomUsers = {}; // { roomId: [socketIds...] }

  io.on("connection", (socket) => {
    console.log("New socket:", socket.id);

    socket.on("join-room", ({ roomId }) => {
      socket.join(roomId);

      if (!roomUsers[roomId]) roomUsers[roomId] = [];
      roomUsers[roomId].push(socket.id);

      // send updated list to everyone in the room
      io.to(roomId).emit("room-user-list", roomUsers[roomId]);
    });

    socket.on("disconnect", () => {
      // remove from all rooms
      for (const roomId in roomUsers) {
        roomUsers[roomId] = roomUsers[roomId].filter((id) => id !== socket.id);
        io.to(roomId).emit("room-user-list", roomUsers[roomId]);
      }
    });

    // DIRECT OFFER
    socket.on("call-user", ({ targetId, offer, from }) => {
      io.to(targetId).emit("incoming-call", { offer, from });
    });

    // DIRECT ANSWER
    socket.on("answer-call", ({ targetId, answer, from }) => {
      io.to(targetId).emit("call-answered", { answer, from });
    });

    // DIRECT ICE
    socket.on("webrtc-ice", ({ targetId, candidate, from }) => {
      io.to(targetId).emit("webrtc-ice", { candidate, from });
    });

    
    socket.on("end-call", ({ targetId }) => {
      io.to(targetId).emit("call-ended");
    });
  });
}
