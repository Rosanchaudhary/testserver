import dotenv from "dotenv";
dotenv.config();

import User from "../models/User.js";
import jwt from "jsonwebtoken";

export default async function guestUser(req, res, next) {
  const token = req.cookies?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.user.id);
      if (!user) throw new Error("User not found");

      req.user = user;
      return next();
    } catch (err) {
      // invalid / expired token → treat as new guest
      res.clearCookie("token");
    }
  }

  // FIRST VISIT or INVALID TOKEN
  const user = await User.create({
    name: "Guest",
    isGuest: true,
  });

  const payload = { user: { id: user.id } };

  const newToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.cookie("token", newToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60, // 1 hour (match JWT)
  });

  req.user = user;
  next();
}
