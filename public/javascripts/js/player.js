export let player;
let lane = 0;
let velocityY = 0;
let grounded = true;

export function initPlayer(scene) {
  player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  player.position.y = 1;
  scene.add(player);
}

export function moveLeft() {
  lane = Math.max(-1, lane - 1);
}

export function moveRight() {
  lane = Math.min(1, lane + 1);
}

export function jump() {
  if (grounded) {
    velocityY = 0.35;
    grounded = false;
  }
}

export function updatePlayer() {
  // Lane movement
  const targetX = lane * 2;
  player.position.x += (targetX - player.position.x) * 0.1;

  // Gravity
  velocityY -= 0.02;
  player.position.y += velocityY;

  if (player.position.y <= 1) {
    player.position.y = 1;
    velocityY = 0;
    grounded = true;
  }
}
