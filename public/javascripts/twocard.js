/* ================= SOCKET ================= */

const socket = io();

/* ================= GAME STATE ================= */

let mySeat = null;
let roomId = null;
let isMultiplayerReady = false;

let myHand = [];
let opponentHand = [];

let currentTurnSeat = "A";
let sceneRef = null;

/* ================= CENTER POSITIONS ================= */

const CENTER_POSITIONS = {
  A: { x: 330, y: 270 },
  B: { x: 390, y: 270 },
};

/* ================= HELPERS ================= */

function isMyTurn() {
  return currentTurnSeat === mySeat;
}

/* ================= SOCKET EVENTS ================= */

socket.on("waiting-for-player", () => {
  console.log("Waiting for opponent...");
});

socket.on("game-ready", ({ roomId: rid, players }) => {
  roomId = rid;
  isMultiplayerReady = true;
  mySeat = players.A === socket.id ? "A" : "B";
});

socket.on("deal-cards", ({ hand, currentTurn }) => {
  currentTurnSeat = currentTurn;

  myHand = [...hand];
  opponentHand = new Array(hand.length).fill(null);

  sceneRef.updateTurnUI();
  sceneRef.renderHands();
});

/* ---------- SERVER-AUTHORITATIVE CENTER ---------- */

socket.on("trick-update", ({ trick }) => {
  sceneRef.renderCenter(trick);

  // Reduce opponent hand visually when opponent plays
  if (Object.keys(trick).length === 1) {
    const playedSeat = Object.keys(trick)[0];
    if (playedSeat !== mySeat) {
      opponentHand.pop();
      sceneRef.renderHands();
    }
  }
});

socket.on("turn-update", (seat) => {
  currentTurnSeat = seat;
  sceneRef.updateTurnUI();
  sceneRef.renderHands();
});

socket.on("trick-clear", ({ nextTurn }) => {
  currentTurnSeat = nextTurn;

  sceneRef.renderCenter({});
  sceneRef.updateTurnUI();
  sceneRef.renderHands();
});

socket.on("game-over", ({ winner }) => {
  alert(winner === mySeat ? "You Win!" : "You Lose!");
});

socket.on("opponent-left", () => {
  alert("Opponent disconnected.");
  location.reload();
});

/* ================= PHASER SCENE ================= */

class TableScene extends Phaser.Scene {
  constructor() {
    super("Table");
    this.cards = [];
    this.centerSprites = {};
    this.turnText = null;
    this.myGlow = null;
    this.opponentGlow = null;
  }

  create() {
    sceneRef = this;

    this.add.text(360, 40, "Opponent", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.add.text(360, 500, "You", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.turnText = this.add.text(360, 270, "", {
      fontSize: "22px",
      color: "#facc15",
    }).setOrigin(0.5);

    this.opponentGlow = this.add
      .rectangle(360, 120, 520, 120)
      .setStrokeStyle(3, 0x22c55e)
      .setVisible(false);

    this.myGlow = this.add
      .rectangle(360, 380, 520, 120)
      .setStrokeStyle(3, 0x22c55e)
      .setVisible(false);

    this.updateTurnUI();
  }

  /* ================= UI ================= */

  updateTurnUI() {
    if (!mySeat) {
      this.turnText.setText("Waiting for player...");
      return;
    }

    this.turnText.setText(isMyTurn() ? "Your Turn" : "Opponent Turn");
    this.myGlow.setVisible(isMyTurn());
    this.opponentGlow.setVisible(!isMyTurn());
  }

  /* ================= RENDER HANDS ================= */

  renderHands() {
    this.cards.forEach((c) => c.destroy());
    this.cards = [];

    // Opponent hand
    opponentHand.forEach((_, i) => {
      this.drawCardBack(200 + i * 70, 110);
    });

    // Player hand
    myHand.forEach((card, i) => {
      this.drawPlayerCard(200 + i * 70, 360, card, i);
    });
  }

  /* ================= RENDER CENTER (SERVER STATE) ================= */

  renderCenter(trick) {
    Object.values(this.centerSprites)
      .flat()
      .forEach((c) => c.destroy());

    this.centerSprites = {};

    Object.entries(trick).forEach(([seat, card]) => {
      const pos = CENTER_POSITIONS[seat];

      const rect = this.add
        .rectangle(pos.x, pos.y, 60, 90, 0xffffff)
        .setStrokeStyle(2, 0x000000)
        .setDepth(10);

      const text = this.add
        .text(pos.x, pos.y, `${card.rank}${card.suit}`, {
          fontSize: "22px",
          color: "#000000",
        })
        .setOrigin(0.5)
        .setDepth(11);

      this.centerSprites[seat] = [rect, text];
    });
  }

  /* ================= CARD DRAWING ================= */

  drawPlayerCard(x, y, card, index) {
    const rect = this.add
      .rectangle(x, y, 60, 90, 0xffffff)
      .setStrokeStyle(2, 0x000000);

    const text = this.add
      .text(x, y, `${card.rank}${card.suit}`, {
        fontSize: "22px",
        color: "#000000",
      })
      .setOrigin(0.5);

    const baseY = y;

    if (isMyTurn()) {
      rect.setInteractive({ cursor: "pointer" });

      rect.on("pointerover", () => {
        rect.y = baseY - 6;
        text.y = baseY - 6;
      });

      rect.on("pointerout", () => {
        rect.y = baseY;
        text.y = baseY;
      });

      rect.on("pointerdown", () => {
        rect.disableInteractive();
        this.playPlayerCard(index, rect, text);
      });
    }

    this.cards.push(rect, text);
  }

  drawCardBack(x, y) {
    const rect = this.add
      .rectangle(x, y, 60, 90, 0x1e293b)
      .setStrokeStyle(2, 0xffffff);

    const text = this.add.text(x, y, "🂠", {
      fontSize: "26px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.cards.push(rect, text);
  }

  /* ================= GAME FLOW ================= */

  playPlayerCard(index, rect, text) {
    if (!isMyTurn()) return;

    const target = CENTER_POSITIONS[mySeat];

    this.tweens.add({
      targets: [rect, text],
      x: target.x,
      y: target.y,
      duration: 300,
      onComplete: () => {
        myHand.splice(index, 1);
        this.renderHands();

        socket.emit("play-card", { roomId, index });
      },
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

/* ================= UI ================= */

document.getElementById("dealBtn").onclick = () => {
  if (!isMultiplayerReady) return alert("Waiting for opponent...");
  if (mySeat !== "A") return alert("Only host can deal");

  socket.emit("request-deal", { roomId });
};
