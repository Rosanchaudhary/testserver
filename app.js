//app.js
import createError from "http-errors";
import express, { json, urlencoded } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import roomRoutes from "./routes/room.js";
import messageRoutes from "./routes/message.js";
import twoCardRoutes from "./routes/twocard.js";
import blackJackRoutes from "./routes/blackjack.js";
import gameRouters from "./routes/game.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const allowedOrigins = [
  process.env.ALLOWED_ORIGINS,
  process.env.ALLOWED_ORIGINS_TWO,
];
console.log(allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.options("*", cors());

// view engine setup
app.set("views", join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });

// Routes
app.use("/", indexRouter);
app.use("/game", gameRouters);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/twocard", twoCardRoutes);
app.use("/api/v1/blackjack",blackJackRoutes)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

export default app;
