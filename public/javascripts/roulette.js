const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resultEl = document.getElementById("result");

// American roulette order (clockwise)
const wheel = [
  "0",
  "28",
  "9",
  "26",
  "30",
  "11",
  "7",
  "20",
  "32",
  "17",
  "5",
  "22",
  "34",
  "15",
  "3",
  "24",
  "36",
  "13",
  "1",
  "00",
  "27",
  "10",
  "25",
  "29",
  "12",
  "8",
  "19",
  "31",
  "18",
  "6",
  "21",
  "33",
  "16",
  "4",
  "23",
  "35",
  "14",
  "2",
];

const redNumbers = new Set([
  "1",
  "3",
  "5",
  "7",
  "9",
  "12",
  "14",
  "16",
  "18",
  "19",
  "21",
  "23",
  "25",
  "27",
  "30",
  "32",
  "34",
  "36",
]);

function getColor(num) {
  if (num === "0" || num === "00") return "#22c55e";
  return redNumbers.has(num) ? "#ef4444" : "#020617";
}

const center = canvas.width / 2;
const radius = center - 5;
const sliceAngle = (2 * Math.PI) / wheel.length;

let rotation = 0;
let spinning = false;

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

async function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  resultEl.textContent = "";

  const res = await fetch("http://localhost:30106/api/v1/roulette/spin", {
    method: "POST",
  });
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
    const easeOut = 1 - Math.pow(1 - progress, 3);

    rotation = easeOut * targetAngle;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      spinBtn.disabled = false;
      resultEl.textContent = `Result: ${data.number}`;
    }
  }

  requestAnimationFrame(animate);
}

function finishSpin(number) {
  spinning = false;
  spinBtn.disabled = false;
  resultEl.textContent = `Result: ${number}`;
}

spinBtn.addEventListener("click", spin);

drawWheel();
