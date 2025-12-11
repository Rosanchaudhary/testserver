export function parsePlayers(data) {
  const result = {};

  data.forEach((player) => {
    result[player.user._id.toString()] = {
      userId: player.user._id.toString(),
      name: player.user.name,
      center: player.center,
      throw: player.throw,
      hand: player.hand,
      count: player.hand.length,
      ready:player.ready
    };
  });

  return result;
}
