// utils/twocard/startGame.js
import CardGameRoom from "../../models/CardGameRoom.js";
import { parsePlayers } from "./parsePlayers.js";

// -------------------------------
// Card Sorting Helpers
// -------------------------------
const suitOrder = { S: 4, H: 3, D: 2, C: 1 };
const rankOrder = {
  A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6,
  "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13
};

function parseCard(card) {
  const match = card.match(/^(\d+|[A-Z])([SHDC])$/);
  return { rank: match[1], suit: match[2] };
}

function sortCards(cards) {
  return cards.sort((a, b) => {
    const A = parseCard(a);
    const B = parseCard(b);

    // Sort by suit descending: S > H > D > C
    if (A.suit !== B.suit) {
      return suitOrder[B.suit] - suitOrder[A.suit];
    }

    // Sort by rank descending: K > Q > J > ... > 2 > A
    return rankOrder[B.rank] - rankOrder[A.rank];
  });
}

// -------------------------------
// Start Game Function
// -------------------------------
export async function startGame(io, room) {
  // 1. Build deck
  const suits = ["S", "H", "D", "C"];
  const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

  let deck = [];
  suits.forEach(s => ranks.forEach(r => deck.push(r + s)));

  // 2. Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // 3. Split deck evenly across players
  const totalPlayers = room.players.length;
  const cardsPerPlayer = Math.floor(deck.length / totalPlayers);

  const updates = [];
  let index = 0;

  for (let i = 0; i < totalPlayers; i++) {
    const playerId = room.players[i].user._id.toString();
    
    // Take slice
    const hand = deck.slice(index, index + cardsPerPlayer);
    index += cardsPerPlayer;

    // 🔥 Sort before saving
    const sortedHand = sortCards(hand);

    updates.push({
      updateOne: {
        filter: { roomId: room.roomId, "players.user": playerId },
        update: {
          $set: {
            "players.$.hand": sortedHand,
            status: "in-progress",
            turn: room.players[0].user._id.toString(), // first player's turn
          }
        }
      }
    });
  }

  // 4. Save atomically
  await CardGameRoom.bulkWrite(updates);

  // 5. Reload updated room with populated names
  const updatedRoom = await CardGameRoom.findOne({ roomId: room.roomId })
    .populate("players.user", "name");

  const playerState = parsePlayers(updatedRoom.players);

  // 6. Broadcast full player state
  io.to(room.roomId).emit("player-update", {
    playerState,
    turn: updatedRoom.turn,
  });

  // 7. Send each player their private hand
  updatedRoom.players.forEach(player => {
    io.to(player.socketId).emit("your-hand", player.hand);
  });
}
