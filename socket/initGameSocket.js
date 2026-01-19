import jwt from "jsonwebtoken";
import CardRoom from "../models/CardRoom.js";
import User from "../models/User.js";
import cookie from "cookie";

export function initGameSocket(io) {
  /* =========================
     SOCKET AUTH (JWT)
  ========================= */
  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;

      if (!rawCookie) return next(new Error("No cookie found"));

      const cookies = cookie.parse(rawCookie);
      const token = cookies.token;
      if (!token) return next(new Error("No token found"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.user.id;

      const user = await User.findById(userId).select("_id name isGuest");
      if (!user) return next(new Error("User not found"));

      socket.user = {
        id: user.id.toString(),
        name: user.name || "Guest",
        isGuest: user.isGuest,
      };

      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  /* =========================
     CONSTANTS
  ========================= */
  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = [
    "2","3","4","5","6","7","8","9","10","J","Q","K","A"
  ];
  const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i]));

  /* =========================
     HELPERS
  ========================= */
  function createDeck() {
    const deck = [];
    for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function buildPublicState(room) {
    return {
      roomId: room.roomId,
      status: room.status,
      turn: room.turn,
      winner: room.winner,
      centerPile: room.centerPile,
      players: {
        player1: room.players.player1 ? {
          name: room.players.player1.name,
          userId: room.players.player1.userId,
          score: room.players.player1.score,
          connected: !!room.players.player1.socketId
        } : null,
        player2: room.players.player2 ? {
          name: room.players.player2.name,
          userId: room.players.player2.userId,
          score: room.players.player2.score,
          connected: !!room.players.player2.socketId
        } : null,
      },
    };
  }

  function buildPrivateState(room, key) {
    return {
      ...buildPublicState(room),
      you: {
        hand: room.players[key].hand,
        score: room.players[key].score,
        userId: room.players[key].userId,
      },
    };
  }

  function getPlayerKey(room, socketId) {
    return Object.entries(room.players).find(
      ([, p]) => p?.socketId === socketId
    )?.[0];
  }

  /* =========================
     GAME LOGIC
  ========================= */
  function resolveTrick(room) {
    if (room.centerPile.length !== 2) return;

    const [c1, c2] = room.centerPile;
    const v1 = RANK_VALUE[c1.rank];
    const v2 = RANK_VALUE[c2.rank];

    if (v1 === v2) {
      room.centerPile = [];
      return;
    }

    const winner = v1 > v2 ? c1.playedBy : c2.playedBy;
    room.players[winner].score++;
    room.turn = winner;
    room.centerPile = [];
  }

  async function finishGame(room) {
    const p1 = room.players.player1.score;
    const p2 = room.players.player2.score;

    room.status = "finished";
    room.winner = p1 === p2 ? "draw" : p1 > p2 ? "player1" : "player2";

    await CardRoom.findOneAndUpdate(
      { roomId: room.roomId },
      {
        status: room.status,
        winner: room.winner,
        "players.player1.score": p1,
        "players.player2.score": p2,
        centerPile: []
      }
    );

    io.to(room.roomId).emit("game_state", buildPublicState(room));
  }

  function isGameOver(room) {
    return (
      room.players.player1.hand.length === 0 &&
      room.players.player2.hand.length === 0
    );
  }

  async function getPlayableRooms() {
    const rooms = await CardRoom.find({ status: "waiting" }).lean();
    return rooms.map(r => ({
      roomId: r.roomId,
      host: r.players.player1.name
    }));
  }

  /* =========================
     SOCKET EVENTS
  ========================= */
  io.on("connection", (socket) => {

    /* ---- CREATE ROOM ---- */
    socket.on("create_room", async ({ roomId }) => {
      try {
        const existing = await CardRoom.findOne({ roomId });
        if (existing) return socket.emit("error", "Room already exists");

        const deck = createDeck();
        const room = await CardRoom.create({
          roomId,
          players: {
            player1: {
              userId: socket.user.id,
              name: socket.user.name,
              socketId: socket.id,
              hand: deck.splice(0, 13),
              score: 0
            }
          },
          deck,
          centerPile: [],
          turn: "player1",
          status: "waiting",
          winner: null
        });

        socket.join(roomId);
        socket.emit("game_state", buildPrivateState(room, "player1"));
        io.emit("room_list", await getPlayableRooms());

      } catch (err) {
        console.error(err);
        socket.emit("error", "Cannot create room");
      }
    });

    /* ---- JOIN ROOM ---- */
    socket.on("join_room", async ({ roomId }) => {
      try {
        const room = await CardRoom.findOne({ roomId });
        if (!room) return socket.emit("error", "Room not found");
        if (room.status === "finished") return socket.emit("error", "Game finished");

        // check if reconnect
        for (const key of ["player1", "player2"]) {
          if (room.players[key]?.userId.toString() === socket.user.id.toString()) {
            room.players[key].socketId = socket.id;
            await room.save();
            socket.join(roomId);
            socket.emit("game_state", buildPrivateState(room, key));
            io.to(roomId).emit("game_state", buildPublicState(room));
            return io.emit("room_list", await getPlayableRooms());
          }
        }

        // join as player2
        if (!room.players.player2 && room.status === "waiting") {
          room.players.player2 = {
            userId: socket.user.id,
            name: socket.user.name,
            socketId: socket.id,
            hand: room.deck.splice(0, 13),
            score: 0
          };
          room.status = "playing";
          await room.save();

          socket.join(roomId);
          socket.emit("game_state", buildPrivateState(room, "player2"));
          io.to(roomId).emit("game_state", buildPublicState(room));
          return io.emit("room_list", await getPlayableRooms());
        }

        socket.emit("error", "Cannot join room");
      } catch (err) {
        console.error(err);
        socket.emit("error", "Join failed");
      }
    });

    /* ---- PLAY CARD ---- */
    socket.on("play_card", async ({ roomId, rank, suit }) => {
      try {
        const room = await CardRoom.findOne({ roomId });
        if (!room || room.status !== "playing") return;

        const key = getPlayerKey(room, socket.id);
        if (!key || room.turn !== key) return;

        const hand = room.players[key].hand;
        const idx = hand.findIndex(c => c.rank === rank && c.suit === suit);
        if (idx === -1) return;

        const [card] = hand.splice(idx, 1);
        room.centerPile.push({ ...card, playedBy: key });
        room.turn = key === "player1" ? "player2" : "player1";

        resolveTrick(room);

        if (isGameOver(room)) await finishGame(room);
        else await room.save();

        io.to(roomId).emit("game_state", buildPublicState(room));
      } catch (err) {
        console.error(err);
      }
    });

    /* ---- GET PLAYABLE ROOMS ---- */
    socket.on("get_rooms", async () => {
      socket.emit("room_list", await getPlayableRooms());
    });

    /* ---- DISCONNECT ---- */
    socket.on("disconnect", async () => {
      try {
        // remove socketId for the disconnected player
        const rooms = await CardRoom.find({
          "players.player1.socketId": socket.id
        });
        for (const room of rooms) {
          if (room.players.player1.socketId === socket.id) {
            room.players.player1.socketId = null;
            await room.save();
          }
        }

        const rooms2 = await CardRoom.find({
          "players.player2.socketId": socket.id
        });
        for (const room of rooms2) {
          if (room.players.player2.socketId === socket.id) {
            room.players.player2.socketId = null;
            await room.save();
          }
        }
      } catch (err) {
        console.error(err);
      }
    });

  });
}
