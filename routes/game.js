import { Router } from "express";
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

export default router;
