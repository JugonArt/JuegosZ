import {
  GAME_WIDTH,
  GAME_HEIGHT,
  ENEMY_TYPES,
  FORMATION_CONFIG,
  MAX_ENEMIES_ON_SCREEN,
} from "./constants.js";

// Puntos de spawn solo en la parte superior
export const ENEMY_SPAWN_POINTS = [
  { x: 50, y: -50, side: "top" },
  { x: 200, y: -50, side: "top" },
  { x: 400, y: -50, side: "top" },
  { x: 600, y: -50, side: "top" },
  { x: 800, y: -50, side: "top" },
  { x: 1000, y: -50, side: "top" },
  { x: 1200, y: -50, side: "top" },
  { x: 1400, y: -50, side: "top" },
];

export const spawnEnemy = (level = 1) => {
  // Elegir un tipo base aleatorio
  const baseIndex = Math.floor(Math.random() * ENEMY_TYPES.length);
  const type = ENEMY_TYPES[baseIndex];

  // Seleccionar punto de spawn aleatorio
  const spawnPoint =
    ENEMY_SPAWN_POINTS[Math.floor(Math.random() * ENEMY_SPAWN_POINTS.length)];

  // Escalar velocidad y cadencia según nivel (dificultad gradual)
  const speed = Math.max(type.speed + level * 0.06, 0.6);
  const baseCooldown = Math.max(30 - level * 2, 8);

  // Determinar vida base según el tipo y nivel
  let baseHealth = 1;
  if (type.pattern === "circle" || type.pattern === "zigzag") {
    baseHealth = 2; // Patrones más complejos tienen más vida
  } else if (type.speed <= 1.5) {
    baseHealth = level > 5 ? 3 : 2; // Enemigos lentos más resistentes
  }

  const enemy = {
    id: Math.random(),
    x: spawnPoint.x,
    y: spawnPoint.y,
    spawnSide: spawnPoint.side,
    ...type,
    speed,
    maxHealth: baseHealth,
    health: baseHealth,
    phaseOffset: Math.random() * Math.PI * 2,
    shootCooldown: Math.floor(Math.random() * baseCooldown) + baseCooldown,
    time: 0,
  };

  // REMOVIDO: Ya no ajustamos posiciones fuera del área
  // Los enemigos aparecerán donde están definidos en ENEMY_SPAWN_POINTS

  // Propiedades específicas del patrón
  if (type.pattern === "circle") {
    enemy.centerX = GAME_WIDTH / 2;
    enemy.centerY = enemy.y;
    enemy.radius = 50 + Math.random() * 30;
  }

  if (type.pattern === "dive") {
    enemy.targetX = Math.random() * GAME_WIDTH;
  }

  // Ajustar patrón de movimiento según lado de spawn
  enemy.moveDirection = getMovementDirection(spawnPoint.side);

  // --- Ajustes de vida según reglas solicitadas ---
  // Asumimos: types más rápidos o "scout" son enemigos ligeros (1 vida)
  if (enemy.pattern === "scout" || enemy.speed >= 2.5) {
    enemy.maxHealth = 1;
    enemy.health = 1;
    return enemy;
  }

  // Si viene en formación grande o por patrones (formaciones especiales) -> 2 de vida
  if (type.pattern === "formation" || type.pattern === "patrol" || type.pattern === "bomber") {
    enemy.maxHealth = 2;
    enemy.health = 2;
    return enemy;
  }

  // Resto: asignar 2 o 3 de vida según nivel (más vida en niveles altos)
  const health = level > 6 ? 3 : 2;
  enemy.maxHealth = health;
  enemy.health = health;

  return enemy;
};

// Determinar dirección de movimiento (ahora solo desde arriba con ligeras variaciones)
const getMovementDirection = (side) => {
  // Ligera variación horizontal aleatoria
  const xVariation = (Math.random() - 0.5) * 0.3; // Entre -0.15 y 0.15
  return {
    x: xVariation,
    y: 1 // Siempre hacia abajo
  };
};

// Formación Roja - 5 naves con borde dorado, 6 vidas fijas
export const spawnRedFormation = (level = 1) => {
  const formation = [];
  const centerX = Math.random() * (GAME_WIDTH - 400) + 200; // Más centrado
  const formationId = Math.random();
  const config = FORMATION_CONFIG.red_squadron;

  for (let i = 0; i < config.count; i++) {
    formation.push({
      id: Math.random(),
      x: centerX + (i - 2) * config.spacing,
      y: -50 - i * 30,
      formationX: centerX + (i - 2) * config.spacing,
      width: 30,
      height: 30,
      speed: 1.5,
      health: 6,
      maxHealth: 6,
      points: config.points,
      color: config.color,
      pattern: config.pattern,
      phaseOffset: i * 0.5,
      shootCooldown: Math.random() * 60 + 30,
      time: 0,
      formationId,
      isRedFormation: true,
      hasBorder: true,
      borderColor: "gold",
      level: level,
    });
  }

  return formation;
};

// Patrulla Especial - 5 naves naranjas en formación V, 8 vidas fijas
export const spawnSpecialPatrol = (level = 1) => {
  const formation = [];
  const centerX = Math.random() * (GAME_WIDTH - 600) + 300; // Más centrado
  const formationId = Math.random();
  const config = FORMATION_CONFIG.special_patrol;

  for (let i = 0; i < config.count; i++) {
    const offsetX = (i - 2) * config.spacing;
    const offsetY = Math.abs(i - 2) * 25;

    formation.push({
      id: Math.random(),
      x: centerX + offsetX,
      y: -50 - offsetY,
      formationX: centerX + offsetX,
      formationY: -50 - offsetY,
      width: 28,
      height: 28,
  speed: Math.max(1.8 + level * 0.06, 1.2),
  health: Math.max(config.health - Math.floor(level / 2), 2),
  maxHealth: Math.max(config.health - Math.floor(level / 2), 2),
      points: config.points,
      color: config.color,
      pattern: config.pattern,
      phaseOffset: i * 0.3,
      shootCooldown: Math.random() * 40 + 20,
      time: 0,
      formationId,
      isSpecialPatrol: true,
      level: level,
    });
  }

  return formation;
};

// Escuadrón Bombardero - 4 naves pesadas verdes, 10 vidas fijas
export const spawnBomberSquadron = (level = 1) => {
  const formation = [];
  const centerX = Math.random() * (GAME_WIDTH - 560) + 280; // Más centrado
  const formationId = Math.random();
  const config = FORMATION_CONFIG.bomber_squadron;

  for (let i = 0; i < config.count; i++) {
    formation.push({
      id: Math.random(),
      x: centerX + (i - 1.5) * config.spacing,
      y: -80 - i * 35,
      formationX: centerX + (i - 1.5) * config.spacing,
      width: 45,
      height: 45,
  speed: Math.max(1.2 + level * 0.04, 0.8),
  health: Math.max(config.health - Math.floor(level / 3), 3),
  maxHealth: Math.max(config.health - Math.floor(level / 3), 3),
      points: config.points,
      color: config.color,
      pattern: config.pattern,
      phaseOffset: i * 0.4,
      shootCooldown: Math.random() * 30 + 15,
      time: 0,
      formationId,
      isBomberSquadron: true,
      name: "super_bomber",
      level: level,
    });
  }

  return formation;
};

// Escuadrón Scout - 3 naves amarillas rápidas (1 vida como enemigos normales)
export const spawnScoutSquadron = (level = 1) => {
  const formation = [];
  const centerX = Math.random() * (GAME_WIDTH - 300) + 150; // Más centrado
  const formationId = Math.random();

  for (let i = 0; i < 3; i++) {
    formation.push({
      id: Math.random(),
      x: centerX + (i - 1) * 75,
      y: -40 - i * 20,
      formationX: centerX + (i - 1) * 75,
      width: 25,
      height: 25,
  speed: Math.max(3 + level * 0.08, 2.5),
  health: 1,
  maxHealth: 1,
      points: 250,
      color: "yellow",
      pattern: "scout",
      phaseOffset: i * 0.6,
      shootCooldown: Math.random() * 50 + 25,
      time: 0,
      formationId,
      isScoutSquadron: true,
      name: "scout",
      level: level,
    });
  }

  return formation;
};

// Mini-jefe: aparece solo, 10 puntos de vida
export const spawnMiniBoss = (level = 1) => {
  return [
    {
      id: Math.random(),
      x: GAME_WIDTH / 2 - 60,
      y: -120,
      width: 120,
      height: 120,
      speed: Math.max(0.8 + level * 0.05, 0.8),
      health: 10,
      maxHealth: 10,
      points: 2000,
      color: "black",
      pattern: "bomber",
      phaseOffset: 0,
      shootCooldown: Math.max(50 - level * 2, 20),
      time: 0,
      isMiniBoss: true,
    },
  ];
};