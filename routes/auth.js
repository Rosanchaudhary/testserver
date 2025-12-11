import dotenv from "dotenv";
dotenv.config(); // Load environment variables

import { Router } from "express";
var router = Router();
import { genSalt, hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

/* REGISTER */
router.post("/register", async function (req, res) {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token: token, userId: user.id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

/* LOGIN */
router.post("/login", async function (req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token: token, userId: user.id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

/* GET CURRENT USER */
router.get("/me", auth, async function (req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

export default router;
