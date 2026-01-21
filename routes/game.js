import { Router } from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import CardRoom from "../models/CardRoom.js";
var router = Router();

router.get("/simon", function (req, res, next) {
  res.render("game/simon", { title: "Express" });
});

router.get("/mario", function (req, res, next) {
  res.render("game/mario", { title: "Express" });
});

router.get("/snake", function (req, res, next) {
  res.render("game/snake", { title: "Express" });
});

router.get("/flappybird", function (req, res, next) {
  res.render("game/flappybird", { title: "Express" });
});

router.get("/card", function (req, res, next) {
  res.render("game/card", { title: "Express" });
});

router.get("/blackjack", function (req, res, next) {
  res.render("game/blackjack/index", { title: "Express" });
});

router.get("/blackjack/:id", function (req, res, next) {
  res.render("game/blackjack/play", { title: "Express" });
});

router.get("/roulette", function (req, res, next) {
  res.render("game/roulette/index", { title: "Express" });
});

router.get("/roulette/:id", function (req, res, next) {
  res.render("game/roulette/play", { title: "Express" });
});

router.get("/slot", function (req, res, next) {
  res.render("game/slot", { title: "Express" });
});

router.get("/endlessrunner", function (req, res, next) {
  res.render("game/endlessrunner", { title: "Express" });
});

router.get("/cubedodger", function (req, res, next) {
  res.render("game/cubedodger", { title: "Express" });
});

router.get("/slither", function (req, res, next) {
  res.render("game/slither", { title: "Express" });
});

router.get("/twocard", async function (req, res, next) {
  const rooms = await CardRoom.find({ status: "waiting" })
    .select("roomId players status")
    .lean();

  const playableRooms = rooms.map((room) => {
    const readyPlayers = room.players.filter(
      (p) => p.status === "ready",
    ).length;
    return {
      ...room,
      totalPlayers: room.players.length,
      readyPlayers,
    };
  });
  res.render("game/twocard/index", { room: playableRooms });
});

router.get("/twocard/:id", auth, async function (req, res, next) {
  const user = await User.findById(req.user.id);
  res.render("game/twocard/play", { user: user });
});

export default router;
