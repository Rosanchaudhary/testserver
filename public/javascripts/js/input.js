import { moveLeft, moveRight, jump } from "./player.js";

export function initInput() {
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") moveLeft();
    if (e.key === "ArrowRight") moveRight();
    if (e.key === "ArrowUp") jump();
  });
}
