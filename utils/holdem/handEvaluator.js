const RANK_VALUES = {
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

export function evaluateHand(cards) {
  const ranks = cards.map((c) => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  const rankCount = count(ranks);
  const suitCount = count(suits);

  const flushSuit = Object.keys(suitCount).find((s) => suitCount[s] >= 5);
  const straightHigh = getStraightHigh(ranks);

  if (flushSuit) {
    const flushRanks = cards
      .filter((c) => c.suit === flushSuit)
      .map((c) => RANK_VALUES[c.rank])
      .sort((a, b) => b - a);

    const sfHigh = getStraightHigh(flushRanks);
    if (sfHigh) return score(9, [sfHigh]);
  }

  const four = find(rankCount, 4);
  if (four)
    return score(8, [four, ...ranks.filter((r) => r !== four).slice(0, 1)]);

  // ✅ FIXED FULL HOUSE (double trips)
  const trips = Object.keys(rankCount)
    .filter((r) => rankCount[r] >= 3)
    .map(Number)
    .sort((a, b) => b - a);

  if (trips.length >= 2) return score(7, [trips[0], trips[1]]);

  const three = trips[0];
  const pair = find(rankCount, 2);
  if (three && pair) return score(7, [three, pair]);

  if (flushSuit) {
    const fr = cards
      .filter((c) => c.suit === flushSuit)
      .map((c) => RANK_VALUES[c.rank])
      .sort((a, b) => b - a)
      .slice(0, 5);
    return score(6, fr);
  }

  if (straightHigh) return score(5, [straightHigh]);

  if (three)
    return score(4, [three, ...ranks.filter((r) => r !== three).slice(0, 2)]);

  const pairs = Object.keys(rankCount)
    .filter((r) => rankCount[r] === 2)
    .map(Number)
    .sort((a, b) => b - a);

  if (pairs.length >= 2)
    return score(3, [
      pairs[0],
      pairs[1],
      ...ranks.filter((r) => !pairs.includes(r)).slice(0, 1),
    ]);

  if (pair)
    return score(2, [pair, ...ranks.filter((r) => r !== pair).slice(0, 3)]);

  return score(1, ranks.slice(0, 5));
}

function count(arr) {
  return arr.reduce((m, v) => ((m[v] = (m[v] || 0) + 1), m), {});
}
function find(obj, n) {
  return Number(Object.keys(obj).find((k) => obj[k] === n)) || null;
}
function getStraightHigh(ranks) {
  const u = [...new Set(ranks)];
  if (u.includes(14)) u.push(1);
  u.sort((a, b) => b - a);
  for (let i = 0; i <= u.length - 5; i++)
    if (u[i] - u[i + 4] === 4) return u[i];
  return null;
}
function score(rank, kickers) {
  return { rank, kickers };
}
