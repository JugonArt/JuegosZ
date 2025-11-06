import React from 'react';
import styles from '../../styles/1942/GameHud.module.css';
import waveStyles from '../../styles/1942/WaveHUD.module.css';

const GameHUD = ({
  gameMode,
  score,
  score2,
  level,
  currentWave = 1,
  wavesThisLevel = 1,
  player1,
  player2,
  enemyCount,
  powerUpCount,
  player1Name = 'Jugador 1',
  player2Name = 'Jugador 2'
}) => {
  const getActivePowerUps = (player) => {
    const powerUps = [];

    if (player.fireMode === "triple") {
      powerUps.push({
        type: "triple",
        icon: "",
        label: "",
        className: `${styles.triple} ${styles.POicon} ${styles.iconAppear}`,
      });
    } else if (player.fireMode === "double") {
      powerUps.push({
        type: "double",
        icon: "",
        label: "",
        className: `${styles.double} ${styles.POicon} ${styles.iconAppear}`,
      });
    }

    if (player.wingmen && player.wingmen.length > 0) {
      powerUps.push({
        type: "wingman",
        label: `${player.wingmen.length}`,
        className: `${styles.wingman} ${styles.POicon} ${styles.iconAppear}`,
      });
    }

    if (player.loopCount > 0) {
      powerUps.push({
        type: "loops",
        label: `${player.loopCount}`,
        className: `${styles.loops} ${styles.POicon} ${styles.iconAppear}`,
      });
    }
    if (player.loopCount > 0) {
      powerUps.push({
        type: "revive",
        label: `${player.loopCount}`,
        className: `${styles.revive} ${styles.POicon} ${styles.iconAppear}`,
      });
    }

    return powerUps;
  };

  const renderLives = (lives) => {
    const hearts = [];
    for (let i = 0; i < Math.max(lives, 0); i++) {
      hearts.push(<div key={i} className={`${styles.heartFull} ${styles.heart}`}></div>);
    }
    for (let i = lives; i < 3; i++) {
      hearts.push(<div key={`empty-${i}`} className={`${styles.heartEmpty} ${styles.heart}`}></div>);
    }
    return hearts;
  };

  const formatScore = (score) => {
    return score.toLocaleString();
  };

  return (
    <div className={styles.gameHud}>
      <div className={styles.hudMainBar}>
        <div
          className={`${styles.hudGrid} ${
            gameMode === "two-player" ? styles.hudGrid2players : ""
          }`}
        >
          <div className={styles.playerStats}>
            <div className={`${styles.playerCard} ${styles.player1Card} ${styles.LeftRight}`}>
              <div className={styles.playerLabel}>{player1Name}</div>
              <div className={styles.playerScore}>
                <div className={`${styles.PlayerIcon} ${styles.GokuIcon}`}></div>
                {formatScore(score)}
              </div>
              <div className={styles.playerLives}>{renderLives(player1.lives)}</div>
            </div>
          </div>
          <div className={`${styles.powerupSection} ${styles.player1Powerups}`}>
            <div className={styles.powerupSectionLabel}>POWER-UPS {player1Name}</div>
            <div className={styles.powerupList}>
              {getActivePowerUps(player1).map((powerUp, index) => (
                <div
                  key={`p1-${powerUp.type}-${index}`}
                  className={`${styles.powerupItem} ${powerUp.className}`}
                  title={powerUp.label}
                >
                  <span className={styles.powerupItemIcon}>{powerUp.icon}</span>
                  <span className={styles.powerupItemLabel}>{powerUp.label}</span>
                </div>
              ))}
              {getActivePowerUps(player1).length === 0 && (
                <span className={styles.noPowerups}>Sin power-ups</span>
              )}
            </div>
          </div>
          {gameMode === "two-player" ? (
            <div className={styles.centerStats}>
              <div className={styles.levelCard}>
                <div className={styles.levelLabel}>NIVEL</div>
                <div className={styles.levelNumber}>{level}</div>
              </div>
              <div className={waveStyles.waveCard}>
                <div className={waveStyles.waveLabel}>OLEADA</div>
                <div className={waveStyles.waveNumber}>{currentWave}/{wavesThisLevel}</div>
              </div>
              <div className={styles.enemyCard}>
                <div className={styles.enemyLabel}>Soldados de Patrulla Roja</div>
                <div
                  className={`${styles.enemyCount} ${
                    enemyCount > 10 ? styles.enemyDanger : ""
                  }`}
                >
                  <span className={styles.enemyIcon}></span>
                  <span>{enemyCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.none}></div>
          )}
          {gameMode === "two-player" ? (
            <div className={`${styles.powerupSection} ${styles.player2Powerups}`}>
              <div className={styles.powerupSectionLabel}>{player2Name} POWER-UPS</div>
              <div className={styles.powerupList}>
                {getActivePowerUps(player2).map((powerUp, index) => (
                  <div
                    key={`p2-${powerUp.type}-${index}`}
                    className={`${styles.powerupItem} ${powerUp.className}`}
                    title={powerUp.label}
                  >
                    <span className={styles.powerupItemIcon}>{powerUp.icon}</span>
                    <span className={styles.powerupItemLabel}>{powerUp.label}</span>
                  </div>
                ))}
                {getActivePowerUps(player2).length === 0 && (
                  <span className={styles.noPowerups}>No active power-ups</span>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.none}></div>
          )}
          {gameMode === "two-player" ? (
            <div className={styles.rightStatsPlayer}>
              <div className={`${styles.playerCard} ${styles.player2Card} ${styles.LeftRight}`}>
                <div className={styles.playerLabel}>{player2Name}</div>
                <div className={styles.playerScore}>
                  {formatScore(score2)}
                  <div className={`${styles.PlayerIcon} ${styles.MrPopoIcon}`}></div>
                </div>
                <div className={styles.playerLives}>{renderLives(player2.lives)}</div>
              </div>
            </div>
          ) : (
            <div className={styles.rightStats}>
              <div className={`${styles.powerupSection} ${styles.player2Powerups}`}>
                <div className={styles.powerupSectionLabel}>
                  Soldados patrulla roja
                </div>
                <div className={styles.powerupList}>
                  <div
                    className={`${styles.enemyCount} ${
                      enemyCount > 10 ? styles.enemyDanger : ""
                    }`}
                  >
                    <span className={styles.enemyIcon}></span>
                    <span>{enemyCount}</span>
                  </div>
                </div>
              </div>
              <div className={styles.levelCard}>
                <div className={styles.levelLabel}>NIVEL</div>
                <div className={styles.levelNumber}>{level}</div>
              </div>
              <div className={waveStyles.waveCard}>
                <div className={waveStyles.waveLabel}>OLEADA</div>
                <div className={waveStyles.waveNumber}>{currentWave}/{wavesThisLevel}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHUD;