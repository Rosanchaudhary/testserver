import { initScene, scene, camera, renderer } from "./js/scene.js";
import { initPlayer, updatePlayer, player } from "./js/player.js";
import { initRoad, updateRoad } from "./js/road.js";
import { initObstacles, updateObstacles } from "./js/obstacles.js";
import { initInput } from "./js/input.js";
import { checkCollisions } from "./js/collision.js";

let score = 0;
let speed = 0.4;

initScene();
initPlayer(scene);
initRoad(scene);
initObstacles(scene);
initInput();

function animate() {
  requestAnimationFrame(animate);

  updateRoad(speed);
  updatePlayer();
  updateObstacles(speed);

  checkCollisions(player);

  score++;
  document.getElementById("score").innerText = `Score: ${score}`;

  renderer.render(scene, camera);
}

animate();
