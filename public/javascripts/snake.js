const TILE_SIZE = 20;
const GRID_SIZE = 20;
const WIDTH = 400;
const HEIGHT = 400;
const MOVE_DELAY = 120;

class SnakeScene extends Phaser.Scene {
  constructor() {
    super("Snake");
  }

  init() {
    this.started = false;
    this.direction = "RIGHT";
    this.lastMoveTime = 0;
    this.score = 0;
    this.snake = [];
  }

  create() {
    const { width, height } = this.scale;

    // Title
    this.titleText = this.add.text(width / 2, 60, "Snake", {
      fontSize: "36px",
      fontStyle: "bold",
      color: "#22c55e",
    }).setOrigin(0.5);

    // Info
    this.infoText = this.add.text(width / 2, 110, "Click Play to Start", {
      fontSize: "18px",
      color: "#ccc",
    }).setOrigin(0.5);

    // Score
    this.scoreText = this.add.text(10, 10, "", {
      fontSize: "16px",
      color: "#e5e7eb",
    });

    // Play Button (Phaser)
    this.playButton = this.add.text(width / 2, height / 2, "▶ PLAY", {
      fontSize: "28px",
      backgroundColor: "#22c55e",
      padding: { x: 24, y: 14 },
      color: "#022c22",
    })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.startGame());

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  startGame() {
    this.started = true;
    this.score = 0;
    this.direction = "RIGHT";
    this.lastMoveTime = 0;

    this.playButton.setVisible(false);
    this.infoText.setText("");
    this.scoreText.setText("Score: 0");

    this.createSnake();
    this.createFood();
  }

  createSnake() {
    this.snake.forEach(s => s.destroy());
    this.snake = [];

    this.snake.push(
      this.add.rectangle(this.gridToPixel(10), this.gridToPixel(10), TILE_SIZE, TILE_SIZE, 0x22c55e),
      this.add.rectangle(this.gridToPixel(9), this.gridToPixel(10), TILE_SIZE, TILE_SIZE, 0x16a34a),
      this.add.rectangle(this.gridToPixel(8), this.gridToPixel(10), TILE_SIZE, TILE_SIZE, 0x16a34a)
    );
  }

  createFood() {
    if (this.food) this.food.destroy();
    this.food = this.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0xef4444);
    this.repositionFood();
  }

  update(time) {
    if (!this.started) return;
    if (time < this.lastMoveTime + MOVE_DELAY) return;
    this.lastMoveTime = time;

    if (this.cursors.left.isDown && this.direction !== "RIGHT") this.direction = "LEFT";
    else if (this.cursors.right.isDown && this.direction !== "LEFT") this.direction = "RIGHT";
    else if (this.cursors.up.isDown && this.direction !== "DOWN") this.direction = "UP";
    else if (this.cursors.down.isDown && this.direction !== "UP") this.direction = "DOWN";

    this.moveSnake();
  }

  moveSnake() {
    const head = this.snake[0];
    let x = head.x;
    let y = head.y;

    if (this.direction === "LEFT") x -= TILE_SIZE;
    if (this.direction === "RIGHT") x += TILE_SIZE;
    if (this.direction === "UP") y -= TILE_SIZE;
    if (this.direction === "DOWN") y += TILE_SIZE;

    // Wall collision
    if (
      x < TILE_SIZE / 2 ||
      y < TILE_SIZE / 2 ||
      x >= WIDTH ||
      y >= HEIGHT
    ) {
      this.gameOver();
      return;
    }

    const newHead = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x22c55e);
    this.snake.unshift(newHead);

    // Self collision
    for (let i = 1; i < this.snake.length; i++) {
      if (x === this.snake[i].x && y === this.snake[i].y) {
        this.gameOver();
        return;
      }
    }

    // Food collision
    if (x === this.food.x && y === this.food.y) {
      this.score++;
      this.scoreText.setText("Score: " + this.score);
      this.repositionFood();
    } else {
      this.snake.pop().destroy();
    }
  }

  repositionFood() {
    let valid = false;
    while (!valid) {
      const gx = Phaser.Math.Between(0, GRID_SIZE - 1);
      const gy = Phaser.Math.Between(0, GRID_SIZE - 1);

      this.food.x = this.gridToPixel(gx);
      this.food.y = this.gridToPixel(gy);

      valid = !this.snake.some(
        s => s.x === this.food.x && s.y === this.food.y
      );
    }
  }

  gameOver() {
    this.started = false;

    this.snake.forEach(s => s.destroy());
    this.food.destroy();

    this.infoText.setText("💀 Game Over!");
    this.scoreText.setText("");
    this.playButton.setVisible(true);
  }

  gridToPixel(value) {
    return value * TILE_SIZE + TILE_SIZE / 2;
  }
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: "#020617",
  parent: "game-container",
  scene: SnakeScene,
};

new Phaser.Game(config);
