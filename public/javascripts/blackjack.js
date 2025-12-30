/* ================= CONFIG ================= */

const API = "http://localhost:30106/api/v1";
const gameId = window.location.pathname.split("/").pop();

/* ================= GAME STATE ================= */

let playerHand = [];
let dealerHand = [];
let playerTotal = 0;
let dealerTotal = null;
let status = "playing";
let result = null;

let blackjackScene = null;

/* ================= API ================= */

async function fetchGame() {
  if (!blackjackScene) return;

  const res = await fetch(`${API}/blackjack/${gameId}/get`, {
    credentials: "include",
  });

  const data = await res.json();

  playerHand = data.playerHand;
  dealerHand = data.dealerHand;
  playerTotal = data.playerTotal;
  dealerTotal = data.dealerTotal;
  status = data.status;
  result = data.result;

  blackjackScene.renderCards();
  updateUI();
}

async function hit() {
  disableButtons();
  await fetch(`${API}/blackjack/${gameId}/hit`, {
    method: "POST",
    credentials: "include",
  });
  fetchGame();
}

async function stand() {
  disableButtons();
  await fetch(`${API}/blackjack/${gameId}/stand`, {
    method: "POST",
    credentials: "include",
  });
  fetchGame();
}

async function newGame() {
  const res = await fetch(`${API}/blackjack/start`, {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json();
  window.location.href = `${data.gameId}`;
}

/* ================= PHASER ================= */

class BlackjackScene extends Phaser.Scene {
  constructor() {
    super("Blackjack");
    this.cards = [];
  }

  create() {
    blackjackScene = this;

    this.add.text(360, 20, "Dealer", { fontSize: "20px" }).setOrigin(0.5);
    this.add.text(360, 300, "You", { fontSize: "20px" }).setOrigin(0.5);

    fetchGame();
  }

  renderCards() {
    this.cards.forEach(c => c.destroy());
    this.cards = [];

    // Dealer cards (backend already hides first card)
    dealerHand.forEach((card, i) => {
      this.drawCard(200 + i * 70, 80, `${card.rank}${card.suit}`);
    });

    // Player cards
    playerHand.forEach((card, i) => {
      this.drawCard(200 + i * 70, 360, `${card.rank}${card.suit}`);
    });
  }

  drawCard(x, y, label) {
    const rect = this.add
      .rectangle(x, y, 60, 90, 0xffffff)
      .setStrokeStyle(2, 0x000000);

    const text = this.add
      .text(x, y, label, { color: "#000", fontSize: "24px" })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [rect, text],
      y: y + 10,
      alpha: { from: 0, to: 1 },
      duration: 200,
    });

    this.cards.push(rect, text);
  }
}

/* ================= PHASER CONFIG ================= */

new Phaser.Game({
  type: Phaser.AUTO,
  width: 720,
  height: 520,
  backgroundColor: "#0f172a",
  parent: "game",
  scene: BlackjackScene,
});

/* ================= UI ================= */

function updateUI() {
  document.getElementById("hitBtn").disabled = status !== "playing";
  document.getElementById("standBtn").disabled = status !== "playing";
  document.getElementById("newGameBtn").hidden = status !== "finished";

  const text = document.getElementById("statusText");

  if (status === "finished") {
    if (result === "player")
      text.textContent = `🔥 You Win! (Dealer: ${dealerTotal})`;
    else if (result === "dealer")
      text.textContent = `❌ Dealer Wins (${dealerTotal})`;
    else text.textContent = "🤝 Push";
  } else {
    text.textContent = `Your Total: ${playerTotal}`;
  }
}

function disableButtons() {
  document.getElementById("hitBtn").disabled = true;
  document.getElementById("standBtn").disabled = true;
}

/* ================= EVENTS ================= */

document.getElementById("hitBtn").onclick = hit;
document.getElementById("standBtn").onclick = stand;
document.getElementById("newGameBtn").onclick = newGame;
