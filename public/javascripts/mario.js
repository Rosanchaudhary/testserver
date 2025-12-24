const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game-container",
  },

  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

let player;
let cursors;
let platforms;
let worldWidth = 3200;
let worldHeight;
let isJumping = false;
let coins;
let score = 0;
let scoreText;
let enemies;
let isDead = false;

let lives = 3;
let livesText;

const PlayerState = {
  IDLE: "IDLE",
  RUN: "RUN",
  JUMP: "JUMP",
  FALL: "FALL",
  HURT: "HURT",
  DEAD: "DEAD",
  SLIDE: "SLIDE",
};

let currentState = PlayerState.IDLE;

function preload() {
  // --- IDLE ---
  for (let i = 1; i <= 10; i++) {
    this.load.image(`idle${i}`, `/assets/player/Idle(${i}).png`);
  }

  // --- RUN ---
  for (let i = 1; i <= 8; i++) {
    this.load.image(`run${i}`, `/assets/player/Run(${i}).png`);
  }

  // --- JUMP (we'll use later) ---
  for (let i = 1; i <= 12; i++) {
    this.load.image(`jump${i}`, `/assets/player/Jump(${i}).png`);
  }

  for (let i = 1; i <= 8; i++) {
    this.load.image(`hurt${i}`, `/assets/player/Hurt(${i}).png`);
  }

  for (let i = 1; i <= 10; i++) {
    this.load.image(`dead${i}`, `/assets/player/Dead(${i}).png`);
  }

  for (let i = 1; i <= 5; i++) {
    this.load.image(`slide${i}`, `/assets/player/Slide(${i}).png`);
  }

  // --- GOOMBA ---
  for (let i = 1; i <= 10; i++) {
    this.load.image(`goomba-walk${i}`, `/assets/goomba/Walk(${i}).png`);
  }

  for (let i = 1; i <= 12; i++) {
    this.load.image(`goomba-dead${i}`, `/assets/goomba/Dead(${i}).png`);
  }

  // tiles (unchanged)
  this.load.image("ground-left", "/assets/tiles/1.png");
  this.load.image("ground-middle", "/assets/tiles/2.png");
  this.load.image("ground-right", "/assets/tiles/3.png");

  this.load.image("sky-left", "/assets/tiles/13.png");
  this.load.image("sky-middle", "/assets/tiles/14.png");
  this.load.image("sky-right", "/assets/tiles/15.png");

  this.load.image("coin", "/assets/items/coin.png");
}

function create() {
  isDead = false;
  currentState = PlayerState.IDLE;

  worldHeight = this.scale.height;
  // --- WORLD & CAMERA BOUNDS ---
  this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

  // --- PLAYER ---
  player = this.physics.add.sprite(200, 300, "idle1");

  player.setScale(0.15);
  player.setCollideWorldBounds(true);
  player.setBounce(0);
  player.setDragX(800);
  player.setMaxVelocity(300, 600);
  player.play("idle");

  // --- CAMERA FOLLOW (MARIO STYLE) ---
  this.cameras.main.startFollow(player, true, 0.1, 0.1);

  // --- PLATFORMS ---
  platforms = this.physics.add.staticGroup();

  // Main ground
  createGround(platforms, 200, 800, 1);
  createGround(platforms, 800, 800, 1);

  // Floating platforms
  createFloatingPlatform(platforms, 1400, 600, 2);
  createFloatingPlatform(platforms, 2100, 400, 3);
  createGround(platforms, 2600, 800, 4);

  platforms.refresh();

  // --- COINS ---
  coins = this.physics.add.staticGroup();

  createCoin(coins, 400, 500);
  createCoin(coins, 450, 500);
  createCoin(coins, 500, 500);

  createCoin(coins, 1400, 580);
  createCoin(coins, 1450, 580);

  createCoin(coins, 2100, 380);

  coins.refresh();

  enemies = this.physics.add.group();

  // Spawn enemies
  spawnGoomba(this, 900, 220);
  spawnGoomba(this, 1600, 520);
  spawnGoomba(this, 2600, 520);

  // Collisions
  this.physics.add.collider(enemies, platforms);
  this.physics.add.collider(player, enemies, playerEnemyCollision, null, this);

  // --- COLLISION ---
  this.physics.add.collider(player, platforms);
  this.physics.add.overlap(player, coins, collectCoin, null, this);

  // --- INPUT ---
  cursors = this.input.keyboard.createCursorKeys();

  this.scale.on("resize", (gameSize) => {
    const width = gameSize.width;
    const height = gameSize.height;

    this.cameras.resize(width, height);
  });

  // --- PLAYER ANIMATIONS ---
  this.anims.create({
    key: "fall",
    frames: [{ key: "jump12" }],
    frameRate: 1,
  });

  this.anims.create({
    key: "hurt",
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `hurt${i + 1}` })),
    frameRate: 12,
  });

  this.anims.create({
    key: "dead",
    frames: Array.from({ length: 10 }, (_, i) => ({ key: `dead${i + 1}` })),
    frameRate: 10,
  });

  this.anims.create({
    key: "slide",
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `slide${i + 1}` })),
    frameRate: 14,
  });

  this.anims.create({
    key: "idle",
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `idle${i + 1}` })),
    frameRate: 8,
    repeat: -1,
  });

  this.anims.create({
    key: "run",
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `run${i + 1}` })),
    frameRate: 12,
    repeat: -1,
  });
  this.anims.create({
    key: "jump",
    frames: Array.from({ length: 5 }, (_, i) => ({ key: `jump${i + 1}` })),
    frameRate: 14,
    repeat: 0, // play once
  });

  this.anims.create({
    key: "goomba-walk",
    frames: Array.from({ length: 10 }, (_, i) => ({
      key: `goomba-walk${i + 1}`,
    })),
    frameRate: 6,
    repeat: -1,
  });

  this.anims.create({
    key: "goomba-death",
    frames: Array.from({ length: 12 }, (_, i) => ({
      key: `goomba-dead${i + 1}`,
    })),
    frameRate: 14,
    repeat: 0,
  });

  scoreText = this.add.text(20, 20, "Score: 0", {
    fontSize: "24px",
    fill: "#fff",
    fontFamily: "Arial",
  });

  // Make score stay on screen
  scoreText.setScrollFactor(0);

  livesText = this.add.text(20, 50, "Lives: " + lives, {
    fontSize: "24px",
    fill: "#ff5555",
    fontFamily: "Arial",
  });

  livesText.setScrollFactor(0);
}

function update() {
  if (isDead) return;

  const speed = 220;
  const jumpForce = 600;

  const onGround = player.body.blocked.down;
  const velocityX = player.body.velocity.x;
  const velocityY = player.body.velocity.y;

  // -----------------------------
  // HORIZONTAL MOVEMENT
  // -----------------------------
  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
    player.setFlipX(true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
    player.setFlipX(false);
  } else {
    player.setVelocityX(0);
  }

  // -----------------------------
  // JUMP INPUT
  // -----------------------------
  if (Phaser.Input.Keyboard.JustDown(cursors.up) && onGround) {
    player.setVelocityY(-jumpForce);
    setPlayerState(PlayerState.JUMP);
  }

  // -----------------------------
  // STATE DECISION LOGIC
  // -----------------------------
  if (!onGround) {
    if (velocityY < 0) {
      setPlayerState(PlayerState.JUMP);
    } else {
      setPlayerState(PlayerState.FALL);
    }
  } else {
    if (Math.abs(velocityX) > 5) {
      setPlayerState(PlayerState.RUN);
    } else {
      setPlayerState(PlayerState.IDLE);
    }
  }

  enemies.children.iterate((enemy) => {
    if (!enemy || enemy.isDead) return;

    if (!enemy.anims.isPlaying) {
      enemy.anims.play("goomba-walk", true);
    }

    if (enemy.body.blocked.left) {
      enemy.setVelocityX(40);
      enemy.setFlipX(false);
    } else if (enemy.body.blocked.right) {
      enemy.setVelocityX(-40);
      enemy.setFlipX(true);
    }
  });

  // -----------------------------
  // MARIO-STYLE CAMERA
  // -----------------------------
  const cam = this.cameras.main;
  const centerX = cam.scrollX + cam.width / 2;

  if (player.x > centerX) {
    cam.scrollX = player.x - cam.width / 2;
  }

  if (!isDead && player.y > worldHeight - 50) {
    killPlayer();
    return;
  }
}

function createCoin(group, x, y, scale = 0.02) {
  return group.create(x, y, "coin").setScale(scale);
}

function collectCoin(player, coin) {
  coin.disableBody(true, true);

  score += 10;
  scoreText.setText("Score: " + score);
}

// --- REUSABLE GROUND CREATOR ---
function createGround(platforms, centerX, y, middleCount) {
  const tileWidth = 120;
  const totalTiles = middleCount + 2;
  const startX = centerX - (totalTiles * tileWidth) / 2 + tileWidth / 2;

  platforms.create(startX, y, "ground-left");

  for (let i = 1; i <= middleCount; i++) {
    platforms.create(startX + tileWidth * i, y, "ground-middle");
  }

  platforms.create(startX + tileWidth * (middleCount + 1), y, "ground-right");
}

// --- REUSABLE Floating CREATOR ---
function createFloatingPlatform(platforms, centerX, y, middleCount) {
  const tileWidth = 120;
  const totalTiles = middleCount + 2;
  const startX = centerX - (totalTiles * tileWidth) / 2 + tileWidth / 2;

  platforms.create(startX, y, "sky-left");

  for (let i = 1; i <= middleCount; i++) {
    platforms.create(startX + tileWidth * i, y, "sky-middle");
  }

  platforms.create(startX + tileWidth * (middleCount + 1), y, "sky-right");
}

function setPlayerState(newState) {
  if (currentState === newState) return;

  currentState = newState;

  switch (newState) {
    case PlayerState.IDLE:
      player.play("idle", true);
      break;

    case PlayerState.RUN:
      player.play("run", true);
      break;

    case PlayerState.JUMP:
      player.play("jump", true);
      break;

    case PlayerState.FALL:
      player.play("fall", true);
      break;

    case PlayerState.HURT:
      player.play("hurt", true);
      break;

    case PlayerState.DEAD:
      player.play("dead");
      break;

    case PlayerState.SLIDE:
      player.play("slide", true);
      break;
  }
}

function spawnGoomba(scene, x, y) {
  const goomba = enemies.create(x, y, "goomba-walk1");

  goomba.setScale(0.15);

  // ✅ FIX BODY SIZE (adjust numbers if needed)
  goomba.body.setSize(goomba.width * 0.6, goomba.height * 0.8);
  goomba.body.setOffset(goomba.width * 0.2, goomba.height * 0.2);

  goomba.setCollideWorldBounds(true);
  goomba.setBounce(0);
  goomba.setVelocityX(-40);
  goomba.setFlipX(true);
  goomba.setGravityY(800);

  // ✅ FORCE ANIMATION PLAY
  goomba.anims.play("goomba-walk", true);

  goomba.isDead = false;

  return goomba;
}

function playerEnemyCollision(player, enemy) {
  if (enemy.isDead) return;

  const playerPrevBottom = player.body.prev.y + player.body.height;
  const enemyTop = enemy.body.top;

  const stomp = playerPrevBottom <= enemyTop + 10;

  if (stomp) {
    stompEnemy(enemy);

    // Mario bounce
    player.setVelocityY(-350);
  } else {
    hurtPlayer();
  }
}

function stompEnemy(enemy) {
  enemy.isDead = true;

  enemy.setVelocity(0, 0);
  enemy.body.enable = false;

  enemy.anims.stop();
  enemy.play("goomba-death");

  // Destroy AFTER animation finishes
  enemy.once("animationcomplete-goomba-death", () => {
    enemy.destroy();
  });

  // Score
  score += 100;
  scoreText.setText("Score: " + score);
}


function hurtPlayer() {
  killPlayer();
}

function playerEnemyProcess(player, enemy) {
  return player.body.velocity.y <= 0;
}

function killPlayer() {
  if (isDead) return;

  isDead = true;
  lives--;

  livesText.setText("Lives: " + lives);

  setPlayerState(PlayerState.DEAD);

  // ❗ Disable ALL player collisions immediately
  player.body.checkCollision.none = true;
  player.body.enable = false;

  player.setVelocity(0, 0);
  player.setVelocityY(-300);

  enemies.children.iterate((enemy) => {
    if (enemy && enemy.body) {
      enemy.body.enable = false;
      enemy.anims.stop();
    }
  });

  const scene = player.scene;

  if (lives > 0) {
    scene.time.delayedCall(2000, () => {
      isDead = false;
      scene.scene.restart();
    });
  } else {
    scene.time.delayedCall(2000, () => {
      showGameOver(scene);
    });
  }
}

function showGameOver(scene) {
  scene.physics.pause();

  const width = scene.scale.width;
  const height = scene.scale.height;

  const text = scene.add.text(
    width / 2,
    height / 2,
    "GAME OVER\nPress SPACE to Restart",
    {
      fontSize: "48px",
      fill: "#ffffff",
      align: "center",
    }
  );

  text.setOrigin(0.5);
  text.setScrollFactor(0);

  const key = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  key.once("down", () => {
    lives = 3;
    score = 0;
    scene.scene.restart();
  });
}
