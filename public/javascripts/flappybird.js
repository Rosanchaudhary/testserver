const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("game-over");

class FlappyScene extends Phaser.Scene {
  constructor() {
    super("Flappy");
  }

  init() {
    this.started = false;
    this.score = 0;
    this.pipes = null;
    this.pipeTimer = null;
  }

  create() {
    const { width, height } = this.scale;

    // Bird
    this.bird = this.add.circle(120, height / 2, 12, 0xfacc15);
    this.physics.add.existing(this.bird);
    this.bird.body.setGravityY(0);
    this.bird.body.setCollideWorldBounds(false);

    // Pipes group
    this.pipes = this.physics.add.group();

    // Play button
    this.playButton = this.add
      .text(width / 2, height / 2, "▶ PLAY", {
        fontSize: "32px",
        backgroundColor: "#22c55e",
        padding: { x: 24, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.startGame());

    // Input
    this.input.on("pointerdown", () => {
      if (this.started) this.flap();
    });

    // Collisions
    this.physics.add.collider(this.bird, this.pipes, () => this.gameOver());
  }

update(time, delta) {
  if (!this.started) return;

  this.pipes.getChildren().forEach(pipe => {
    pipe.x -= pipe.speed * (delta / 1000);

    if (
      pipe.isTop &&
      !pipe.passed &&
      pipe.x + pipe.width < this.bird.x
    ) {
      pipe.passed = true;
      this.score++;
      scoreEl.textContent = "Score: " + this.score;
    }

    if (pipe.x < -pipe.width) {
      pipe.destroy();
    }
  });

  if (this.bird.y > this.scale.height || this.bird.y < 0) {
    this.gameOver();
  }
}


  startGame() {
    this.started = true;
    this.score = 0;
    scoreEl.textContent = "Score: 0";
    gameOverEl.style.display = "none";

    this.bird.y = this.scale.height / 2;
    this.bird.body.setVelocity(0);
    this.bird.body.setGravityY(800);
    this.bird.body.enable = true;

    this.pipes.clear(true, true);
    this.playButton.setVisible(false);

    if (this.pipeTimer) this.pipeTimer.remove(false);

    this.pipeTimer = this.time.addEvent({
      delay: 1400,
      callback: this.addPipes,
      callbackScope: this,
      loop: true,
    });
  }

  flap() {
    this.bird.body.setVelocityY(-300);
  }
  addPipes() {
    const gap = 140;
    const topHeight = Phaser.Math.Between(60, 220);

    const topPipe = this.add.rectangle(
      this.scale.width,
      topHeight / 2,
      50,
      topHeight,
      0x22c55e
    );

    const bottomPipe = this.add.rectangle(
      this.scale.width,
      topHeight + gap + (this.scale.height - topHeight - gap) / 2,
      50,
      this.scale.height - topHeight - gap,
      0x22c55e
    );

    // custom speed
    topPipe.speed = 200;
    bottomPipe.speed = 200;

    // scoring flags
    topPipe.isTop = true;
    topPipe.passed = false;

    this.pipes.add(topPipe);
    this.pipes.add(bottomPipe);
  }

  gameOver() {
    if (!this.started) return;

    this.started = false;
    gameOverEl.style.display = "block";

    if (this.pipeTimer) this.pipeTimer.remove(false);

    this.playButton.setVisible(true);
    this.pipes.setVelocityX(0);
    this.bird.body.setVelocity(0);
    this.bird.body.enable = false;
  }
}

const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 480,
backgroundColor: "#38bdf8", // sky blue

  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: FlappyScene,
};

new Phaser.Game(config);
