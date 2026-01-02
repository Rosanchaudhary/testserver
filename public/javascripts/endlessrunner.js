// ========================
// SCENE SETUP
// ========================
let scene, camera, renderer;

scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 10, 60);

camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========================
// PLAYER
// ========================
let playerLane = 0;
let velocityY = 0;
let grounded = true;

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
player.position.y = 1;
scene.add(player);

// ========================
// INPUT
// ========================
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") playerLane = Math.max(-1, playerLane - 1);
  if (e.key === "ArrowRight") playerLane = Math.min(1, playerLane + 1);
  if (e.key === "ArrowUp" && grounded) {
    velocityY = 0.35;
    grounded = false;
  }
});

// ========================
// ROAD
// ========================
const roadSegments = [];
const ROAD_LENGTH = 20;

for (let i = 0; i < 5; i++) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.1, ROAD_LENGTH),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  road.position.z = -i * ROAD_LENGTH;
  scene.add(road);
  roadSegments.push(road);
}

// ========================
// OBSTACLES
// ========================
const obstacles = [];

function spawnObstacle() {
  const obs = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );

  obs.position.set(
    [-2, 0, 2][Math.floor(Math.random() * 3)],
    1,
    -50
  );

  scene.add(obs);
  obstacles.push(obs);
}

setInterval(spawnObstacle, 1500);

// ========================
// GAME LOOP
// ========================
let speed = 0.4;
let score = 0;

function animate() {
  requestAnimationFrame(animate);

  // Player lane movement
  const targetX = playerLane * 2;
  player.position.x += (targetX - player.position.x) * 0.1;

  // Gravity
  velocityY -= 0.02;
  player.position.y += velocityY;
  if (player.position.y <= 1) {
    player.position.y = 1;
    velocityY = 0;
    grounded = true;
  }

  // Move road
  roadSegments.forEach(r => {
    r.position.z += speed;
    if (r.position.z > 10) {
      r.position.z -= ROAD_LENGTH * roadSegments.length;
    }
  });

  // Move obstacles
  obstacles.forEach(o => {
    o.position.z += speed;

    // Collision
    if (o.position.distanceTo(player.position) < 1.2) {
      alert("Game Over");
      location.reload();
    }
  });

  // Score
  score++;
  document.getElementById("score").innerText = "Score: " + score;

  renderer.render(scene, camera);
}

animate();
