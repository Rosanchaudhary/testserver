//import { initCardGameSocket } from "./cargameHandler/index.js";

const rooms = {}; 


export function initSocket(io) {
  io.on("connection", (socket) => {
    //initCardGameSocket(io, socket);

    console.log("Connected:", socket.id);

    socket.on("join-room", ({ roomId, player }) => {
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = { players: {} };
      }

      rooms[roomId].players[socket.id] = player;

      // send existing players to new user
      socket.emit("room-state", rooms[roomId].players);

      // notify others
      socket.to(roomId).emit("player-joined", {
        id: socket.id,
        player,
      });

      console.log(`Player joined room ${roomId}`);
    });

    socket.on("player-update", ({ roomId, player }) => {
      if (!rooms[roomId]) return;

      rooms[roomId].players[socket.id] = player;

      socket.to(roomId).emit("player-update", {
        id: socket.id,
        player,
      });
    });

    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        if (rooms[roomId].players[socket.id]) {
          delete rooms[roomId].players[socket.id];

          socket.to(roomId).emit("player-left", socket.id);

          if (Object.keys(rooms[roomId].players).length === 0) {
            delete rooms[roomId];
          }
        }
      }

      console.log("Disconnected:", socket.id);
    });
  });
}
