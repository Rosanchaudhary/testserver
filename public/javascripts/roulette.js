/* =======================
   DOM ELEMENTS
======================= */
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resultEl = document.getElementById("result");
const betAmountInput = document.getElementById("betAmount");
const potentialWinEl = document.getElementById("potentialWin");

/* =======================
   PLAYER
======================= */
let balance = 1000;
const balanceEl = document.createElement("div");
balanceEl.className = "text-xl font-bold text-green-400 mb-2";
spinBtn.parentElement.prepend(balanceEl);

/* =======================
   ROULETTE DATA
======================= */
const wheel = [
  "0","28","9","26","30","11","7","20","32","17","5","22","34","15",
  "3","24","36","13","1","00","27","10","25","29","12","8","19","31",
  "18","6","21","33","16","4","23","35","14","2",
];

const redNumbers = new Set([
  "1","3","5","7","9","12","14","16","18",
  "19","21","23","25","27","30","32","34","36",
]);

/* =======================
   STATE
======================= */
let bets = [];
let rotation = 0;
let spinning = false;

/* =======================
   WHEEL DRAW
======================= */
const center = canvas.width / 2;
const radius = center - 5;
const sliceAngle = (2 * Math.PI) / wheel.length;

function getColor(num) {
  if (num === "0" || num === "00") return "#22c55e";
  return redNumbers.has(num) ? "#ef4444" : "#020617";
}

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  wheel.forEach((num, i) => {
    const start = rotation + i * sliceAngle;
    const end = start + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.fillStyle = getColor(num);
    ctx.fill();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.fillText(num, radius - 10, 4);
    ctx.restore();
  });
}

/* =======================
   BET HELPERS
======================= */
function isRed(num) {
  return redNumbers.has(num);
}

function winsBet(bet, result) {
  const n = Number(result);
  if (bet.type === "number") return bet.value === result;

  if (result === "0" || result === "00") return false;

  switch (bet.label) {
    case "RED": return isRed(result);
    case "BLACK": return !isRed(result);
    case "EVEN": return n % 2 === 0;
    case "ODD": return n % 2 === 1;
    case "1–18": return n >= 1 && n <= 18;
    case "19–36": return n >= 19 && n <= 36;
    case "1–12": return n >= 1 && n <= 12;
    case "13–24": return n >= 13 && n <= 24;
    case "25–36": return n >= 25 && n <= 36;
    case "COL1": return n % 3 === 1;
    case "COL2": return n % 3 === 2;
    case "COL3": return n % 3 === 0;
    default: return false;
  }
}

/* =======================
   BET UI
======================= */
function updatePotentialWin() {
  const amount = Number(betAmountInput.value || 0);
  if (!amount || bets.length === 0) {
    potentialWinEl.textContent = "Potential Win: $0";
    return;
  }

  let total = 0;
  bets.forEach(b => total += amount * b.payout);
  potentialWinEl.textContent = `Potential Win: $${total}`;
}

/* =======================
   SPIN
======================= */
async function spin() {
  if (spinning || bets.length === 0) return;

  const betAmount = Number(betAmountInput.value);
  const totalWager = betAmount * bets.length;

  if (!betAmount || totalWager > balance) {
    alert("Invalid bet or insufficient balance");
    return;
  }

  balance -= totalWager;
  updateBalance();

  spinning = true;
  spinBtn.disabled = true;
  betAmountInput.disabled = true;
  resultEl.textContent = "";

  const res = await fetch("/api/v1/roulette/spin", { method: "POST" });
  const data = await res.json();

  const targetIndex = data.index;
  const spinTime = 3500;
  const start = performance.now();
  const fullRotations = 8;
  const POINTER_ANGLE = (3 * Math.PI) / 2;

  const targetAngle =
    fullRotations * 2 * Math.PI +
    POINTER_ANGLE -
    (targetIndex * sliceAngle + sliceAngle / 2);

  function animate(time) {
    const progress = Math.min((time - start) / spinTime, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    rotation = ease * targetAngle;
    drawWheel();

    if (progress < 1) requestAnimationFrame(animate);
    else finishSpin(data.number);
  }

  requestAnimationFrame(animate);
}

function finishSpin(number) {
  let winAmount = 0;
  const betAmount = Number(betAmountInput.value);

  document.querySelectorAll(".ring-4").forEach(el =>
    el.classList.remove("ring-4", "ring-green-400")
  );

  bets.forEach(bet => {
    if (winsBet(bet, number)) {
      winAmount += betAmount * (bet.payout + 1);
      bet.el?.classList.add("ring-4", "ring-green-400");
    }
  });

  balance += winAmount;
  updateBalance();

  resultEl.textContent =
    winAmount > 0
      ? `Result: ${number} — You won $${winAmount}`
      : `Result: ${number} — You lost`;

  bets = [];
  updatePotentialWin();

  spinning = false;
  spinBtn.disabled = false;
  betAmountInput.disabled = false;
}

/* =======================
   BOARD
======================= */
function drawBoard() {
  const numbersDiv = document.getElementById("numbers");

  for (let i = 1; i <= 36; i++) {
    const cell = document.createElement("div");
    cell.textContent = i;
    cell.className = `
      w-14 h-14 flex items-center justify-center rounded-lg
      ${redNumbers.has(String(i)) ? "bg-red-600" : "bg-black"}
      text-white font-semibold border border-white cursor-pointer
    `;

    cell.onclick = () =>
      toggleBet(cell, { type: "number", value: String(i), payout: 35, el: cell });

    numbersDiv.appendChild(cell);
  }

  document.querySelectorAll(".bet").forEach((bet, i) => {
    let label = bet.textContent.trim();
    let payout = 1;

    if (label === "2:1") {
      label = `COL${i + 1}`;
      payout = 2;
    } else if (["1–12","13–24","25–36"].includes(label)) payout = 2;

    bet.onclick = () => toggleBet(bet, { type: "outside", label, payout, el: bet });
  });

  document.querySelectorAll(".bet-zero").forEach(el => {
    el.onclick = () =>
      toggleBet(el, { type: "number", value: el.textContent, payout: 35, el });
  });
}

function toggleBet(el, bet) {
  if (spinning) return;

  const existing = bets.find(b => b.el === el);
  if (existing) {
    bets = bets.filter(b => b !== existing);
    el.classList.remove("ring-4");
  } else {
    bets.push(bet);
    el.classList.add("ring-4");
  }
  updatePotentialWin();
}

/* =======================
   BALANCE
======================= */
function updateBalance() {
  balanceEl.textContent = `Balance: $${balance}`;
}

/* =======================
   INIT
======================= */
drawBoard();
drawWheel();
updateBalance();
betAmountInput.addEventListener("input", updatePotentialWin);
spinBtn.addEventListener("click", spin);
