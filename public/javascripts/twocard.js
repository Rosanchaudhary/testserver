const socket = io();
let isMultiplayerReady = false;
let playerRole = null; // "A" | "B"

socket.on("waiting-for-player", () => {
  console.log("Waiting for another player...");
});

socket.on("player-joined", (data) => {
  console.log("Both players joined");
  isMultiplayerReady = true;

  // Assign roles
  playerRole = currentTurn === "A" ? "A" : "B";
});


/* ================= GAME STATE ================= */

let playerAHand = [];
let playerBHand = [];

const CARD_COUNT = 5;

let currentTurn = "A"; // "A" | "B"
let sceneRef = null;

let centerCards = [];

/* ================= UTILS ================= */

function randomCard() {
  const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const suits = ["♠","♥","♦","♣"];

  return {
    rank: ranks[Math.floor(Math.random() * ranks.length)],
    suit: suits[Math.floor(Math.random() * suits.length)],
  };
}

/* ================= PHASER SCENE ================= */

class TableScene extends Phaser.Scene {
  constructor() {
    super("Table");
    this.cards = [];
    this.turnText = null;
    this.playerAGlow = null;
    this.playerBGlow = null;
  }

  create() {
    sceneRef = this;

    // Player labels
    this.add.text(360, 40, "Player B", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.add.text(360, 500, "Player A", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Turn text
    this.turnText = this.add.text(360, 270, "", {
      fontSize: "22px",
      color: "#facc15",
    }).setOrigin(0.5);

    // Active player glow zones
    this.playerBGlow = this.add.rectangle(360, 120, 520, 120)
      .setStrokeStyle(3, 0x22c55e)
      .setVisible(false);

    this.playerAGlow = this.add.rectangle(360, 380, 520, 120)
      .setStrokeStyle(3, 0x22c55e)
      .setVisible(false);

    this.updateTurnUI();
  }

  /* ================= TURN UI ================= */

  updateTurnUI() {
    this.turnText.setText(
      currentTurn === "A" ? "Your Turn" : "Opponent Turn"
    );

    this.playerAGlow.setVisible(currentTurn === "A");
    this.playerBGlow.setVisible(currentTurn === "B");
  }

  /* ================= RENDER ================= */

  renderHands() {
    // Clear all cards
    [...this.cards, ...centerCards].forEach(c => c.destroy());
    this.cards = [];
    centerCards = [];

    // Player B (card backs)
    playerBHand.forEach((_, i) => {
      this.drawCardBack(200 + i * 70, 110);
    });

    // Player A (face up)
    playerAHand.forEach((card, i) => {
      this.drawPlayerCard(200 + i * 70, 360, card, i);
    });
  }

  drawPlayerCard(x, y, card, index) {
    const rect = this.add.rectangle(x, y, 60, 90, 0xffffff)
      .setStrokeStyle(2, 0x000000);

    const text = this.add.text(x, y, `${card.rank}${card.suit}`, {
      fontSize: "22px",
      color: "#000000",
    }).setOrigin(0.5);

    if (currentTurn === "A") {
      rect.setInteractive({ cursor: "pointer" });

      rect.on("pointerover", () => {
        rect.setFillStyle(0xf8fafc);
        rect.y -= 6;
        text.y -= 6;
      });

      rect.on("pointerout", () => {
        rect.setFillStyle(0xffffff);
        rect.y += 6;
        text.y += 6;
      });

      rect.on("pointerdown", () => {
        rect.disableInteractive();
        this.playPlayerCard(index, rect, text);
      });
    }

    this.cards.push(rect, text);
  }

  drawCardBack(x, y) {
    const rect = this.add.rectangle(x, y, 60, 90, 0x1e293b)
      .setStrokeStyle(2, 0xffffff);

    const text = this.add.text(x, y, "🂠", {
      fontSize: "26px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.cards.push(rect, text);
  }

  /* ================= GAME FLOW ================= */

  playPlayerCard(index, rect, text) {
    if (currentTurn !== "A") return;

    currentTurn = "B";
    this.updateTurnUI();

    this.tweens.add({
      targets: [rect, text],
      x: 360,
      y: 270,
      duration: 300,
      onComplete: () => {
        centerCards.push(rect, text);
        playerAHand.splice(index, 1);
        this.opponentPlay();
      },
    });
  }

  opponentPlay() {
    if (playerBHand.length === 0) {
      this.clearTrick();
      return;
    }

    this.time.delayedCall(700, () => {
      const card = playerBHand.pop();

      const rect = this.add.rectangle(360, 110, 60, 90, 0xffffff)
        .setStrokeStyle(2, 0x000000);

      const text = this.add.text(360, 110, `${card.rank}${card.suit}`, {
        fontSize: "22px",
        color: "#000000",
      }).setOrigin(0.5);

      this.tweens.add({
        targets: [rect, text],
        y: 270,
        duration: 300,
        onComplete: () => {
          centerCards.push(rect, text);
          this.clearTrick();
        },
      });
    });
  }

  /* ================= TRICK CLEAR ================= */

  clearTrick() {
    this.time.delayedCall(900, () => {
      centerCards.forEach(c => c.destroy());
      centerCards = [];

      if (playerAHand.length === 0 && playerBHand.length === 0) {
        this.turnText.setText("Game Over");
        this.playerAGlow.setVisible(false);
        this.playerBGlow.setVisible(false);
        return;
      }

      currentTurn = "A";
      this.updateTurnUI();
      this.renderHands();
    });
  }
}

/* ================= PHASER CONFIG ================= */

new Phaser.Game({
  type: Phaser.AUTO,
  width: 720,
  height: 560,
  backgroundColor: "#065f46",
  parent: "game",
  scene: TableScene,
});

/* ================= UI EVENTS ================= */

document.getElementById("dealBtn").onclick = () => {
  if (!sceneRef) return;

  playerAHand = [];
  playerBHand = [];
  currentTurn = "A";

  sceneRef.cards.forEach(c => c.destroy());
  centerCards.forEach(c => c.destroy());
  sceneRef.cards = [];
  centerCards = [];

  for (let i = 0; i < CARD_COUNT; i++) {
    playerAHand.push(randomCard());
    playerBHand.push(randomCard());
  }

  sceneRef.updateTurnUI();
  sceneRef.renderHands();
};
