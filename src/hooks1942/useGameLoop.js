"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  POWER_UP_TYPES,
  INITIAL_PLAYER_STATE,
} from "../utils1942/constants.js";
import {
  MAX_ENEMIES_ON_SCREEN,
  MIN_WAVES_PER_LEVEL,
  MAX_WAVES_PER_LEVEL,
  MIN_ENEMIES_PER_WAVE,
  MAX_ENEMIES_PER_WAVE,
} from "../utils1942/constants.js";
import { checkCollision } from '../utils1942/collisions.js';
import {
  enemyMovementPatterns,
  updateEnemyMovement,
} from "../utils1942/enemyPatterns.js";
import {
  createPlayerBullets,
  updateBullets,
  updateEnemyBullets,
} from "../utils1942/bulletSystem.js";
import {
  spawnEnemy,
  spawnRedFormation,
  spawnSpecialPatrol,
  spawnBomberSquadron,
  spawnScoutSquadron,
} from "../utils1942/enemySpawning.js";

import { spawnMiniBoss } from "../utils1942/enemySpawning.js";

const useGameLoop = (gameState, gameMode, keys, gameHandlers) => {
  const [player1Trail, setPlayer1Trail] = useState(() => {
    const initialPoints = [];
    const trailLength = 15;
    for (let i = 0; i < trailLength; i++) {
      initialPoints.push({
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT + 50,
  });
    }
    return initialPoints;
  });
  const [explosions, setExplosions] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [enemyBullets, setEnemyBullets] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [bgOffset, setBgOffset] = useState(0);
  const [enemiesKilled, setEnemiesKilled] = useState(0);


  // NUEVO: Flag para controlar cuándo resetear realmente
  const [gameSession, setGameSession] = useState(null);

  const {
    player1,
    setPlayer1,
    player2,
    setPlayer2,
    setScore,
    setScore2,
    level,
    setLevel,
    setGameState,
    playSound,
  } = gameHandlers;

  const gameLoopRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const lastRedFormationRef = useRef(0);
  const lastSpawnTimeRef = useRef(0); // Add this if it's not there, assuming it controls spawn frequency.
  const redFormationIndexRef = useRef(0); // Controls Red Formation progression
  const lastSpecialPatrolRef = useRef(0);
  const lastBomberSquadronRef = useRef(0);
  const lastScoutSquadronRef = useRef(0);
  const lastShotP1Ref = useRef(0);
  const lastShotP2Ref = useRef(0);
  const frameRef = useRef(0);
  const lastExplosionSoundRef = useRef(0);

  // Refs para control de oleadas (waves)
  const currentWaveRef = useRef(1);
  const wavesThisLevelRef = useRef(MIN_WAVES_PER_LEVEL);
  const enemiesRemainingInWaveRef = useRef(0);
  const lastWaveTimeRef = useRef(0);

const createExplosion = useCallback((x, y, enemy = null) => {
  // Asegurar que la explosión esté dentro del área visible
  const clampedX = Math.max(0, Math.min(x, GAME_WIDTH));
  const clampedY = Math.max(0, Math.min(y, GAME_HEIGHT));
  
  let explosionType = "medium";
  if (enemy) {
    if (enemy.isBomberSquadron) {
      explosionType = "large";
    } else if (enemy.maxHealth > 3) {
      explosionType = "large";
    } else if (enemy.maxHealth > 1) {
      explosionType = "medium";
    } else {
      explosionType = "small";
    }
  }
  
  const newExplosion = {
    id: `explosion_${Date.now()}_${Math.random()}`,
    x: clampedX,
    y: clampedY,
    type: explosionType,
    createdAt: Date.now(),
  };
  
  console.log(`Creating explosion at: ${clampedX}, ${clampedY}, type: ${explosionType}`); // Debug
  
  setExplosions((currentExplosions) => [...currentExplosions, newExplosion]);
  
  const duration = explosionType === "large" ? 1200 : explosionType === "small" ? 800 : 1000;
  setTimeout(() => {
    setExplosions((currentExplosions) =>
      currentExplosions.filter(
        (explosion) => explosion.id !== newExplosion.id
      )
    );
  }, duration);
}, []);

  const calculateLevel = useCallback((killed) => {
    return Math.floor(killed / 15) + 1;
  }, []);

  const getSpawnInterval = useCallback((currentLevel) => {
    const baseInterval = 2000;
    const reduction = Math.min(currentLevel * 150, 1500);
    return Math.max(baseInterval - reduction, 500);
  }, []);

    const resetLoopState = useCallback(() => {
    // 1. Resetear objetos del juego
    setEnemies([]);
    setBullets([]);
    setEnemyBullets([]);
    setPowerUps([]);
    setExplosions([]);

    // 2. Resetear estados de spawn/tiempo
    lastSpawnTimeRef.current = 0;
    redFormationIndexRef.current = 0;
    // Asumiendo que hay un ref para contar enemigos eliminados que podría ser necesario resetear
    // Si enemiesKilled es un valor de estado o una prop, se debe resetear en Game1942.jsx.
    // Si es un ref dentro de useGameLoop (e.g., enemiesKilledRef), lo reseteamos aquí.
    
  // Si enemiesKilled se está gestionando internamente en el loop:
  // Forzar la actualización del score si es necesario.
  if (typeof setScore === 'function') setScore(0);
    // Si enemiesKilled existe:
    // enemiesKilledRef.current = 0; 
    
    // Y lo más importante: establecer un nuevo gameSession para que la lógica de tiempo/inicio
    // se re-ejecute en el próximo frame.
    // En Game1942.jsx, el reinicio de los estados del jugador y el `setGameState("playing")`
    // ya manejarán la re-ejecución del useEffect inicial.
    
  }, [setEnemies, setBullets, setEnemyBullets, setPowerUps, setExplosions]); 

  const applyPowerUp = useCallback(
    (player, type) => {
      switch (type) {
        case "double":
          return { ...player, fireMode: "double" };
        case "triple":
          return { ...player, fireMode: "triple" };
        case "wingman":
          if (player.wingmen.length > 0) {
            return player;
          }
          playSound("wingman");
          setTimeout(() => {
            playSound("wingmanlaugh");
          }, 700);
          return {
            ...player,
            wingmen: [
              ...player.wingmen,
              {
                x: player.x - 60,
                y: player.y + 10,
                width: 30,
                height: 30,
                health: 2,
                maxHealth: 2,
              },
            ],
          };
        case "loops":
          return { ...player, loopCount: Math.min(player.loopCount + 3, 9) };
        case "revive":
          // El power-up de revivir se maneja de forma especial en las colisiones
          // No modifica al jugador que lo recoge directamente
          return player;
        default:
          return player;
      }
    },
    [playSound]
  );

  // NUEVO: Added revivePlayer function to handle player revival
  const revivePlayer = useCallback(
    (playerId) => {
      if (playerId === 1) {
        setPlayer1((prevPlayer) => {
          if (prevPlayer.lives > 0) return prevPlayer; // Ya está vivo
          playSound("powerUp");
          return {
            ...prevPlayer,
            lives: 1,
            x: 500,
            y: 600,
            isLooping: true, // Invencibilidad temporal al revivir
            fireMode: "single",
            wingmen: [],
          };
        });
        // Quitar invencibilidad después de 3 segundos
        setTimeout(() => {
          setPlayer1((p) => ({ ...p, isLooping: false }));
        }, 3000);
      } else if (playerId === 2) {
        setPlayer2((prevPlayer) => {
          if (prevPlayer.lives > 0) return prevPlayer; // Ya está vivo
          playSound("powerUp");
          return {
            ...prevPlayer,
            lives: 1,
            x: 450,
            y: 600,
            isLooping: true, // Invencibilidad temporal al revivir
            fireMode: "single",
            wingmen: [],
          };
        });
        // Quitar invencibilidad después de 3 segundos
        setTimeout(() => {
          setPlayer2((p) => ({ ...p, isLooping: false }));
        }, 3000);
      }
    },
    [playSound, setPlayer1, setPlayer2]
  );

  // NUEVO: Added spawnRevivePowerUp function to spawn revive power-up when a player dies
  const spawnRevivePowerUp = useCallback(() => {
    if (gameMode !== "two-player") return; // Solo en modo dos jugadores

    // Verificar si al menos un jugador está muerto
    const player1Dead = player1.lives <= 0;
    const player2Dead = player2.lives <= 0;

    if (player1Dead || player2Dead) {
      // Solo generar si no hay ya un power-up de revivir activo
      setPowerUps((currentPowerUps) => {
        const hasRevive = currentPowerUps.some((p) => p.type === "revive");
        if (hasRevive) return currentPowerUps;

        return [
          ...currentPowerUps,
          {
            id: Math.random(),
            x: Math.random() * (GAME_WIDTH - 40) + 20,
            y: -40,
            width: 40,
            height: 40,
            type: "revive",
            speed: 1.5, // Más lento para que sea más fácil de agarrar
          },
        ];
      });
    }
  }, [gameMode, player1.lives, player2.lives]);

  const handlePlayerDamage = useCallback(
    (playerId) => {
      if (playerId === 1) {
        setPlayer1((prevPlayer) => {
          if (prevPlayer.isLooping || prevPlayer.lives <= 0) return prevPlayer;
          const newLives = prevPlayer.lives - 1;
          playSound("playerHit");
          createExplosion(
            prevPlayer.x + prevPlayer.width / 2,
            prevPlayer.y + prevPlayer.height / 2
          );
          if (newLives <= 0) {
            if (gameMode === "two-player") {
              // NUEVO: Generate revive power-up after player dies
              setTimeout(() => {
                spawnRevivePowerUp();
              }, 2000);

              // Verificar si el otro jugador también está muerto
              setTimeout(() => {
                setPlayer2((p2) => {
                  if (p2.lives <= 0) {
                    setGameState("gameOver");
                  }
                  return p2;
                });
              }, 100);
            } else {
              setGameState("gameOver");
            }
            return { ...prevPlayer, lives: 0 };
          }
          setTimeout(() => {
            setPlayer1((p) => ({ ...p, isLooping: false }));
          }, 2000);
          return {
            ...prevPlayer,
            lives: newLives,
            isLooping: true,
            x: 500,
            y: 600,
          };
        });
      } else if (playerId === 2 && gameMode === "two-player") {
        setPlayer2((prevPlayer) => {
          if (prevPlayer.isLooping || prevPlayer.lives <= 0) return prevPlayer;
          const newLives = prevPlayer.lives - 1;
          playSound("playerHit");
          createExplosion(
            prevPlayer.x + prevPlayer.width / 2,
            prevPlayer.y + prevPlayer.height / 2
          );
          if (newLives <= 0) {
            // NUEVO: Generate revive power-up after player dies
            setTimeout(() => {
              spawnRevivePowerUp();
            }, 2000);

            // Verificar si el otro jugador también está muerto
            setTimeout(() => {
              setPlayer1((p1) => {
                if (p1.lives <= 0) {
                  setGameState("gameOver");
                }
                return p1;
              });
            }, 100);
            return { ...prevPlayer, lives: 0 };
          }
          setTimeout(() => {
            setPlayer2((p) => ({ ...p, isLooping: false }));
          }, 2000);
          return {
            ...prevPlayer,
            lives: newLives,
            isLooping: true,
            x: 450,
            y: 600,
          };
        });
      }
    },
    [
      gameMode,
      setGameState,
      setPlayer1,
      setPlayer2,
      createExplosion,
      playSound,
      spawnRevivePowerUp,
    ]
  );

  // Función mejorada para actualizar posiciones de wingmen
  const updateWingmenPositions = useCallback((player, setCurrentPlayer) => {
    setCurrentPlayer((currentPlayer) => {
      if (!currentPlayer.wingmen || currentPlayer.wingmen.length === 0)
        return currentPlayer;

      const updatedWingmen = currentPlayer.wingmen.map((wingman, index) => ({
        ...wingman,
        x: currentPlayer.x - 60,
        y: currentPlayer.y + 10,
      }));

      return {
        ...currentPlayer,
        wingmen: updatedWingmen,
      };
    });
  }, []);

  const handleWingmenCollisions = useCallback(
    (currentPlayer, setCurrentPlayer) => {
      setCurrentPlayer((player) => {
        if (!player.wingmen || player.wingmen.length === 0) return player;
        let updatedWingmen = [...player.wingmen];

        setEnemies((currentEnemies) => {
          currentEnemies.forEach((enemy) => {
            updatedWingmen.forEach((wingman, wingmanIndex) => {
              if (
                wingman &&
                wingman.health > 0 &&
                checkCollision(wingman, enemy)
              ) {
                updatedWingmen[wingmanIndex] = {
                  ...wingman,
                  health: wingman.health - 1,
                };
              }
            });
            });
            return currentEnemies;
        });

        setEnemyBullets((currentBullets) => {
          return currentBullets.filter((bullet) => {
            let bulletHit = false;
            updatedWingmen.forEach((wingman, wingmanIndex) => {
              if (
                !bulletHit &&
                wingman &&
                wingman.health > 0 &&
                checkCollision(wingman, bullet)
              ) {
                updatedWingmen[wingmanIndex] = {
                  ...wingman,
                  health: wingman.health - 1,
                };
                bulletHit = true;
              }
            });
            return !bulletHit;
          });
        });

        updatedWingmen = updatedWingmen.filter(
          (wingman) => wingman && wingman.health > 0
        );
        return {
          ...player,
          wingmen: updatedWingmen,
        };
      });
    },
    [setEnemies, setEnemyBullets]
  );

  const handleShooting = useCallback(
    (keys, gameMode, now) => {
      // Player 1 dispara con Q (solo si está vivo)
      if (keys["KeyQ"]) {
        const timeSinceLastShot = now - lastShotP1Ref.current;
        if (timeSinceLastShot >= 120) {
          setPlayer1((currentPlayer1) => {
            if (currentPlayer1.lives <= 0) return currentPlayer1; // No disparar si está muerto
            const newBullets1 = createPlayerBullets(currentPlayer1, 1);
            if (newBullets1.length > 0) {
              setBullets((currentBullets) => [
                ...currentBullets,
                ...newBullets1,
              ]);
              lastShotP1Ref.current = now;
              playSound("playerShot");
              return { ...currentPlayer1, lastShot: now };
            }
            return currentPlayer1;
          });
        }
      }

      // Player 2 dispara con Espacio (solo si está vivo)
      if (gameMode === "two-player" && keys["Space"]) {
        const timeSinceLastShot = now - lastShotP2Ref.current;
        if (timeSinceLastShot >= 120) {
          setPlayer2((currentPlayer2) => {
            if (currentPlayer2.lives <= 0) return currentPlayer2; // No disparar si está muerto
            const newBullets2 = createPlayerBullets(currentPlayer2, 2);
            if (newBullets2.length > 0) {
              setBullets((currentBullets) => [
                ...currentBullets,
                ...newBullets2,
              ]);
              lastShotP2Ref.current = now;
              playSound("playerShot");
              return { ...currentPlayer2, lastShot: now };
            }
            return currentPlayer2;
          });
        }
      }
    },
    [gameMode, setPlayer1, setPlayer2, setBullets, playSound]
  );

  const handleEnemySpawning = useCallback(
    (now, enemiesKilled) => {
      // Debug: trace spawning calls
      try { console.debug('[useGameLoop] handleEnemySpawning called at', now, 'enemiesKilled=', enemiesKilled); } catch (e) {}
      const currentLevel = calculateLevel(enemiesKilled);

      // Recalcular número de oleadas por nivel (crece con el nivel hasta el máximo)
      wavesThisLevelRef.current = Math.min(
        MAX_WAVES_PER_LEVEL,
        Math.max(
          MIN_WAVES_PER_LEVEL,
          MIN_WAVES_PER_LEVEL + Math.floor((currentLevel - 1) / 2)
        )
      );

      // Inicializar la primera oleada si es necesario
      if (!lastWaveTimeRef.current) {
        currentWaveRef.current = 1;
        enemiesRemainingInWaveRef.current =
          MIN_ENEMIES_PER_WAVE + Math.floor(Math.random() * 3); // 4-6 base
        lastWaveTimeRef.current = now;
      }

      // Evitar spawn si ya hay muchos enemigos en pantalla
      // (mejora de rendimiento: límite máximo)
      setEnemies((currentEnemies) => {
        const onScreen = currentEnemies.length;
        if (onScreen >= MAX_ENEMIES_ON_SCREEN) return currentEnemies;

        // Si quedan enemigos por generar en la oleada, generar un pequeño lote
        if (enemiesRemainingInWaveRef.current > 0) {
          const availableSlots = MAX_ENEMIES_ON_SCREEN - onScreen;
          const toSpawn = Math.min(
            enemiesRemainingInWaveRef.current,
            Math.max(1, Math.min(3, Math.floor(availableSlots / 3)))
          );

          const newEnemies = [];
          for (let i = 0; i < toSpawn; i++) {
            // Pequeña probabilidad de que la oleada sea mini-jefe (aparece solo)
            if (
              enemiesRemainingInWaveRef.current === 1 &&
              Math.random() < 0.05 &&
              onScreen < 3
            ) {
              newEnemies.push(...spawnMiniBoss(currentLevel));
              enemiesRemainingInWaveRef.current = 0;
              break;
            }

            newEnemies.push(spawnEnemy(currentLevel));
            enemiesRemainingInWaveRef.current--;
          }

          lastSpawnRef.current = now;
          if (newEnemies.length > 0) {
            try { console.debug('[useGameLoop] spawning', newEnemies.length, 'enemies for level', currentLevel); } catch (e) {}
          }
          return [...currentEnemies, ...newEnemies];
        }

        // Si ya no quedan enemigos por la oleada actual, comprobar si pasamos a la siguiente
        const waveDelay = Math.max(8000 - currentLevel * 200, 4000); // Incrementado el tiempo entre oleadas
        if (now - lastWaveTimeRef.current > waveDelay) {
          // Avanzar a la siguiente oleada
          currentWaveRef.current++;
          lastWaveTimeRef.current = now;

          // Si superamos las oleadas planificadas para el nivel, reiniciar conteo para siguientes oleadas (nivel siguiente)
          if (currentWaveRef.current > wavesThisLevelRef.current) {
            // prepararse para el siguiente "set" de oleadas (se recalculará con el siguiente call)
            currentWaveRef.current = 1;
            enemiesRemainingInWaveRef.current =
              MIN_ENEMIES_PER_WAVE + Math.floor(Math.random() * 3);
          } else {
            // Preparar siguiente oleada dentro del mismo nivel
            const extra = Math.min(
              MAX_ENEMIES_PER_WAVE,
              MIN_ENEMIES_PER_WAVE + Math.floor(Math.random() * 4) + Math.floor(currentLevel / 3)
            );
            enemiesRemainingInWaveRef.current = extra;
          }
        }

        return currentEnemies;
      });

      // Formaciones y escuadrones especiales, con cadencias dependientes del nivel
      const redFormationInterval = Math.max(15000 - currentLevel * 1000, 8000);
      if (now - lastRedFormationRef.current > redFormationInterval) {
        setEnemies((currentEnemies) => {
          if (currentEnemies.length >= MAX_ENEMIES_ON_SCREEN) return currentEnemies;
          const batch = spawnRedFormation(currentLevel);
          const allowed = Math.max(0, MAX_ENEMIES_ON_SCREEN - currentEnemies.length);
          return [...currentEnemies, ...batch.slice(0, allowed)];
        });
        lastRedFormationRef.current = now;
      }
      const specialPatrolInterval = Math.max(
        18000 - currentLevel * 1500,
        10000
      );
      if (now - lastSpecialPatrolRef.current > specialPatrolInterval) {
        setEnemies((currentEnemies) => {
          if (currentEnemies.length >= MAX_ENEMIES_ON_SCREEN) return currentEnemies;
          const batch = spawnSpecialPatrol(currentLevel);
          const allowed = Math.max(0, MAX_ENEMIES_ON_SCREEN - currentEnemies.length);
          return [...currentEnemies, ...batch.slice(0, allowed)];
        });
        lastSpecialPatrolRef.current = now;
      }
      const bomberSquadronInterval = Math.max(
        25000 - currentLevel * 2000,
        15000
      );
      if (now - lastBomberSquadronRef.current > bomberSquadronInterval) {
        setEnemies((currentEnemies) => {
          if (currentEnemies.length >= MAX_ENEMIES_ON_SCREEN) return currentEnemies;
          const batch = spawnBomberSquadron(currentLevel);
          const allowed = Math.max(0, MAX_ENEMIES_ON_SCREEN - currentEnemies.length);
          return [...currentEnemies, ...batch.slice(0, allowed)];
        });
        lastBomberSquadronRef.current = now;
      }
      const scoutSquadronInterval = Math.max(12000 - currentLevel * 800, 6000);
      if (now - lastScoutSquadronRef.current > scoutSquadronInterval) {
        setEnemies((currentEnemies) => {
          if (currentEnemies.length >= MAX_ENEMIES_ON_SCREEN) return currentEnemies;
          const batch = spawnScoutSquadron(currentLevel);
          const allowed = Math.max(0, MAX_ENEMIES_ON_SCREEN - currentEnemies.length);
          return [...currentEnemies, ...batch.slice(0, allowed)];
        });
        lastScoutSquadronRef.current = now;
      }
    },
    [calculateLevel, getSpawnInterval, setEnemies]
  );

  const handleEnemyShooting = useCallback(
    (enemies, enemiesKilled, frameCount) => {
      if (frameCount % 4 !== 0) return;
      const currentLevel = calculateLevel(enemiesKilled);
      const baseShootChance = Math.min(0.003 + currentLevel * 0.0008, 0.015);
      const newEnemyBullets = [];
      enemies.forEach((enemy) => {
        if (enemy.shootCooldown <= 0) {
          let shootChance = baseShootChance;
          if (enemy.isRedFormation) shootChance *= 1.5;
          if (enemy.isBomberSquadron) shootChance *= 2.0;
          if (enemy.isSpecialPatrol) shootChance *= 1.3;
          if (enemy.color === "purple") shootChance *= 1.4;
          if (enemy.isMiniBoss) shootChance *= 2.5;
          if (Math.random() < shootChance) {
            newEnemyBullets.push({
              id: Math.random(),
              x: enemy.x + enemy.width / 2 - 2,
              y: enemy.y + enemy.height,
              width: 4,
              height: 8,
            });
            let baseCooldown = Math.max(60 - currentLevel * 2.5, 20);
            if (enemy.isBomberSquadron) baseCooldown *= 0.7;
            if (enemy.isRedFormation) baseCooldown *= 0.8;
            if (enemy.isMiniBoss) baseCooldown *= 0.5;
            enemy.shootCooldown = Math.max(baseCooldown, 20);
          }
        }
      });
      if (newEnemyBullets.length > 0) {
        setEnemyBullets((current) => [...current, ...newEnemyBullets]);
      }
    },
    [calculateLevel, setEnemyBullets]
  );

  // NUEVO: Función para resetear completamente el juego
  const resetGameState = useCallback(() => {
    // Reset wave-related state
    currentWaveRef.current = 1;
    wavesThisLevelRef.current = MIN_WAVES_PER_LEVEL;
    enemiesRemainingInWaveRef.current = MIN_ENEMIES_PER_WAVE;
    lastWaveTimeRef.current = 0;

    // Reset general game state
    setBullets([]);
    setEnemies([]);
    setEnemyBullets([]);
    setPowerUps([]);
    setExplosions([]);
    setBgOffset(0);
    setEnemiesKilled(0);
    setLevel(1);
    lastSpawnRef.current = Date.now();
    lastRedFormationRef.current = Date.now();
    lastSpecialPatrolRef.current = Date.now();
    lastBomberSquadronRef.current = Date.now();
    lastScoutSquadronRef.current = Date.now();
    lastShotP1Ref.current = 0;
    lastShotP2Ref.current = 0;
    frameRef.current = 0;

    // Resetear el trail del jugador 1
    const initialPoints = [];
    const trailLength = 15;
    for (let i = 0; i < trailLength; i++) {
      initialPoints.push({
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT + 50,
      });
    }
    setPlayer1Trail(initialPoints);
  }, [setLevel]);

  // NUEVO: Función para crear sesión única al iniciar nuevo juego
  const createGameSession = useCallback(() => {
    return `${gameMode}_${Date.now()}`;
  }, [gameMode]);

  useEffect(() => {
    if (gameState !== "playing") {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }
    const gameLoop = () => {
      const now = Date.now();
      frameRef.current++;
      // Debug: trace gameLoop ticks (only occasional to avoid flooding)
      try {
        if (frameRef.current % 60 === 0) {
          console.debug('[useGameLoop] tick', frameRef.current, 'enemies=', enemies.length, 'enemiesKilled=', enemiesKilled);
        }
      } catch (e) {}

      // Movimiento de jugadores (solo si están vivos)
      if (gameMode === "two-player") {
        setPlayer2((prevP2) => {
          if (prevP2.lives <= 0) return prevP2; // No mover si está muerto

          const newP2 = { ...prevP2 };
          const p2Speed = newP2.isLooping
            ? INITIAL_PLAYER_STATE.speed * 1.5
            : INITIAL_PLAYER_STATE.speed;

          // SOLO flechas para Player 2
          if (keys.ArrowUp) newP2.y -= p2Speed;
          if (keys.ArrowDown) newP2.y += p2Speed;
          if (keys.ArrowLeft) newP2.x -= p2Speed;
          if (keys.ArrowRight) newP2.x += p2Speed;

          // Mantener dentro del área de juego
          newP2.x = Math.max(0, Math.min(newP2.x, GAME_WIDTH - newP2.width));
          newP2.y = Math.max(0, Math.min(newP2.y, GAME_HEIGHT - newP2.height));

          // Loop con Ctrl derecho
          if (keys.ControlRight) {
            if (newP2.loopCount > 0 && !newP2.isLooping) {
              newP2.isLooping = true;
              newP2.loopCount -= 1;
              playSound("playerLoop");
              setTimeout(() => {
                setPlayer2((p) => ({ ...p, isLooping: false }));
              }, 1000);
            }
          }

          return newP2;
        });
      }

      setPlayer1((prevP1) => {
        if (prevP1.lives <= 0) return prevP1; // No mover si está muerto

        const newP1 = { ...prevP1 };
        const p1Speed = newP1.isLooping
          ? INITIAL_PLAYER_STATE.speed * 1.5
          : INITIAL_PLAYER_STATE.speed;

        // SOLO WASD para Player 1
        if (keys.KeyW) newP1.y -= p1Speed;
        if (keys.KeyS) newP1.y += p1Speed;
        if (keys.KeyA) newP1.x -= p1Speed;
        if (keys.KeyD) newP1.x += p1Speed;

        // Mantener dentro del área de juego
        newP1.x = Math.max(0, Math.min(newP1.x, GAME_WIDTH - newP1.width));
        newP1.y = Math.max(0, Math.min(newP1.y, GAME_HEIGHT - newP1.height));

        // Loop con Shift izquierdo
        if (keys.ShiftLeft) {
          if (newP1.loopCount > 0 && !newP1.isLooping) {
            newP1.isLooping = true;
            newP1.loopCount -= 1;
            playSound("playerLoop");
            setTimeout(() => {
              setPlayer1((p) => ({ ...p, isLooping: false }));
            }, 1000);
          }
        }
        return newP1;
      });

      // Actualizar posiciones de wingmen
      updateWingmenPositions(player1, setPlayer1);
      if (gameMode === "two-player") {
        updateWingmenPositions(player2, setPlayer2);
      }

      setPlayer1Trail((prevTrail) => {
        if (player1.lives <= 0) return prevTrail; // No actualizar trail si está muerto

        const newTrail = [...prevTrail];
        const trailLength = newTrail.length;
        const playerPoint = {
          x: player1.x + player1.width / 2,
          y: player1.y + player1.height / 2,
        };
        const trailBasePoint = {
          x: player1.x + player1.width / 2,
          y: GAME_HEIGHT + 50,
        };
        const followSpeed = 0.15;
        for (let i = 0; i < trailLength - 1; i++) {
          const point = newTrail[i];
          const targetPoint = newTrail[i + 1];
          point.x += (targetPoint.x - point.x) * followSpeed;
          point.y += (targetPoint.y - point.y) * followSpeed;
        }
        newTrail[trailLength - 1].x +=
          (playerPoint.x - newTrail[trailLength - 1].x) * followSpeed;
        newTrail[trailLength - 1].y +=
          (playerPoint.y - newTrail[trailLength - 1].y) * followSpeed;
        newTrail[0].x += (trailBasePoint.x - newTrail[0].x) * followSpeed;
        newTrail[0].y += (trailBasePoint.y - newTrail[0].y) * followSpeed;
        return newTrail;
      });

      handleShooting(keys, gameMode, now);
      setBullets((currentBullets) =>
        updateBullets(currentBullets, BULLET_SPEED)
      );
      setEnemyBullets((currentBullets) =>
        updateEnemyBullets(currentBullets, ENEMY_BULLET_SPEED)
      );

      if (frameRef.current % 8 === 0) {
        try {
          console.debug('[useGameLoop] spawn-check frame', frameRef.current, 'enemiesRemainingInWave=', enemiesRemainingInWaveRef.current, 'lastWaveTime=', lastWaveTimeRef.current);
        } catch (e) {}
        handleEnemySpawning(now, enemiesKilled);
      }

      // Actualizar enemigos y mantenerlos dentro del área de juego
      setEnemies((currentEnemies) => {
        const updatedEnemies = updateEnemyMovement(
          currentEnemies,
          enemyMovementPatterns
        );

        // Mantener enemigos dentro del área de juego
        const boundedEnemies = updatedEnemies
          .map((enemy) => ({
            ...enemy,
            x: Math.max(
              -enemy.width,
              Math.min(enemy.x, GAME_WIDTH + enemy.width)
            ),
            y: Math.max(-100, enemy.y), // Permitir que aparezcan desde arriba pero no que se vayan demasiado lejos
          }))
          .filter(
            (enemy) => enemy.y < GAME_HEIGHT + 100 && enemy.y > -200 // Filtrar enemigos que están muy fuera de la pantalla
          );

        handleEnemyShooting(boundedEnemies, enemiesKilled, frameRef.current);
        return boundedEnemies;
      });

      setPowerUps((currentPowerUps) =>
        currentPowerUps
          .map((powerUp) => ({ ...powerUp, y: powerUp.y + 2 }))
          .filter((powerUp) => powerUp.y < GAME_HEIGHT + 50)
      );

      setBgOffset((prev) => (prev + 1) % 100);

setBullets((currentBullets) => {
  let enemiesDestroyedThisFrame = 0;
  const destroyedFormations = new Set();
  // `currentEnemies` is not defined in this scope; use the latest `enemies` state instead.
  let enemiesToKeep = Array.isArray(enemies) ? [...enemies] : [];
  const bulletsToKeep = currentBullets.filter((bullet) => {
    let hit = false;
    for (let i = 0; i < enemiesToKeep.length; i++) {
      const enemy = enemiesToKeep[i];
      if (enemy.health > 0 && checkCollision(bullet, enemy)) {
        hit = true;
        const newHealth = enemy.health - 1;
        if (newHealth <= 0) {
          enemiesDestroyedThisFrame++;
          const enemyCenterX = enemy.x + enemy.width / 2;
          const enemyCenterY = enemy.y + enemy.height / 2;
          const explosionSize = enemy.isBomberSquadron || enemy.maxHealth > 3 ? 80 : 50;
          const offset = explosionSize / 2;
          const explosionX = enemyCenterX - offset;
          const explosionY = enemyCenterY - offset;
          createExplosion(explosionX, explosionY, enemy);
          if (now - lastExplosionSoundRef.current > 100) {
            playSound("explosion");
            lastExplosionSoundRef.current = now;
          }
          const points = enemy.points || 100;
          if (bullet.playerId === 1) {
            setScore((s) => s + points);
          } else {
            setScore2((s) => s + points);
          }
          if (enemy.isRedFormation) {
            destroyedFormations.add(enemy.formationId);
          }
          enemiesToKeep.splice(i, 1);
        } else {
          enemiesToKeep[i] = { ...enemy, health: newHealth };
        }
        break;
      }
    }
    return !hit;
  });
  setEnemies(enemiesToKeep);
  if (enemiesDestroyedThisFrame > 0) {
    setEnemiesKilled((prev) => {
      const newTotal = prev + enemiesDestroyedThisFrame;
      const newLevel = calculateLevel(newTotal);
      if (newLevel > level) {
        setLevel(newLevel);
      }
      return newTotal;
    });
  }
  destroyedFormations.forEach((formationId) => {
    const remainingInFormation = enemiesToKeep.filter(
      (e) => e.formationId === formationId
    );
    if (remainingInFormation.length === 0) {
      const powerUpType =
        POWER_UP_TYPES[
          Math.floor(Math.random() * POWER_UP_TYPES.length)
        ];
      setPowerUps((currentPowerUps) => [
        ...currentPowerUps,
        {
          id: Math.random(),
          x: Math.random() * (GAME_WIDTH - 30),
          y: -30,
          width: 30,
          height: 30,
          type: powerUpType,
          speed: 2,
        },
      ]);
    }
  });
  return bulletsToKeep;
});
    };
  gameLoopRef.current = setInterval(gameLoop, 1000 / 60);
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [
    gameState,
    gameMode,
    keys,
    enemiesKilled,
    level,
    player1,
    player2,
    handlePlayerDamage,
    calculateLevel,
    getSpawnInterval,
    applyPowerUp,
    handleShooting,
    handleEnemySpawning,
    handleEnemyShooting,
    handleWingmenCollisions,
    updateWingmenPositions,
    playSound,
    createExplosion,
    revivePlayer,
  ]);

  // MODIFICADO: Solo resetear cuando realmente se inicie un nuevo juego
  useEffect(() => {
    if (gameState === "playing") {
      const currentSession = createGameSession();

      // Solo resetear si es realmente una nueva sesión de juego
      // (cuando gameSession es null o cuando cambió el modo de juego)
      if (!gameSession || !gameSession.startsWith(gameMode)) {
        setGameSession(currentSession);
        resetGameState();
      }
    }
  }, [gameState, gameMode, resetGameState, gameSession, createGameSession]);

  // NUEVO: Resetear sesión cuando se sale del juego
  useEffect(() => {
    if (gameState === "menu" || gameState === "gameOver") {
      setGameSession(null);
    }
  }, [gameState]);

  // Manejar pausa automática al cambiar de pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === "playing") {
        setGameState("paused");
      }
    };

    const handleBlur = () => {
      if (gameState === "playing") {
        setGameState("paused");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [gameState, setGameState]);

  return {
    bullets,
    enemies,
    enemyBullets,
    powerUps,
    bgOffset,
    player1Trail,
    enemiesKilled,
    explosions,
    resetLoopState,
    // Exponer información de oleadas para HUD
    currentWave: currentWaveRef.current,
    wavesThisLevel: wavesThisLevelRef.current,
  };


}
export default useGameLoop;
