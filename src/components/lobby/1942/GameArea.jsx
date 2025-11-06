import React, { useCallback, memo } from 'react';
import Background from './Background.jsx';
import Player from './Player.jsx';
import Enemy from './Enemy.jsx';
import Bullet from './Bullet.jsx';
import PowerUp from './PowerUp.jsx';
import { GAME_WIDTH, GAME_HEIGHT } from '../../../utils1942/constants.js';
import NimbusPoint from './NimbusPoint.jsx';
import Explosion from './Explosion.jsx';

// Memoiza componentes para evitar renders innecesarios
const MemoizedPlayer = memo(Player);
const MemoizedEnemy = memo(Enemy);
const MemoizedBullet = memo(Bullet);
const MemoizedPowerUp = memo(PowerUp);
const MemoizedExplosion = memo(Explosion);
const MemoizedNimbusPoint = memo(NimbusPoint);

const GameArea = ({ gameMode, gameData, player1, player2, level }) => {
  const {
    bullets,
    enemies,
    enemyBullets,
    powerUps,
    player1Trail,
    explosions = [],
  } = gameData;

  // Memoizar la función de renderizado del wingman para evitar su re-creación
  const renderWingman = useCallback((player) => {
    if (!player.wingmen || player.wingmen.length === 0 || player.lives <= 0) {
      return null;
    }

    const wingman = player.wingmen[0];
    const isAlive = wingman.health > 0;
    const isFlipped = player.x < GAME_WIDTH / 2;

    if (!isAlive) return null;

    // Usar la posición actualizada del wingman que sigue al jugador
    const wingmanX = wingman.x;
    const wingmanY = wingman.y;

    return (
      <div
        key={`wingman-${player.id}`}
        className={`Wingmans absolute ${isFlipped ? "flip-wingman" : ""}`}
        style={{
          left: wingmanX,
          top: wingmanY,
          width: wingman.width,
          height: wingman.height,
          zIndex: 9,
        }}
      />
    );
  }, []); // Dependencias vacías, la función no cambia

  // Memoizar la función de renderizado del enemigo con barra de vida
  const renderEnemyWithHealth = useCallback((enemy) => {
    const showHealthBar = enemy.maxHealth > 1;

    return (
      <div key={enemy.id}>
        <MemoizedEnemy enemy={enemy} />

        {showHealthBar && (
          <div
            className="absolute"
            style={{
              left: enemy.x,
              top: enemy.y - 30,
              width: enemy.width,
              height: 3,
              borderRadius: "10vw",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              className="h-full transition-all duration-200"
              style={{
                width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                backgroundColor:
                  enemy.health === 1
                    ? "#ff4444"
                    : enemy.health === 2
                    ? "#ffaa44"
                    : "#44ff44",
              }}
            />
          </div>
        )}

        {enemy.isRedFormation && (
          <div
            style={{
              left: enemy.x - 2,
              top: enemy.y - 2,
              width: enemy.width + 4,
              height: enemy.height + 4,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    );
  }, []); // Dependencias vacías

  return (
    <div className="flex justify-center w-full">
      <div
        className="GameArea relative overflow-hidden shadow-2xl game-border"
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          backgroundColor: "#000033",
        }}
      >
        <Background
          /* videoSourceMP4={};*/
        />

        {/* Efectos de ambiente */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-blue-900 via-transparent to-transparent opacity-20" />
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-blue-900 via-transparent to-transparent opacity-20" />
        </div>

        {/* Rastro de la Nube Voladora - solo si el jugador está vivo */}
        {player1.lives > 0 &&
          player1Trail.map((point, index) => (
            <MemoizedNimbusPoint
              key={index}
              x={point.x}
              y={point.y}
              size={1 + (index / (player1Trail.length - 1)) * 30}
              color="#fbf096"
              opacity={index / (player1Trail.length - 1)}
            />
          ))}

        {/* Player 1 - solo renderizar si está vivo */}
        {player1.lives > 0 && (
          <>
            <MemoizedPlayer player={player1} playerId={1} />
            {renderWingman(player1)}
          </>
        )}

        {/* Player 2 - solo renderizar si está vivo y es modo dos jugadores */}
        {gameMode === "two-player" && player2.lives > 0 && (
          <>
            <MemoizedPlayer player={player2} playerId={2} />
            {renderWingman(player2)}
          </>
        )}

        {/* Balas de jugadores - filtrar balas de jugadores muertos */}
        {bullets
          .filter((bullet) => {
            if (bullet.playerId === 1) return player1.lives > 0;
            if (bullet.playerId === 2) return player2.lives > 0;
            return true;
          })
          .map((bullet) => (
            <MemoizedBullet key={bullet.id} bullet={bullet} />
          ))}

        {enemies.map((enemy) => renderEnemyWithHealth(enemy))}

        {enemyBullets.map((bullet) => (
          <MemoizedBullet key={bullet.id} bullet={bullet} isEnemy={true} />
        ))}

        {powerUps.map((powerUp) => (
          <MemoizedPowerUp key={powerUp.id} powerUp={powerUp} />
        ))}

        {explosions.map((explosion) => (
          <MemoizedExplosion key={explosion.id} explosion={explosion} />
        ))}

        {/* Indicador de formaciones especiales activas */}
        {enemies.some(
          (e) => e.isSpecialPatrol || e.isBomberSquadron || e.isRedFormation
        ) && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-yellow-300 text-sm bg-red-900 bg-opacity-80 px-3 py-1 rounded border border-yellow-400 animate-pulse">
            FORMACIÓN ESPECIAL ACTIVA
          </div>
        )}

        {/* Indicador de jugadores muertos en modo dos jugadores */}
        {gameMode === "two-player" && (
          <>
            {player1.lives <= 0 && (
              <div className="absolute top-16 left-4 z-10 text-red-300 text-sm bg-black bg-opacity-80 px-3 py-1 rounded border border-red-400">
                JUGADOR 1: ELIMINADO
              </div>
            )}
            {player2.lives <= 0 && (
              <div className="absolute top-16 right-4 z-10 text-red-300 text-sm bg-black bg-opacity-80 px-3 py-1 rounded border border-red-400">
                JUGADOR 2: ELIMINADO
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GameArea;
