const players = {};
let spawnIndex = 0;

const spawnPoints = [
  { x: 9.76911735534668, y: 0.4989301562309265, z: 10.357857704162598 },
  { x: -9.955224990844727, y: 0.4989301562309265, z: 12.845165252685547 },
  { x: 10.84475326538086, y: 0.4989301562309265, z: -10.73333740234375 },
  { x: -9.590840339660645, y: 0.4989301562309265, z: -9.496594429016113 },
];

export default function battleDroneGame(io, socket) {
  socket.on("join-drone-game-room", ({ roomId }) => {
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
      rotation: { x: 0, y: 0, z: 0 },
    };

    socket.emit("drone-game-player-joined", players[socket.id]);
  });

  // Movement + rotation update
  socket.on("drone-game-player-position", ({ roomId, position, rotation }) => {
    
    const player = players[socket.id];
    if (!player || player.dead) return;

    if (position) {
      player.position = {
        x: position.x,
        y: position.y,
        z: position.z,
      };
    }

    if (rotation) {
      player.rotation = {
        x: rotation.x,
        y: -rotation.y,
        z: rotation.z ?? 0,
      };
    }

    socket.to(roomId).emit("drone-game-player-state", player);
  });

  // Damage
  socket.on("drone-game-damage-player", ({ roomId, targetId, damage }) => {
    const player = players[targetId];
    if (!player || player.dead) return;

    player.health = Math.max(0, player.health - damage);
    io.to(roomId).emit("drone-game-player-state", player);

    if (player.health <= 0) {
      player.dead = true;
      io.to(roomId).emit("drone-game-player-state", player);

      setTimeout(() => {
        const spawn = spawnPoints[spawnIndex % spawnPoints.length];
        spawnIndex++;

        player.health = 100;
        player.dead = false;
        player.position = { ...spawn };
        player.rotation = { x: 0, y: 0, z: 0 };

        io.to(roomId).emit("drone-game-player-respawned", player);
      }, 3000);
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("drone-game-player-left", { playerId: socket.id });
  });
}
