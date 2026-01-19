import CardRoom from "../models/CardRoom.js";

/* =======================
   Rank + Trump Utilities
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

function compareCards(cardA, cardB, trumpSuit) {
  const aTrump = cardA.suit === trumpSuit;
  const bTrump = cardB.suit === trumpSuit;

  if (aTrump && !bTrump) return cardA;
  if (bTrump && !aTrump) return cardB;

  const valueA = RANK_VALUE[cardA.rank];
  const valueB = RANK_VALUE[cardB.rank];

  if (valueA > valueB) return cardA;
  if (valueB > valueA) return cardB;

  return null; // tie
}

/* =======================
   Deck Utility
======================= */

function createDeck() {
  const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  const deck = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }

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
    console.log("Connected:", socket.id);

    /* ---------- JOIN ROOM ---------- */

    socket.on("joinRoom", async ({ roomId, userId }) => {
      try {
        const room = await CardRoom.findOne({ roomId });
        if (!room) return socket.emit("error", { message: "Room not found" });

        let player = room.players.find(p => p.userId.toString() === userId);

        if (player) {
          player.socketId = socket.id;
          player.status = "ready";
        } else if (room.players.length < 2) {
          room.players.push({
            userId,
            socketId: socket.id,
            name: `Player ${room.players.length + 1}`,
            status: "ready",
            hand: [],
            score: 0
          });
        } else {
          return socket.emit("error", { message: "Room full" });
        }

        socket.join(roomId);

        const ready = room.players.filter(p => p.status === "ready");

        /* ---------- START GAME ---------- */
        if (ready.length === 2 && room.status !== "playing") {
          const deck = createDeck();
          const handSize = 5;

          room.players.forEach(p => {
            p.hand = deck.splice(0, handSize);
          });

          room.trumpSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
          room.turn = room.players[0].userId;
          room.centerPile = [];
          room.status = "playing";
        }

        await room.save();

        io.to(roomId).emit("roomState", {
          players: room.players,
          turn: room.turn,
          centerPile: room.centerPile,
          trumpSuit: room.trumpSuit,
          status: room.status
        });
      } catch (err) {
        console.error(err);
        socket.emit("error", { message: "Join failed" });
      }
    });

    /* ---------- PLAY CARD ---------- */

    socket.on("playCard", async ({ roomId, userId, card }) => {
      try {
        const room = await CardRoom.findOne({ roomId });
        if (!room || room.status !== "playing") return;

        if (room.turn.toString() !== userId) {
          return socket.emit("error", { message: "Not your turn" });
        }

        const player = room.players.find(p => p.userId.toString() === userId);
        if (!player) return;

        const index = player.hand.findIndex(
          c => c.rank === card.rank && c.suit === card.suit
        );
        if (index === -1) return;

        const [playedCard] = player.hand.splice(index, 1);

        room.centerPile.push({
          rank: playedCard.rank,
          suit: playedCard.suit,
          playedBy: userId
        });

        const other = room.players.find(p => p.userId.toString() !== userId);
        room.turn = other.userId;

        await room.save();

        io.to(roomId).emit("roomState", {
          players: room.players,
          turn: room.turn,
          centerPile: room.centerPile,
          trumpSuit: room.trumpSuit
        });

        /* ---------- RESOLVE ROUND ---------- */

        if (room.centerPile.length === 2) {
          setTimeout(async () => {
            const freshRoom = await CardRoom.findOne({ roomId });
            if (!freshRoom) return;

            const [cardA, cardB] = freshRoom.centerPile;
            const winningCard = compareCards(cardA, cardB, freshRoom.trumpSuit);

            /* ---------- TIE ---------- */
            if (!winningCard) {
              freshRoom.centerPile = [];
              await freshRoom.save();

              io.to(roomId).emit("roundTie", { message: "Tie! Replay." });
              io.to(roomId).emit("roomState", {
                players: freshRoom.players,
                turn: freshRoom.turn,
                centerPile: []
              });
              return;
            }

            /* ---------- WIN ---------- */
            const winner = freshRoom.players.find(
              p => p.userId.toString() === winningCard.playedBy.toString()
            );

            winner.score += 1;
            freshRoom.turn = winner.userId;
            freshRoom.centerPile = [];

            /* ---------- END GAME ---------- */
            const handsEmpty = freshRoom.players.every(p => p.hand.length === 0);

            if (handsEmpty) {
              freshRoom.status = "finished";

              const [p1, p2] = freshRoom.players;
              if (p1.score > p2.score) freshRoom.winner = p1.userId;
              else if (p2.score > p1.score) freshRoom.winner = p2.userId;
              else freshRoom.isDraw = true;

              await freshRoom.save();

              io.to(roomId).emit("gameOver", {
                winner: freshRoom.winner,
                isDraw: freshRoom.isDraw,
                players: freshRoom.players
              });
              return;
            }

            await freshRoom.save();

            io.to(roomId).emit("roundWin", {
              winnerId: winner.userId
            });

            io.to(roomId).emit("roomState", {
              players: freshRoom.players,
              turn: freshRoom.turn,
              centerPile: [],
              trumpSuit: freshRoom.trumpSuit
            });
          }, 1500);
        }
      } catch (err) {
        console.error(err);
      }
    });

    /* ---------- DISCONNECT ---------- */

    socket.on("disconnect", async () => {
      const room = await CardRoom.findOne({ "players.socketId": socket.id });
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (player) player.status = "offline";

      await room.save();

      io.to(room.roomId).emit("roomState", {
        players: room.players,
        turn: room.turn,
        centerPile: room.centerPile
      });
    });
  });
}
