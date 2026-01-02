// ========================
// BASIC SETUP
// ========================
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 5, 25);

let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 8;

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// ========================
// PLAYER
// ========================
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);
player.position.y = -3;
scene.add(player);

// ========================
// FLOOR
// ========================
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.5, 10),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
floor.position.y = -4;
scene.add(floor);

// ========================
// INPUT
// ========================
let moveLeft = false;
let moveRight = false;

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") moveLeft = true;
  if (e.key === "ArrowRight") moveRight = true;
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") moveLeft = false;
  if (e.key === "ArrowRight") moveRight = false;
});

// ========================
// OBSTACLES
// ========================
const obstacles = [];

function spawnObstacle() {
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff4444 })
  );
  cube.position.set(
    (Math.random() * 8) - 4,
    5,
    0
  );
  scene.add(cube);
  obstacles.push(cube);
}

setInterval(spawnObstacle, 800);

// ========================
// GAME LOOP
// ========================
let score = 0;
let speed = 0.08;

function animate() {
  requestAnimationFrame(animate);

  // Player movement
  if (moveLeft) player.position.x -= 0.15;
  if (moveRight) player.position.x += 0.15;

  player.position.x = Math.max(-4.5, Math.min(4.5, player.position.x));

  // Obstacles
  obstacles.forEach((cube, index) => {
    cube.position.y -= speed;

    // Collision
    if (cube.position.distanceTo(player.position) < 1) {
      alert("Game Over!");
      location.reload();
    }

    // Remove passed cubes
    if (cube.position.y < -5) {
      scene.remove(cube);
      obstacles.splice(index, 1);
      score++;
      document.getElementById("score").innerText = score;
    }
  });

  renderer.render(scene, camera);
}

animate();
