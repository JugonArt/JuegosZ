export const checkCollision = (rect1, rect2) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

export const handleBulletEnemyCollisions = (bullets, enemies) => {
  const destroyedEnemies = [];
  const hitEnemies = new Set();
  const destroyedFormations = new Set();

  let updatedEnemies = [...enemies];

  const remainingBullets = bullets.filter((bullet) => {
    let bulletSurvived = true;

    // Check collision with each enemy until we find the first hit
    for (const enemy of updatedEnemies) {
      if (checkCollision(bullet, enemy)) {
        bulletSurvived = false; // Destroy bullet on first hit
        const newHealth = enemy.health - 1;
        
        // Update enemy array
        const index = updatedEnemies.indexOf(enemy);
        if (newHealth <= 0) {
          destroyedEnemies.push(enemy);
          hitEnemies.add(enemy.id);
          updatedEnemies.splice(index, 1);
        } else {
          updatedEnemies[index] = { ...enemy, health: newHealth };
        }
        
        // Exit loop after first hit
        break;
      }
    }

    return bulletSurvived;
  });

  destroyedEnemies.forEach((enemy) => {
    if (enemy.isRedFormation) {
      destroyedFormations.add(enemy.formationId);
    }
  });

  return {
    remainingBullets,
    updatedEnemies,
    destroyedEnemies,
    destroyedFormations: Array.from(destroyedFormations),
  };
};

export const handlePlayerEnemyCollisions = (
  player1,
  player2,
  enemies,
  onPlayerHit
) => {
  // Colisiones para el Jugador 1
  if (player1.lives > 0) {
    enemies.forEach((enemy) => {
      if (checkCollision(player1, enemy)) {
        onPlayerHit(1); // Notifica el golpe al Jugador 1
      }
    });
  }

  // Colisiones para el Jugador 2
  if (player2.lives > 0) {
    enemies.forEach((enemy) => {
      if (checkCollision(player2, enemy)) {
        onPlayerHit(2); // Notifica el golpe al Jugador 2
      }
    });
  }
};
