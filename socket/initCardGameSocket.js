import { initCardGameSocket } from "./cargameHandler/index.js";

export function initSocket(io) {
  io.on("connection", (socket) => {
    initCardGameSocket(io,socket);
  });
}
