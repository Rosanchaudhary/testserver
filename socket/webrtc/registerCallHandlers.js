export default function registerCallHandlers(io, socket) {
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
}
