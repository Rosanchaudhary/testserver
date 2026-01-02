const obstacles = [];
let sceneRef;

export function initObstacles(scene) {
  sceneRef = scene;
  setInterval(spawnObstacle, 1500);
}

function spawnObstacle() {
  const obstacle = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );

  obstacle.position.set(
    [-2, 0, 2][Math.floor(Math.random() * 3)],
    1,
    -50
  );

  sceneRef.add(obstacle);
  obstacles.push(obstacle);
}

export function updateObstacles(speed) {
  obstacles.forEach(o => o.position.z += speed);
}

export function getObstacles() {
  return obstacles;
}
