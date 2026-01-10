import express from "express";
import RouletteGame from "../models/RouletteGame.js";
import auth from "../middleware/auth.js";

import crypto from "crypto";
const router = express.Router();




// American roulette order (same as frontend)
const wheel = [
  "0","28","9","26","30","11","7","20","32","17","5","22","34","15",
  "3","24","36","13","1","00","27","10","25","29","12","8","19","31",
  "18","6","21","33","16","4","23","35","14","2"
];

router.post("/spin", (req, res) => {
  // Cryptographically secure random index
  const randomIndex = crypto.randomInt(0, wheel.length);

  const result = wheel[randomIndex];

  res.json({
    index: randomIndex,
    number: result,
    wheelSize: wheel.length
  });
});


/* START GAME */
router.post("/start", auth, async (req, res) => {
  const game = await RouletteGame.create({
    userId: req.user.id,
  });

  res.json({ gameId: game._id });
});

/* PLACE BET */
router.post("/:id/bet", auth, async (req, res) => {
  const { number, amount } = req.body;

  if (
    typeof number !== "number" ||
    number < 0 ||
    number > 36 ||
    typeof amount !== "number" ||
    amount <= 0
  ) {
    return res.status(400).json({ error: "Invalid bet data" });
  }

  const game = await RouletteGame.findOne({
    _id: req.params.id,
    userId: req.user.id,
    status: "betting",
  });

  if (!game) {
    return res.status(400).json({ error: "Invalid game" });
  }

  game.betNumber = number;
  game.betAmount = amount;
  await game.save();

  res.json({ success: true });
});

/* SPIN */
router.post("/:id/spin", auth, async (req, res) => {
  const game = await RouletteGame.findOne({
    _id: req.params.id,
    userId: req.user.id,
    status: "betting",
  });

  if (!game) {
    return res.status(400).json({ error: "Invalid game" });
  }

  if (game.betAmount <= 0 || game.betNumber === undefined) {
    return res.status(400).json({ error: "No bet placed" });
  }

  const result = Math.floor(Math.random() * 37);

  game.resultNumber = result;
  game.status = "finished";
  game.winAmount = 0;

  if (game.betNumber === result) {
    game.winAmount = game.betAmount * 35;
  }

  await game.save();

  res.json({
    result,
    winAmount: game.winAmount,
  });
});

/* GET GAME */
router.get("/:id/get", auth, async (req, res) => {
  const game = await RouletteGame.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  res.json(game);
});







export default router;
