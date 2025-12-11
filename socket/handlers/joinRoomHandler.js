// socket/handlers/joinRoomHandler.js
import CardGameRoom from "../../models/CardGameRoom.js";
import { parsePlayers } from "../../utils/twocard/parsePlayers.js";

export default function joinRoomHandler(io, socket) { 
  socket.on("join-room", async ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);

    // Update DB with socket info
    const room = await CardGameRoom.findOneAndUpdate(
      { roomId, "players.user": userId },
      {
        $set: {
          "players.$.socketId": socket.id,
          "players.$.lastActive": new Date(),
        },
      },
      { new: true }
    ).populate("players.user", "name");

    if (!room) return;

    const playerState = parsePlayers(room.players);

    io.to(room.roomId).emit("player-update", {
      playerState,
      turn: room.turn,
    });

    room.players.forEach((player) => {
      io.to(player.socketId).emit("your-hand", player.hand);
    });
  });
}
