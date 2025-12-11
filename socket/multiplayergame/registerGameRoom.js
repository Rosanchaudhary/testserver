//server
const players = {};
let spawnIndex = 0;

// 4 spawn locations
const spawnPoints = [
  { x: 9.76911735534668, y: 0.4989301562309265, z: 10.357857704162598 },
  { x: -9.955224990844727, y: 0.4989301562309265, z: 12.845165252685547 },
  { x: 10.84475326538086, y: 0.4989301562309265, z: -10.73333740234375 },
  { x: -9.590840339660645, y: 0.4989301562309265, z: -9.496594429016113 },
];

export default function registerGameRoom(io, socket) {
  socket.on("join-game-room", ({ roomId }) => {
    socket.join(roomId);

    const spawn = spawnPoints[spawnIndex % spawnPoints.length];
    spawnIndex++;

    const spawnPos = {
      ...spawn,
      x: spawn.x + (Math.random() - 0.5),
      z: spawn.z + (Math.random() - 0.5),
    };

    players[socket.id] = {
      id: socket.id,
      health: 100,
      dead: false,
      position: { ...spawnPos },
    };

    //socket.to(roomId).emit("player-joined", players[socket.id]);
    socket.emit("player-joined", players[socket.id]);
  });

  // Movement
  socket.on("position", ({ roomId, x, y, z }) => {
    const player = players[socket.id];
    if (!player) return;
    if (player.dead) return;

    player.position = { x, y, z };
    socket.to(roomId).emit("player-state", player);
  });

  // Damage
  socket.on("damage-player", ({ roomId, targetId, damage }) => {
    const player = players[targetId];
    if (!player || player.dead) return;

    player.health = Math.max(0, player.health - damage);

    io.to(roomId).emit("player-state", player);

    if (player.health <= 0) {
      player.dead = true;
      io.to(roomId).emit("player-state", player);

      // AUTO RESPAWN AFTER 3 SECONDS
      setTimeout(() => {
        const spawn = spawnPoints[spawnIndex % spawnPoints.length];
        spawnIndex++;

        player.health = 100;
        player.dead = false;
        player.position = { ...spawn };

        io.to(roomId).emit("player-respawned", player);
      }, 3000);
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("player-left", { playerId: socket.id });
  });
}
