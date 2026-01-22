import HoldemCardRoom from "../../models/HoldemCardRoom.js";
import { evaluateHand } from "../../utils/holdem/handEvaluator.js";

/* ================= Utilities ================= */

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const BASE_BET = 10;

function createDeck() {
  const d = [];
  for (const s of SUITS)
    for (const r of RANKS)
      d.push({ rank: r, suit: s });

  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

const maxBet = r =>
  Math.max(...r.players.map(p => p.currentBet));

const bettingDone = r =>
  r.players
    .filter(p => p.status === "active")
    .every(p => p.currentBet === maxBet(r) && p.hasActed);

/* ================= Game Flow ================= */

function startHand(room) {
  room.deck = createDeck();
  room.communityCards = [];
  room.pot = 0;
  room.street = "pre-flop";
  room.status = "playing";
  room.winner = null;
  room.isDraw = false;
  room.minimumBet = BASE_BET;

  room.players.forEach(p => {
    p.holeCards = room.deck.splice(0, 2);
    p.currentBet = 0;
    p.hasActed = false;
    p.status = p.chips > 0 ? "active" : "allin";
  });

  const sb = BASE_BET / 2;
  const bb = BASE_BET;

  const dealer = room.players[room.dealerIndex];
  const other = room.players[(room.dealerIndex + 1) % 2];

  dealer.chips -= sb;
  dealer.currentBet = sb;

  other.chips -= bb;
  other.currentBet = bb;

  room.pot = sb + bb;

  // Dealer acts first pre-flop (correct HU rule)
  room.currentTurnIndex = room.dealerIndex;
}

function advanceStreet(room) {
  room.players.forEach(p => {
    p.currentBet = 0;
    p.hasActed = false;
  });

  room.minimumBet = BASE_BET;

  if (room.street === "pre-flop") {
    room.communityCards.push(...room.deck.splice(0, 3));
    room.street = "flop";
  } else if (room.street === "flop") {
    room.communityCards.push(room.deck.splice(0, 1)[0]);
    room.street = "turn";
  } else if (room.street === "turn") {
    room.communityCards.push(room.deck.splice(0, 1)[0]);
    room.street = "river";
  } else {
    return showdown(room);
  }

  // Dealer acts first post-flop (FIXED)
  room.currentTurnIndex = room.dealerIndex;
}

function showdown(room) {
  const alive = room.players.filter(p => p.status !== "folded");

  const scored = alive
    .map(p => ({
      p,
      h: evaluateHand([...p.holeCards, ...room.communityCards]),
    }))
    .sort((a, b) => {
      if (b.h.rank !== a.h.rank) return b.h.rank - a.h.rank;
      for (let i = 0; i < b.h.kickers.length; i++) {
        if (b.h.kickers[i] !== a.h.kickers[i])
          return b.h.kickers[i] - a.h.kickers[i];
      }
      return 0;
    });

  const best = scored[0];
  const tied = scored.filter(s =>
    s.h.rank === best.h.rank &&
    JSON.stringify(s.h.kickers) === JSON.stringify(best.h.kickers)
  );

  if (tied.length > 1) {
    room.isDraw = true;
    const split = Math.floor(room.pot / tied.length);
    tied.forEach(t => (t.p.chips += split));
  } else {
    room.winner = best.p.userId;
    best.p.chips += room.pot;
  }

  room.pot = 0;
  room.status = "finished";

  setTimeout(() => resetHand(room), 2500);
}

function resetHand(room) {
  room.dealerIndex = (room.dealerIndex + 1) % 2;
  room.handNumber += 1;
  startHand(room);
}

/* ================= Socket ================= */

export function initHoldemSocket(io, socket) {

  socket.on("joinHoldemRoom", async ({ roomId, userId }) => {
    let room = await HoldemCardRoom.findOne({ roomId });
    if (!room) room = await HoldemCardRoom.create({ roomId });

    let p = room.players.find(x => x.userId === userId);

    if (!p && room.players.length < 2)
      room.players.push({ userId, socketId: socket.id });
    else if (p)
      p.socketId = socket.id;
    else return;

    socket.join(roomId);

    if (room.players.length === 2 && room.status === "waiting")
      startHand(room);

    await room.save();
    emit(io, room);
  });

  socket.on("holdemAction", async ({ roomId, userId, action, amount }) => {
    const room = await HoldemCardRoom.findOne({ roomId });
    if (!room || room.status !== "playing") return;

    const p = room.players[room.currentTurnIndex];
    if (p.userId !== userId) return;

    const mb = maxBet(room);

    if (action === "fold") {
      p.status = "folded";
    }

    if (action === "check" && p.currentBet !== mb) return;

    if (action === "call") {
      const pay = Math.min(mb - p.currentBet, p.chips);
      p.chips -= pay;
      p.currentBet += pay;
      room.pot += pay;
      if (p.chips === 0) p.status = "allin";
    }

    if (action === "raise") {
      const raise = Math.max(amount, room.minimumBet);
      const total = mb + raise;
      const pay = Math.min(total - p.currentBet, p.chips);

      p.chips -= pay;
      p.currentBet += pay;
      room.pot += pay;
      room.minimumBet = raise;

      if (p.chips === 0) p.status = "allin";
    }

    p.hasActed = true;

    // ✅ Fold win
    const active = room.players.filter(x => x.status === "active");
    if (active.length === 1) {
      room.winner = active[0].userId;
      active[0].chips += room.pot;
      room.pot = 0;
      room.status = "finished";
      await room.save();
      emit(io, room);
      return setTimeout(() => resetHand(room), 2500);
    }

    // ✅ All-in auto runout
    if (room.players.every(p => p.status !== "active")) {
      while (room.street !== "river") advanceStreet(room);
      showdown(room);
      await room.save();
      emit(io, room);
      return;
    }

    if (bettingDone(room)) advanceStreet(room);
    else room.currentTurnIndex = (room.currentTurnIndex + 1) % 2;

    await room.save();
    emit(io, room);
  });
}

function emit(io, room) {
  room.players.forEach(me => {
    if (!me.socketId) return;
    const opp = room.players.find(p => p.userId !== me.userId);

    io.to(me.socketId).emit("holdemRoomState", {
      players: [
        {
          userId: me.userId,
          name: me.name,
          holeCards: me.holeCards,
          chips: me.chips,
          currentBet: me.currentBet,
          status: me.status,
        },
        opp && {
          userId: opp.userId,
          name: opp.name,
          chips: opp.chips,
          currentBet: opp.currentBet,
          status: opp.status,
        },
      ].filter(Boolean),
      communityCards: room.communityCards,
      pot: room.pot,
      street: room.street,
      status: room.status,
      winner: room.winner,
      currentTurnUserId: room.players[room.currentTurnIndex]?.userId,
    });
  });
}
