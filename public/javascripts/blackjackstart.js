const API = "https://api.chaudharyroshan.com/api/v1"; // same NEXT_PUBLIC_API_URL
const button = document.getElementById("startBtn");


async function startGame() {
  button.disabled = true;
  button.textContent = "Starting...";

  const res = await fetch(`${API}/blackjack/start`, {
    method: "POST",
    credentials: "include", // 🔥 THIS IS THE KEY
    headers: {
      "Content-Type": "application/json",
    }, 
  });

  const data = await res.json();
  console.log(data);


 window.location.href = `blackjack/${data.gameId}`;
}

button.onclick = startGame;

/* ================= PHASER BACKGROUND ================= */

class StartScene extends Phaser.Scene {
  constructor() {
    super("Start");
  }

  create() {
    const title = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 140,
      "♠ ♥ ♦ ♣",
      { fontSize: "48px", color: "#ffffff" }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: title.y - 10,
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: "Sine.easeInOut"
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#0f172a",
  parent: "game",
  scene: StartScene,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});
