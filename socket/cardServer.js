

export default function initSocket(io) {


  /* ================= CARD UTILS ================= */

  function createDeck() {
    const ranks = [
      "A",
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
    ];
    const suits = ["♠", "♥", "♦", "♣"];
    const deck = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit });
      }
    }

    return deck;
  }

  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  const rankValue = (rank) =>
    ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"].indexOf(
      rank
    );

  /* ================= GAME ROOMS ================= */

  let waitingSocket = null;

  /**
   * roomId -> {
   *   A: socketId,
   *   B: socketId,
   *   state: {
   *     currentTurn: "A" | "B",
   *     hands: { A: [], B: [] },
   *     trick: { A?: card, B?: card }
   *   }
   * }
   */
  const rooms = {};

  /* ================= SOCKET HANDLERS ================= */

  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    /* ---------- MATCHMAKING ---------- */

    if (!waitingSocket) {
      waitingSocket = socket;
      socket.emit("waiting-for-player");
    } else {
      const roomId = waitingSocket.id;

      rooms[roomId] = {
        A: waitingSocket.id,
        B: socket.id,
        state: {
          currentTurn: "A",
          hands: { A: [], B: [] },
          trick: {},
        },
      };

      waitingSocket.join(roomId);
      socket.join(roomId);

      io.to(roomId).emit("game-ready", {
        roomId,
        players: {
          A: rooms[roomId].A,
          B: rooms[roomId].B,
        },
      });

      waitingSocket = null;
    }

    /* ---------- DEAL ---------- */

    socket.on("request-deal", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;

      // Only Player A can deal
      if (socket.id !== room.A) return;

      const deck = createDeck();
      shuffle(deck);

      room.state = {
        currentTurn: "A",
        hands: {
          A: deck.splice(0, 5),
          B: deck.splice(0, 5),
        },
        trick: {},
      };

      io.to(room.A).emit("deal-cards", {
        hand: room.state.hands.A,
        currentTurn: "A",
      });

      io.to(room.B).emit("deal-cards", {
        hand: room.state.hands.B,
        currentTurn: "A",
      });
    });

    /* ---------- PLAY CARD ---------- */

    socket.on("play-card", ({ roomId, index }) => {
      const room = rooms[roomId];
      if (!room) return;

      const role =
        socket.id === room.A
          ? "A"
          : socket.id === room.B
          ? "B"
          : null;

      if (!role) return;

      const state = room.state;

      // Wrong turn
      if (state.currentTurn !== role) return;

      const hand = state.hands[role];
      if (!hand[index]) return;

      const card = hand.splice(index, 1)[0];
      state.trick[role] = card;

      io.to(roomId).emit("card-played", {
        role,
        card,
      });

      /* ---------- TURN / TRICK LOGIC ---------- */

      // First card → switch turn
      if (Object.keys(state.trick).length === 1) {
        state.currentTurn = role === "A" ? "B" : "A";
        io.to(roomId).emit("turn-update", state.currentTurn);
        return;
      }

      // Second card → resolve trick
      const cardA = state.trick.A;
      const cardB = state.trick.B;

      const winner =
        rankValue(cardA.rank) > rankValue(cardB.rank) ? "A" : "B";

      state.trick = {};
      state.currentTurn = winner;

      io.to(roomId).emit("trick-result", {
        winner,
        nextTurn: winner,
      });

      // Game over
      if (
        state.hands.A.length === 0 &&
        state.hands.B.length === 0
      ) {
        io.to(roomId).emit("game-over", { winner });
      }
    });

    /* ---------- DISCONNECT ---------- */

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);

      if (waitingSocket && waitingSocket.id === socket.id) {
        waitingSocket = null;
        return;
      }

      for (const roomId in rooms) {
        const room = rooms[roomId];

        if (room.A === socket.id || room.B === socket.id) {
          io.to(roomId).emit("opponent-left");
          delete rooms[roomId];
          break;
        }
      }
    });
  });
}
