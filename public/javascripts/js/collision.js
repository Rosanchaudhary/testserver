import { getObstacles } from "./obstacles.js";

export function checkCollisions(player) {
  getObstacles().forEach(obs => {
    if (obs.position.distanceTo(player.position) < 1.2) {
      alert("Game Over");
      location.reload();
    }
  });
}
