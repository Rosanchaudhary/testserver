import CardRoom from "../models/CardRoom.js";

/* =======================
   Utilities
======================= */

const RANK_VALUE = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const SUITS = ["♠", "♥", "♦", "♣"];

function compareCards(a, b, trump) {
  const aTrump = a.suit === trump;
  const bTrump = b.suit === trump;

  if (aTrump && !bTrump) return a;
  if (bTrump && !aTrump) return b;

  if (RANK_VALUE[a.rank] > RANK_VALUE[b.rank]) return a;
  if (RANK_VALUE[b.rank] > RANK_VALUE[a.rank]) return b;

  return null;
}

function createDeck() {
  const ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];
  const deck = [];

  for (const s of SUITS) for (const r of ranks) deck.push({ rank: r, suit: s });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/* =======================
   Socket Engine
======================= */

export function initCardGameSocket(io) {
  io.on("connection", (socket) => {
    /* ---------- JOIN ---------- */
    socket.on("joinRoom", async ({ roomId, userId }) => {
      const room = await CardRoom.findOne({ roomId });
      if (!room) return socket.emit("error", { message: "Room not found" });

      let player = room.players.find((p) => p.userId === userId);

      if (!player && room.players.length < 2) {
        room.players.push({
          userId,
          socketId: socket.id,
          name: `Player ${room.players.length + 1}`,
          hand: [],
          score: 0,
          status: "ready",
        });
      } else if (player) {
        player.socketId = socket.id;
        player.status = "ready";
      } else {
        return socket.emit("error", { message: "Room full" });
      }

      socket.join(roomId);

      if (room.players.length === 2 && room.status === "waiting") {
        const deck = createDeck();
        room.players.forEach((p) => (p.hand = deck.splice(0, 5)));
        room.trumpSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
        room.turn = room.players[0].userId;
        room.centerPile = [];
        room.status = "playing";
      }

      await room.save();
      emitState(io, room);
    });

    /* ---------- PLAY CARD ---------- */
    socket.on("playCard", async ({ roomId, userId, card }) => {
      const room = await CardRoom.findOne({ roomId });
      if (!room || room.status !== "playing") return;
      if (room.turn !== userId) return;

      const player = room.players.find((p) => p.userId === userId);
      if (!player) return;

      const idx = player.hand.findIndex(
        (c) => c.rank === card.rank && c.suit === card.suit,
      );
      if (idx === -1) return;

      const [played] = player.hand.splice(idx, 1);

      room.centerPile.push({
        rank: played.rank,
        suit: played.suit,
        playedBy: userId,
      });

      room.turn = room.players.find((p) => p.userId !== userId).userId;
      await room.save();
      emitState(io, room);

      if (room.centerPile.length === 2) {
        setTimeout(() => resolveRound(io, roomId), 1200);
      }
    });

    /* ---------- DISCONNECT ---------- */
    socket.on("disconnect", async () => {
      const room = await CardRoom.findOne({ "players.socketId": socket.id });
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) player.status = "offline";

      await room.save();
      emitState(io, room);
    });
  });
}

/* =======================
   Helpers
======================= */

async function resolveRound(io, roomId) {
  const room = await CardRoom.findOne({ roomId });
  if (!room) return;

  const [a, b] = room.centerPile;
  const winnerCard = compareCards(a, b, room.trumpSuit);

  if (!winnerCard) {
    room.centerPile = [];
    await room.save();
    io.to(roomId).emit("roundTie");
    emitState(io, room);
    return;
  }

  const winner = room.players.find((p) => p.userId === winnerCard.playedBy);
  winner.score += 1;
  room.turn = winner.userId;
  room.centerPile = [];

  if (room.players.every((p) => p.hand.length === 0)) {
    room.status = "finished";
    const [p1, p2] = room.players;
    if (p1.score > p2.score) room.winner = p1.userId;
    else if (p2.score > p1.score) room.winner = p2.userId;
    else room.isDraw = true;

    await room.save();
    io.to(roomId).emit("gameOver", {
      winner: room.winner,
      isDraw: room.isDraw,
    });
    emitState(io, room);
    return;
  }

  await room.save();
  io.to(roomId).emit("roundWin", { winnerId: winner.userId });
  emitState(io, room);
}

function emitState(io, room) {
  room.players.forEach((player) => {
    if (!player.socketId) return;

    const me = player;
    const opponent = room.players.find((p) => p.userId !== me.userId);

    io.to(player.socketId).emit("roomState", {
      players: [
        {
          userId: me.userId,
          name: me.name,
          hand: me.hand, // ✅ full hand
          score: me.score,
          status: me.status,
        },
        opponent && {
          userId: opponent.userId,
          name: opponent.name,
          handCount: opponent.hand.length, // ✅ only count
          score: opponent.score,
          status: opponent.status,
        },
      ].filter(Boolean),

      turn: room.turn,
      centerPile: room.centerPile,
      trumpSuit: room.trumpSuit,
      status: room.status,
      winner: room.winner,
      isDraw: room.isDraw,
    });
  });
}
