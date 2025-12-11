import { roomUsers } from "./roomUsersStore.js";

export default function registerWebRTCRoom(io, socket) {
  socket.on("join-room-webrtc", ({ roomId }) => {
    socket.join(roomId);

    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    roomUsers[roomId].push(socket.id);
    io.to(roomId).emit("room-user-list", roomUsers[roomId]);
  });



  socket.on("disconnect", () => {
    for (const roomId in roomUsers) {
      roomUsers[roomId] = roomUsers[roomId].filter((id) => id !== socket.id);
      io.to(roomId).emit("room-user-list", roomUsers[roomId]);
    }
  });
}
