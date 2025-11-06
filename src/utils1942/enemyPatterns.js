import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

export const enemyMovementPatterns = {
  // Movimiento recto - ajustado según lado de spawn
  straight: (enemy, time) => {
    const direction = enemy.moveDirection || { x: 0, y: 1 };
    let newX = enemy.x + enemy.speed * direction.x;
    let newY = enemy.y + enemy.speed * direction.y;

    // Mantener enemigos dentro del área de juego horizontalmente
    newX = Math.max(
      -enemy.width * 0.5,
      Math.min(newX, GAME_WIDTH + enemy.width * 0.5)
    );

    return {
      ...enemy,
      x: newX,
      y: newY,
    };
  },

  // Zigzag - bombarderos con ajuste direccional
  zigzag: (enemy, time) => {
    const direction = enemy.moveDirection || { x: 0, y: 1 };
    const zigzagOffset = Math.sin(time * 0.08 + enemy.phaseOffset) * 3;

    let newX = enemy.x + zigzagOffset + enemy.speed * direction.x * 0.5;
    let newY = enemy.y + enemy.speed * direction.y;

    // Mantener enemigos dentro del área de juego
    newX = Math.max(
      -enemy.width * 0.5,
      Math.min(newX, GAME_WIDTH + enemy.width * 0.5)
    );

    return {
      ...enemy,
      x: newX,
      y: newY,
    };
  },

  // Movimiento circular - aviones pesados
  circle: (enemy, time) => {
    const direction = enemy.moveDirection || { x: 0, y: 1 };

    let newCenterX = enemy.centerX + enemy.speed * direction.x * 0.3;
    let newCenterY = enemy.centerY + enemy.speed * direction.y * 0.5;

    // Mantener el centro del círculo dentro de límites razonables
    newCenterX = Math.max(
      enemy.radius,
      Math.min(newCenterX, GAME_WIDTH - enemy.radius)
    );

    let newX =
      newCenterX + Math.cos(time * 0.05 + enemy.phaseOffset) * enemy.radius;
    let newY =
      newCenterY +
      Math.sin(time * 0.05 + enemy.phaseOffset) * enemy.radius * 0.5;

    // Asegurar que la posición final esté dentro de límites
    newX = Math.max(
      -enemy.width * 0.5,
      Math.min(newX, GAME_WIDTH + enemy.width * 0.5)
    );

    return {
      ...enemy,
      x: newX,
      y: newY,
      centerY: newCenterY,
      centerX: newCenterX,
    };
  },

  // Picada hacia el jugador - interceptores
  dive: (enemy, time) => {
    const targetX = enemy.targetX || GAME_WIDTH / 2;
    const dx = targetX - enemy.x;
    const moveSpeed = Math.min(Math.abs(dx * 0.03), 4);
    const direction = enemy.moveDirection || { x: 0, y: 1 };

    let newX =
      enemy.x + Math.sign(dx) * moveSpeed + enemy.speed * direction.x * 0.3;
    let newY = enemy.y + enemy.speed * direction.y * 1.2;

    // Mantener enemigos dentro del área de juego
    newX = Math.max(
      -enemy.width * 0.5,
      Math.min(newX, GAME_WIDTH + enemy.width * 0.5)
    );

    return {
      ...enemy,
      x: newX,
      y: newY,
      targetX,
    };
  },

  // Formación roja especial
  formation: (enemy, time) => {
    let newX =
      enemy.formationX + Math.sin(time * 0.04 + enemy.phaseOffset) * 25;
    let newY = enemy.y + enemy.speed;

    // Mantener formación dentro del área
    newX = Math.max(
      -enemy.width * 0.5,
      Math.min(newX, GAME_WIDTH + enemy.width * 0.5)
    );

    return {
      ...enemy,
      x: newX,
      y: newY,
    };
  },

  // Patrulla Especial - Movimiento en zigzag amplio manteniendo formación V
  patrol: (enemy, time) => {
    let newFormationX = enemy.formationX + Math.cos(time * 0.02) * 2;
    let newX = newFormationX + Math.sin(time * 0.06 + enemy.phaseOffset) * 40;
    let newY = enemy.y + enemy.speed;

    // Mantener formación dentro del área
    newFormationX = Math.max(
      enemy.width,
      Math.min(newFormationX, GAME_WIDTH - enemy.width)
    );
    newX = Math.max(
      -enemy.width * 0.5,
      Math.min(newX, GAME_WIDTH + enemy.width * 0.5)
    );

    return {
      ...enemy,
      x: newX,
      y: newY,
      formationX: newFormationX,
    };
  },

  // Bombarderos pesados - Movimiento lento pero constante con oscilación mínima
  bomber: (enemy, time) => {
    let newFormationX = enemy.formationX + Math.sin(time * 0.01) * 5;
    let newX = newFormationX + Math.sin(time * 0.03 + enemy.phaseOffset) * 15;
    let newY = enemy.y + enemy.speed;

    // Mantener bombarderos dentro del área
    newFormationX = Math.max(
      enemy.width,
      Math.min(newFormationX, GAME_WIDTH - enemy.width)
    );
    newX = Math.max(
      -enemy.width * 0.5,
      Math.min(newX, GAME_WIDTH + enemy.width * 0.5)
    );

    return {
      ...enemy,
      x: newX,
      y: newY,
      formationX: newFormationX,
    };
  },

  // Scouts - Movimiento rápido y errático
  scout: (enemy, time) => {
    const baseMovement = Math.sin(time * 0.12 + enemy.phaseOffset) * 60;
    const erraticMovement = Math.sin(time * 0.2) * 20;

    let newFormationX =
      enemy.formationX + (time % 120 === 0 ? (Math.random() - 0.5) * 100 : 0);
    let newX = newFormationX + baseMovement + erraticMovement;
    let newY = enemy.y + enemy.speed;

    // Mantener scouts dentro del área
    newFormationX = Math.max(
      enemy.width,
      Math.min(newFormationX, GAME_WIDTH - enemy.width)
    );
    newX = Math.max(
      -enemy.width * 0.5,
      Math.min(newX, GAME_WIDTH + enemy.width * 0.5)
    );

    return {
      ...enemy,
      x: newX,
      y: newY,
      formationX: newFormationX,
    };
  },
};

export const updateEnemyMovement = (enemies, patterns) => {
  return enemies
    .map((enemy) => {
      const pattern = patterns[enemy.pattern] || patterns.straight;
      let updatedEnemy = pattern(
        { ...enemy, time: enemy.time + 1 },
        enemy.time + 1
      );

      // Actualizar tiempo y cooldown de disparo
      updatedEnemy = {
        ...updatedEnemy,
        time: enemy.time + 1,
        shootCooldown: Math.max(0, updatedEnemy.shootCooldown - 1),
      };

      // Comportamientos especiales según el tipo de formación
      if (enemy.isSpecialPatrol) {
        // Las patrullas especiales ocasionalmente hacen maniobras evasivas
        if (updatedEnemy.time % 180 === 0) {
          updatedEnemy.speed += 0.5; // Aceleración temporal
        }
        if (updatedEnemy.time % 200 === 0) {
          updatedEnemy.speed = Math.max(updatedEnemy.speed - 0.5, 1.8); // Volver a velocidad normal
        }
      }

      if (enemy.isBomberSquadron) {
        // Los bombarderos son más lentos pero más amenazantes
        if (updatedEnemy.time % 240 === 0) {
          updatedEnemy.shootCooldown = 0; // Disparo forzado cada cierto tiempo
        }
      }

      if (enemy.isScoutSquadron) {
        // Los scouts son impredecibles
        if (updatedEnemy.time % 90 === 0 && Math.random() < 0.3) {
          updatedEnemy.speed = Math.random() * 2 + 2; // Cambio de velocidad aleatorio
        }
      }

      // Aplicar límites finales para asegurar que los enemigos no salgan del área
      updatedEnemy.x = Math.max(
        -updatedEnemy.width,
        Math.min(updatedEnemy.x, GAME_WIDTH + updatedEnemy.width)
      );
      updatedEnemy.y = Math.max(-200, updatedEnemy.y); // Permitir spawn desde arriba

      return updatedEnemy;
    })
    .filter(
      (enemy) => enemy.y < GAME_HEIGHT + 100 && enemy.y > -200 // Filtrar enemigos que se van muy lejos
    );
};
