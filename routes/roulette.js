import express from "express";
import RouletteGame from "../models/RouletteGame.js";
import auth from "../middleware/auth.js";

const router = express.Router();

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
