import express from "express";
import BlackjackGame from "../models/BlackjackGame.js";
import { createShuffledDeck, handValue } from "../utils/blackjack.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * START GAME
 */
router.post("/start", auth, async (req, res) => {
  const userId = req.user.id;

  const deck = createShuffledDeck();
  const playerHand = [deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop()];

  const game = await BlackjackGame.create({
    userId,
    deck,
    playerHand,
    dealerHand,
  });

  res.json({ gameId: game._id });
});

/**
 * GET GAME
 */
router.get("/:id/get", auth, async (req, res) => {
  const userId = req.user.id;

  const game = await BlackjackGame.findOne({
    _id: req.params.id,
    userId, // 🔐 ownership check
  });

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  const isFinished = game.status === "finished";

  res.json({
    gameId: game._id,
    playerHand: game.playerHand,
    dealerHand: isFinished ? game.dealerHand : [game.dealerHand[1]],
    playerTotal: handValue(game.playerHand),
    dealerTotal: isFinished ? handValue(game.dealerHand) : null,
    status: game.status,
    result: game.result,
  });
});

/**
 * HIT
 */
router.post("/:id/hit", auth, async (req, res) => {
  const game = await BlackjackGame.findById(req.params.id);
  if (!game || game.status !== "playing") {
    return res.status(400).json({ error: "Invalid game" });
  }

  game.playerHand.push(game.deck.pop());
  const total = handValue(game.playerHand);

  if (total > 21) {
    game.status = "finished";
    game.result = "dealer";
  }

  await game.save();

  res.json({
    playerHand: game.playerHand,
    playerTotal: total,
    gameOver: game.status === "finished",
    dealerHand:
      game.status === "finished" ? game.dealerHand : [game.dealerHand[1]],
  });
});

/**
 * STAND
 */
router.post("/:id/stand", auth, async (req, res) => {
  const game = await BlackjackGame.findById(req.params.id);
  if (!game || game.status !== "playing") {
    return res.status(400).json({ error: "Invalid game" });
  }

  while (handValue(game.dealerHand) < 17) {
    game.dealerHand.push(game.deck.pop());
  }

  const playerTotal = handValue(game.playerHand);
  const dealerTotal = handValue(game.dealerHand);

  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    game.result = "player";
  } else if (dealerTotal > playerTotal) {
    game.result = "dealer";
  } else {
    game.result = "push";
  }

  game.status = "finished";
  await game.save();

  res.json({
    dealerHand: game.dealerHand,
    dealerTotal,
    playerTotal,
    result: game.result,
  });
});

export default router;
