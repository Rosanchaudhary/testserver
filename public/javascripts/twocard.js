/* ================= SOCKET ================= */

const socket = io();

/* ================= ROLES ================= */

const ME = "ME";
const OPPONENT = "OPPONENT";

let mySeat = null;              // "A" | "B"
let roomId = null;
let isMultiplayerReady = false;

/* ================= GAME STATE ================= */

let myHand = [];
let opponentHand = [];

let currentTurnSeat = "A";
let sceneRef = null;

let centerCardSprites = {};

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

  console.log("Connected as", mySeat === "A" ? "BOTTOM" : "TOP");
});

socket.on("deal-cards", ({ hand, currentTurn }) => {
  currentTurnSeat = currentTurn;

  myHand = [...hand];
  opponentHand = new Array(hand.length).fill(null);

  sceneRef.updateTurnUI();
  sceneRef.renderHands();
});

socket.on("card-played", ({ role, card }) => {
  // ❌ prevent double animation for self
  if (role === mySeat) return;

  opponentHand.pop();

  const yStart = role === "A" ? 360 : 110;

  const rect = sceneRef.add
    .rectangle(360, yStart, 60, 90, 0xffffff)
    .setStrokeStyle(2, 0x000000);

  const text = sceneRef.add
    .text(360, yStart, `${card.rank}${card.suit}`, {
      fontSize: "22px",
      color: "#000000",
    })
    .setOrigin(0.5);

  centerCardSprites[role] = [rect, text];

  sceneRef.tweens.add({
    targets: [rect, text],
    y: 270,
    duration: 300,
  });

  sceneRef.renderHands();
});

socket.on("turn-update", (seat) => {
  currentTurnSeat = seat;
  sceneRef.updateTurnUI();
  sceneRef.renderHands(); // 🔥 critical fix
});

socket.on("trick-result", ({ winner, nextTurn }) => {
  currentTurnSeat = nextTurn;

  sceneRef.time.delayedCall(800, () => {
    Object.values(centerCardSprites)
      .flat()
      .forEach((c) => c.destroy());

    centerCardSprites = {};

    sceneRef.updateTurnUI();
    sceneRef.renderHands();
  });
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

  updateTurnUI() {
    if (!mySeat) {
      this.turnText.setText("Waiting for player...");
      return;
    }

    this.turnText.setText(isMyTurn() ? "Your Turn" : "Opponent Turn");
    this.myGlow.setVisible(isMyTurn());
    this.opponentGlow.setVisible(!isMyTurn());
  }

  /* ================= RENDER ================= */

  renderHands() {
    this.cards.forEach((c) => c.destroy());
    this.cards = [];

    // Opponent
    opponentHand.forEach((_, i) => {
      this.drawCardBack(200 + i * 70, 110);
    });

    // Player
    myHand.forEach((card, i) => {
      this.drawPlayerCard(200 + i * 70, 360, card, i);
    });
  }

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

    const card = myHand.splice(index, 1)[0];
    this.renderHands();

    this.tweens.add({
      targets: [rect, text],
      x: 360,
      y: 270,
      duration: 300,
      onComplete: () => {
        centerCardSprites[mySeat] = [rect, text];
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
  if (!isMultiplayerReady) {
    alert("Waiting for opponent...");
    return;
  }

  if (mySeat !== "A") {
    alert("Only the host can deal");
    return;
  }

  socket.emit("request-deal", { roomId });
};
