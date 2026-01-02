const API = "http://localhost:30106/api/v1";
const gameId = window.location.pathname.split("/").pop();

let sceneRef;

/* PHASER */
class RouletteScene extends Phaser.Scene {
  constructor() {
    super("Roulette");
  }

  create() {
    sceneRef = this;

    this.text = this.add
      .text(360, 200, "🎯 Waiting for spin...", {
        fontSize: "28px",
        color: "#e5e7eb",
      })
      .setOrigin(0.5);
  }

  showResult(number) {
    this.text.setText(`🎯 Result: ${number}`);
  }
}


new Phaser.Game({
  type: Phaser.AUTO,
  width: 720,
  height: 400,
  backgroundColor: "#065f46",
  parent: "game",
  scene: RouletteScene,
});

/* UI */
const betNumber = document.getElementById("betNumber");
const betAmount = document.getElementById("betAmount");
const status = document.getElementById("status");
const betBtn = document.getElementById("betBtn");
const spinBtn = document.getElementById("spinBtn");

/* API */
async function placeBet() {
  const number = Number(betNumber.value);
  const amount = Number(betAmount.value);

  if (number < 0 || number > 36 || amount <= 0) {
    status.textContent = "❌ Invalid bet";
    return;
  }

  const res = await fetch(`${API}/roulette/${gameId}/bet`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number, amount }),
  });

  if (!res.ok) {
    status.textContent = "❌ Bet failed";
    return;
  }

  status.textContent = "✅ Bet placed";
}

async function spin() {
  const res = await fetch(`${API}/roulette/${gameId}/spin`, {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    status.textContent = `❌ ${data.error}`;
    return;
  }

  sceneRef.showResult(data.result);

  status.textContent =
    data.winAmount > 0
      ? `🎉 You won ${data.winAmount}`
      : "❌ You lost";
}

betBtn.onclick = placeBet;
spinBtn.onclick = spin;
