const GRID_SIZE = 6;
const CELL_SIZE = 60;
const GAP = 8;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("game-over");

const getRandomCell = () => Math.floor(Math.random() * TOTAL_CELLS);

class SimonScene extends Phaser.Scene {
  constructor() {
    super("Simon");
  }

  init() {
    this.started = false;
    this.sequence = [];
    this.playerMoves = [];
    this.showing = false;
    this.level = 1;
    this.cells = [];
  }

  create() {
    const { width, height } = this.scale;

    // Play button
    this.playButton = this.add
      .text(width / 2, height / 2, "▶ PLAY", {
        fontSize: "32px",
        backgroundColor: "#6366f1",
        padding: { x: 24, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.startGame());

    // Grid container
    this.gridX =
      width / 2 - (GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * GAP) / 2;
    this.gridY = height / 2 - 100;

    this.createGrid();
  }

  createGrid() {
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;

      const x = this.gridX + col * (CELL_SIZE + GAP);
      const y = this.gridY + row * (CELL_SIZE + GAP);

      const cell = this.add
        .rectangle(x, y, CELL_SIZE, CELL_SIZE, 0x1f2937)
        .setOrigin(0)
        .setStrokeStyle(2, 0x374151)
        .setInteractive();

      cell.index = i;

      cell.on("pointerdown", () => this.handleCellClick(i));

      this.cells.push(cell);
      cell.setVisible(false);
    }
  }

  startGame() {
    this.started = true;
    this.sequence = [];
    this.playerMoves = [];
    this.level = 1;

    this.playButton.setVisible(false);
    gameOverEl.style.display = "none";

    scoreEl.textContent = "Score: 1";

    this.cells.forEach((c) => {
      c.setVisible(true);
      c.setFillStyle(0x1f2937);
    });

    this.addStep();
  }

  addStep() {
    this.sequence.push(getRandomCell());
    this.showSequence();
  }

  showSequence() {
    this.showing = true;
    let i = 0;

    this.time.addEvent({
      delay: 500,
      repeat: this.sequence.length - 1,
      callback: () => {
        this.highlightCell(this.sequence[i]);
        i++;
        if (i === this.sequence.length) {
          this.time.delayedCall(200, () => {
            this.clearHighlights();
            this.showing = false;
          });
        }
      },
    });
  }

  highlightCell(index) {
    this.clearHighlights();
    const cell = this.cells[index];
    cell.setFillStyle(0x22c55e);
    this.tweens.add({
      targets: cell,
      scale: 1.2,
      duration: 150,
      yoyo: true,
    });
  }

  clearHighlights() {
    this.cells.forEach((c) => c.setFillStyle(0x1f2937));
  }

  handleCellClick(index) {
    if (!this.started || this.showing) return;

    this.highlightCell(index);
    this.playerMoves.push(index);

    const step = this.playerMoves.length - 1;

    if (this.sequence[step] !== index) {
      this.gameOver();
      return;
    }

    if (this.playerMoves.length === this.sequence.length) {
      this.playerMoves = [];
      this.level++;
      scoreEl.textContent = "Score: " + this.level;

      this.time.delayedCall(400, () => this.addStep());
    }
  }

  gameOver() {
    this.started = false;
    scoreEl.textContent = "Score: 0";

    // Show correct tiles in red
    this.showCorrectSequence();

    // Show GAME OVER text in HTML
    gameOverEl.style.display = "block";

    // After few seconds, reset UI
    this.time.delayedCall(2500, () => {
      this.cells.forEach((c) => c.setVisible(false));
      this.playButton.setVisible(true);
    });
  }

  showCorrectSequence() {
    this.clearHighlights();

    this.sequence.forEach((index) => {
      this.cells[index].setFillStyle(0xef4444);
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 620,
  backgroundColor: "#000000",
  parent: "game-container",
  scene: SimonScene,
};

new Phaser.Game(config);
