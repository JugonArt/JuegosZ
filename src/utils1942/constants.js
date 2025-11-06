export const GAME_WIDTH = 1500;
export const GAME_HEIGHT = 700;
export const BULLET_SPEED = 8;
export const ENEMY_BULLET_SPEED = 4;

// Límites y configuración de oleadas
export const MAX_ENEMIES_ON_SCREEN = 35;
export const MIN_WAVES_PER_LEVEL = 5;
export const MAX_WAVES_PER_LEVEL = 8;
export const MIN_ENEMIES_PER_WAVE = 4;
export const MAX_ENEMIES_PER_WAVE = 12;

export const INITIAL_PLAYER_STATE = {
  x: 500,
  y: 600,
  width: 40,
  height: 40,
  speed: 5,
  isLooping: false,
  loopCount: 3,
  lives: 3,
  fireMode: "single",
  wingmen: [],
  lastShot: 0,
};

// Todos los enemigos normales tienen 1 vida
export const ENEMY_TYPES = [
  {
    width: 25,
    height: 25,
    speed: 2,
    health: 1,
    points: 100,
    color: "gray",
    pattern: "straight",
  },
  {
    width: 30,
    height: 30,
    speed: 1.8,
    health: 1,
    points: 150,
    color: "blue",
    pattern: "zigzag",
  },
  {
    width: 35,
    height: 35,
    speed: 1.2,
    health: 1,
    points: 200,
    color: "green",
    pattern: "circle",
  },
  {
    width: 40,
    height: 40,
    speed: 1.5,
    health: 1,
    points: 250,
    color: "purple",
    pattern: "dive",
  },
];

export const POWER_UP_TYPES = [
  "double",
  "triple",
  "wingman",
  "loops",
  "revive",
];

// Configuración de formaciones especiales con vidas actualizadas
export const FORMATION_CONFIG = {
  red_squadron: {
    count: 5,
    spacing: 50,
    color: "red",
    points: 200,
    health: 6, // ACTUALIZADO: 6 vidas (antes era 2)
    pattern: "formation",
    powerUpChance: 10,
  },
  special_patrol: {
    count: 5,
    spacing: 60,
    color: "orange",
    points: 250,
    health: 8, // ACTUALIZADO: 8 vidas (antes era 3)
    pattern: "patrol",
    powerUpChance: 0.8,
  },
  bomber_squadron: {
    count: 4,
    spacing: 70,
    color: "darkgreen",
    points: 400,
    health: 10, // ACTUALIZADO: 10 vidas (antes era 4)
    pattern: "bomber",
    powerUpChance: 1.0,
  },
};

// Puntos de spawn para enemigos pequeños (como en 1942 original)
export const ENEMY_SPAWN_POINTS = [
  // Parte superior - izquierda a derecha
  { x: 50, y: -50, side: "top-left" },
  { x: 200, y: -50, side: "top" },
  { x: 400, y: -50, side: "top" },
  { x: 600, y: -50, side: "top" },
  { x: 800, y: -50, side: "top" },
  { x: 950, y: -50, side: "top-right" },

  // Laterales
  { x: -50, y: 100, side: "left" },
  { x: -50, y: 200, side: "left" },
  { x: -50, y: 300, side: "left" },
  { x: GAME_WIDTH + 50, y: 100, side: "right" },
  { x: GAME_WIDTH + 50, y: 200, side: "right" },
  { x: GAME_WIDTH + 50, y: 300, side: "right" },
];

// Configuración de wingmen - cada wingman tiene 2 vidas
export const WINGMAN_CONFIG = {
  health: 2,
  width: 30,
  height: 30,
  maxWingmen: 4,
  offsetX: 60,
  offsetY: 30,
};
