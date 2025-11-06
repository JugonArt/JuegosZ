export const createPlayerBullets = (player, playerId) => {
  const now = Date.now();
  if (now - player.lastShot < 150) return [];

  const bullets = [];
  const centerX = player.x + player.width / 2;

  // Disparos principales según modo
  switch (player.fireMode) {
    case "single":
      bullets.push(createBullet(centerX - 2, player.y, playerId, now));
      break;

    case "double":
      bullets.push(
        createBullet(centerX - 8, player.y, playerId, now),
        createBullet(centerX + 4, player.y, playerId, now)
      );
      break;

    case "triple":
      bullets.push(
        createBullet(centerX - 2, player.y, playerId, now),
        createBullet(centerX - 10, player.y, playerId, now),
        createBullet(centerX + 6, player.y, playerId, now)
      );
      break;
  }

  // Disparos de wingmen
  player.wingmen.forEach((wingman) => {
    bullets.push(
      createBullet(wingman.x + 15 - 2, wingman.y, playerId, now, true)
    );
  });

  return bullets;
};

const createBullet = (x, y, playerId, created, isWingman = false) => ({
  id: Math.random(),
  x,
  y,
  width: 4,
  height: isWingman ? 8 : 10,
  playerId,
  created,
});

export const updateBullets = (bullets, speed) => {
  return bullets
    .map((bullet) => ({
      ...bullet,
      y: bullet.y - speed,
    }))
    .filter((bullet) => bullet.y > -10);
};

export const updateEnemyBullets = (bullets, speed) => {
  return bullets
    .map((bullet) => ({
      ...bullet,
      y: bullet.y + speed,
    }))
    .filter((bullet) => bullet.y < 610);
};
