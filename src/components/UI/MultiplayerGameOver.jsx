import { useState, useEffect } from 'react';
import baseStyles from '../styles/GameOver/GameOverBase.module.css';
import styles from '../styles/GameOver/MultiplayerGameOver.module.css';
import { 
  getGameConfig, 
  isValidPlayerName, 
  renderGameSpecificContent,
  getPersonalizedTitle,
  getPersonalizedSubtitle,
  createSaveScoreHandler
} from './gameOverUtils';
import { validatePlayerName, formatValidationErrors } from '../../utils/scoreValidation';
import { getSpaceInvadersScoreByName, getSimonDiceScoreByName } from '../../utils/scoreDatabase';

const MultiplayerGameOver = ({ 
  // Información básica
  gameType,           // 'spaceinvaders', '1942', 'simondice', 'ppt'
  
  // Scores
  score = 0,          // Score del jugador 1
  score2 = 0,         // Score del jugador 2
  
  // Información específica del juego
  gameSpecificData = {}, // Datos específicos: {level, round, lives, etc}
  
  // Nombres de jugadores
  player1Name = '',
  player2Name = '',
  
  // Callbacks
  onSaveScore,        // función para guardar scores
  onRestart,          // función para reiniciar
  onBackToMenu,       // función para volver al menú
  
  // Configuración
  allowNameInput = true,    // permitir ingresar nombres
  
  // Video personalizado (opcional)
  videoSrc
}) => {
  const [player1InputName, setPlayer1InputName] = useState('');
  const [player2InputName, setPlayer2InputName] = useState('');
  const [player1Saved, setPlayer1Saved] = useState(false);
  const [player2Saved, setPlayer2Saved] = useState(false);
  const [player1Error, setPlayer1Error] = useState('');
  const [player2Error, setPlayer2Error] = useState('');
  const [isSavingP1, setIsSavingP1] = useState(false);
  const [isSavingP2, setIsSavingP2] = useState(false);
  const [p1ExistingHasSaved, setP1ExistingHasSaved] = useState(false);
  const [p2ExistingHasSaved, setP2ExistingHasSaved] = useState(false);
  const [p1InputHasSaved, setP1InputHasSaved] = useState(false);
  const [p2InputHasSaved, setP2InputHasSaved] = useState(false);

  const config = getGameConfig(gameType);
  const finalVideoSrc = videoSrc || config.videoSrc;

  // Validación de nombres
  const player1HasValidName = isValidPlayerName(player1Name);
  const player2HasValidName = isValidPlayerName(player2Name);
  const bothHaveValidNames = player1HasValidName && player2HasValidName;
  const hasExistingNames = player1HasValidName || player2HasValidName;

  // Determinar ganador
  const player1Won = score > score2;
  const player2Won = score2 > score;
  const isTie = score === score2;

  // Estados de guardado
  const allSaved = player1Saved && player2Saved;

  // Handlers para guardar scores
  const handleSavePlayer1 = createSaveScoreHandler(onSaveScore, setPlayer1Saved);
  const handleSavePlayer2 = createSaveScoreHandler(onSaveScore, setPlayer2Saved);

  // Guardar score con input y validación
  const handleSaveScore = async (playerNum) => {
    const currentName = playerNum === 1 ? player1InputName : player2InputName;
    const otherName = playerNum === 1 ? player2InputName : player1InputName;
    const currentScore = playerNum === 1 ? score : score2;
    const handler = playerNum === 1 ? handleSavePlayer1 : handleSavePlayer2;
    const setError = playerNum === 1 ? setPlayer1Error : setPlayer2Error;
    const setSaving = playerNum === 1 ? setIsSavingP1 : setIsSavingP2;
    
    setError('');
    
    // Validate name
    const validation = validatePlayerName(currentName);
    if (!validation.valid) {
      setError(formatValidationErrors(validation.errors));
      return;
    }

    // Validar que los nombres no sean iguales (si el otro jugador ya ingresó nombre)
    if (otherName.trim() && validation.sanitized.toLowerCase() === otherName.trim().toLowerCase()) {
      setError('No pueden jugar dos personas con un mismo nombre.');
      return;
    }

    setSaving(true);
    try {
      await handler({
        playerNum,
        name: validation.sanitized,
        score: currentScore,
        gameType,
        gameMode: 'multiplayer',
        gameSpecificData,
        isWin: playerNum === 1 ? player1Won : player2Won
      });
    } catch (error) {
      setError(error.message || 'Error al guardar el puntaje');
      if (playerNum === 1) {
        setPlayer1Saved(false);
      } else {
        setPlayer2Saved(false);
      }
    } finally {
      setSaving(false);
    }
  };

  // Handlers para Enter key en inputs
  const handleKeyDownP1 = (e) => {
    if (e.key === 'Enter' && player1InputName.trim() && !player1Saved && !isSavingP1) {
      e.preventDefault();
      handleSaveScore(1);
    }
  };

  const handleKeyDownP2 = (e) => {
    if (e.key === 'Enter' && player2InputName.trim() && !player2Saved && !isSavingP2) {
      e.preventDefault();
      handleSaveScore(2);
    }
  };

  // Helpers to check if a name already has saved data (per game)
  useEffect(() => {
    let cancelled = false;
    const checkExisting = async () => {
      if (gameType === 'ppt') return;
      // Player 1 existing name
      if (isValidPlayerName(player1Name)) {
        try {
          let exists = false;
          if (gameType === 'spaceinvaders' || gameType === '1942') {
            exists = !!(await getSpaceInvadersScoreByName(player1Name));
          } else if (gameType === 'simondice') {
            exists = !!(await getSimonDiceScoreByName(player1Name));
          }
          if (!cancelled) setP1ExistingHasSaved(exists);
        } catch (_) { if (!cancelled) setP1ExistingHasSaved(false); }
      } else {
        setP1ExistingHasSaved(false);
      }
      // Player 2 existing name
      if (isValidPlayerName(player2Name)) {
        try {
          let exists = false;
          if (gameType === 'spaceinvaders' || gameType === '1942') {
            exists = !!(await getSpaceInvadersScoreByName(player2Name));
          } else if (gameType === 'simondice') {
            exists = !!(await getSimonDiceScoreByName(player2Name));
          }
          if (!cancelled) setP2ExistingHasSaved(exists);
        } catch (_) { if (!cancelled) setP2ExistingHasSaved(false); }
      } else {
        setP2ExistingHasSaved(false);
      }
    };
    checkExisting();
    return () => { cancelled = true; };
  }, [player1Name, player2Name, gameType]);

  useEffect(() => {
    let cancelled = false;
    const checkInputs = async () => {
      if (gameType === 'ppt') return;
      // P1 input
      const name1 = player1InputName.trim();
      if (!name1) { setP1InputHasSaved(false); } else {
        try {
          let exists = false;
          if (gameType === 'spaceinvaders' || gameType === '1942') {
            exists = !!(await getSpaceInvadersScoreByName(name1));
          } else if (gameType === 'simondice') {
            exists = !!(await getSimonDiceScoreByName(name1));
          }
          if (!cancelled) setP1InputHasSaved(exists);
        } catch (_) { if (!cancelled) setP1InputHasSaved(false); }
      }
      // P2 input
      const name2 = player2InputName.trim();
      if (!name2) { setP2InputHasSaved(false); } else {
        try {
          let exists = false;
          if (gameType === 'spaceinvaders' || gameType === '1942') {
            exists = !!(await getSpaceInvadersScoreByName(name2));
          } else if (gameType === 'simondice') {
            exists = !!(await getSimonDiceScoreByName(name2));
          }
          if (!cancelled) setP2InputHasSaved(exists);
        } catch (_) { if (!cancelled) setP2InputHasSaved(false); }
      }
    };
    checkInputs();
    return () => { cancelled = true; };
  }, [player1InputName, player2InputName, gameType]);

  

  console.log('🎮 MULTIPLAYER GAME OVER DEBUG:', {
    player1Name, player2Name,
    player1HasValidName, player2HasValidName, bothHaveValidNames,
    player1Saved, player2Saved, allSaved,
    player1Won, player2Won, isTie,
    showDualSectors: allSaved || bothHaveValidNames
  });

  console.log('🔍 DETAILED NAME VALIDATION:', {
    'player1Name type': typeof player1Name,
    'player1Name value': player1Name,
    'player1Name trimmed': player1Name?.trim(),
    'player2Name type': typeof player2Name, 
    'player2Name value': player2Name,
    'player2Name trimmed': player2Name?.trim(),
    'isValidPlayerName(player1Name)': isValidPlayerName(player1Name),
    'isValidPlayerName(player2Name)': isValidPlayerName(player2Name)
  });

  // Función para renderizar información específica de cada jugador
  const renderPlayerSpecificInfo = (playerNum, playerScore) => {
    switch(gameType) {
      case 'spaceinvaders':
        return (
          <div className={baseStyles.gameSpecificInfo}>
            <p>Puntuación: <span className={baseStyles.highlight}>{playerScore.toLocaleString()}</span></p>
            <p>Nivel alcanzado: <span className={baseStyles.highlight}>{(gameSpecificData && (gameSpecificData[`level${playerNum}`] ?? gameSpecificData.level)) ?? 1}</span></p>
          </div>
        );
      
      case 'ppt':
        // Para PPT multiplayer: solo mostrar vidas restantes
        // El score ya representa las vidas restantes de cada jugador
        return (
          <div className={styles.pptLivesContainer}>
            <p className={styles.pptLivesLabel}>Vidas restantes</p>
            <div className={styles.pptLivesValue}>{playerScore}</div>
            {isTie && (
              <p className={styles.pptTieText}>Resultado: <span className={baseStyles.highlight}>Empate</span></p>
            )}
          </div>
        );
      
      case '1942':
        return (
          <div className={baseStyles.gameSpecificInfo}>
            <p>Score: <span className={baseStyles.highlight}>{playerScore.toLocaleString()}</span></p>
            <p>Nivel alcanzado: <span className={baseStyles.highlight}>{(gameSpecificData && (gameSpecificData[`level${playerNum}`] ?? gameSpecificData.level)) ?? 1}</span></p>
            {gameSpecificData.enemiesDestroyed && (
              <p>Enemigos destruidos: <span className={baseStyles.highlight}>{gameSpecificData.enemiesDestroyed}</span></p>
            )}
          </div>
        );
      
      case 'simondice':
        return (
          <div className={baseStyles.gameSpecificInfo}>
            <p>Score: <span className={baseStyles.highlight}>{playerScore.toLocaleString()}</span></p>
            <p>Nivel alcanzado: <span className={baseStyles.highlight}>{(gameSpecificData && (gameSpecificData[`level${playerNum}`] ?? gameSpecificData.level)) ?? 1}</span></p>
            <p>Ronda alcanzada: <span className={baseStyles.highlight}>{(gameSpecificData && (gameSpecificData[`round${playerNum}`] ?? gameSpecificData.round)) ?? 1}</span></p>
          </div>
        );
      
      default:
        return (
          <div className={baseStyles.gameSpecificInfo}>
            <p>Score: <span className={baseStyles.highlight}>{playerScore.toLocaleString()}</span></p>
          </div>
        );
    }
  };

  // Decidir si mostrar dual sectores o sector único
  // For PPT: siempre usar el layout de dos sectores (no hay sistema de guardado)
  const shouldShowDualSectors = bothHaveValidNames || gameType === 'ppt';
  console.log('🎯 DUAL SECTORS DECISION:', { 
    shouldShowDualSectors, 
    bothHaveValidNames, 
    allSaved,
    'FORCING DUAL SECTORS': bothHaveValidNames
  });
  
  if (shouldShowDualSectors) {
    console.log('✅ SHOWING DUAL SECTORS - Condition met:', { allSaved, bothHaveValidNames });
    
    return (
      <div className={`${baseStyles.gameOverOverlay} ${baseStyles.multiplayerMode}`}>
        {/* Video seguro: si falla, ocultar y continuar sin romper la UI */}
        {finalVideoSrc && (
          <video
            className={baseStyles.gameOverVideo}
            autoPlay
            loop
            muted
            playsInline
            onError={(e) => { try { e.currentTarget.style.display = 'none' } catch (_) {} ; console.warn('MultiplayerGameOver video failed to load:', finalVideoSrc) }}
          >
            <source src={finalVideoSrc} type="video/mp4" />
            Tu navegador no soporta video en HTML5.
          </video>
        )}
            <div className={baseStyles.Kaiosama}></div>
        <div className={baseStyles.gameOverModal}>
          <div className={styles.multiplayerGameOverContainer}>
            {console.log('🎯 RENDERING DUAL SECTORS')}
            
            {/* Sector del Jugador 1 */}
            <div className={`${styles.playerGameOverSection} ${player1Won ? styles.winner : styles.loser}`}>
              <div className={baseStyles.gameOverHeader}>
                <h1 className={`${baseStyles.gameOverTitle} ${isTie ? baseStyles.win : (player1Won ? baseStyles.win : baseStyles.lose)}`}>
                  {(() => {
                    const fallback1 = player1Name && player1Name.trim() ? player1Name : 'Jugador 1';
                    if (isTie) return `¡EMPATE, ${fallback1.toUpperCase()}!`;
                    if (isValidPlayerName(player1Name)) {
                      return player1Won ? `¡GANASTE, ${player1Name.toUpperCase()}!` : `PERDISTE, ${player1Name.toUpperCase()}`;
                    }
                    // Para PPT mostramos el nombre por defecto incluso si no es un nombre guardado
                    if (gameType === 'ppt') {
                      return player1Won ? `¡GANASTE, ${fallback1.toUpperCase()}!` : `PERDISTE, ${fallback1.toUpperCase()}!`;
                    }
                    return player1Won ? config.winTitle : config.loseTitle;
                  })()}
                </h1>
              </div>

              {/* Información específica del jugador 1 */}
              {renderPlayerSpecificInfo(1, score)}

              {/* Acciones del jugador 1: input+save if guest, otherwise per-player save button */}
              {/* Para PPT no mostramos opciones de guardado en multiplayer */}
              {gameType !== 'ppt' && (
                <div className={styles.playerActions}>
                  {(!player1HasValidName && allowNameInput) ? (
                    <div className={baseStyles.inputGroup}>
                      <input
                        type="text"
                        placeholder="Nombre Jugador 1 (mín. 3 caracteres)..."
                        value={player1InputName}
                        onChange={(e) => {
                          setPlayer1InputName(e.target.value);
                          setPlayer1Error('');
                        }}
                        onKeyDown={handleKeyDownP1}
                        maxLength={20}
                        className={baseStyles.gameOverInput}
                        disabled={player1Saved || isSavingP1}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveScore(1)}
                        disabled={!player1InputName.trim() || player1Saved || isSavingP1}
                        className={baseStyles.gameOverButton}
                      >
                        {isSavingP1 ? 'Guardando...' : player1Saved ? 'Guardado' : (p1InputHasSaved ? 'Sobreescribir' : 'Guardar Puntaje')}
                      </button>
                      {player1Error && (
                        <div className={baseStyles.errorMessage}>
                          {player1Error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={baseStyles.gameOverActions}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!player1Saved && onSaveScore) {
                            setPlayer1Error('');
                            setIsSavingP1(true);
                            try {
                              await handleSavePlayer1({
                                playerNum: 1,
                                name: player1Name,
                                score,
                                gameType,
                                gameMode: 'multiplayer',
                                gameSpecificData,
                                isWin: player1Won
                              });
                            } catch (error) {
                              setPlayer1Error(error.message || 'Error al guardar');
                              setPlayer1Saved(false);
                            } finally {
                              setIsSavingP1(false);
                            }
                          }
                        }}
                        disabled={player1Saved || isSavingP1}
                        className={baseStyles.gameOverButton}
                      >
                        {isSavingP1 ? 'Guardando...' : player1Saved ? 'Guardado' : (p1ExistingHasSaved ? 'Sobreescribir' : 'Guardar Puntaje')}
                      </button>
                      {player1Error && (
                        <div className={baseStyles.errorMessage}>
                          {player1Error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Separador VS */}
            <div className={styles.vsSeparatorLarge}>VS</div>

            {/* Sector del Jugador 2 */}
            <div className={`${styles.playerGameOverSection} ${player2Won ? styles.winner : styles.loser}`}>
              <div className={baseStyles.gameOverHeader}>
                <h1 className={`${baseStyles.gameOverTitle} ${isTie ? baseStyles.win : (player2Won ? baseStyles.win : baseStyles.lose)}`}>
                  {(() => {
                    const fallback2 = player2Name && player2Name.trim() ? player2Name : 'Jugador 2';
                    if (isTie) return `¡EMPATE, ${fallback2.toUpperCase()}!`;
                    if (isValidPlayerName(player2Name)) {
                      return player2Won ? `¡GANASTE, ${player2Name.toUpperCase()}!` : `PERDISTE, ${player2Name.toUpperCase()}`;
                    }
                    if (gameType === 'ppt') {
                      return player2Won ? `¡GANASTE, ${fallback2.toUpperCase()}!` : `PERDISTE, ${fallback2.toUpperCase()}!`;
                    }
                    return player2Won ? config.winTitle : config.loseTitle;
                  })()}
                </h1>
              </div>

              {/* Información específica del jugador 2 */}
              {renderPlayerSpecificInfo(2, score2)}

              {/* Acciones del jugador 2: input+save if guest, otherwise per-player save button */}
              {/* Para PPT no mostramos opciones de guardado en multiplayer */}
              {gameType !== 'ppt' && (
                <div className={styles.playerActions}>
                  {(!player2HasValidName && allowNameInput) ? (
                    <div className={baseStyles.inputGroup}>
                      <input
                        type="text"
                        placeholder="Nombre Jugador 2 (mín. 3 caracteres)..."
                        value={player2InputName}
                        onChange={(e) => {
                          setPlayer2InputName(e.target.value);
                          setPlayer2Error('');
                        }}
                        onKeyDown={handleKeyDownP2}
                        maxLength={20}
                        disabled={player2Saved || isSavingP2}
                        className={baseStyles.gameOverInput}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveScore(2)}
                        disabled={!player2InputName.trim() || player2Saved || isSavingP2}
                        className={baseStyles.gameOverButton}
                      >
                        {isSavingP2 ? 'Guardando...' : player2Saved ? 'Guardado' : (p2InputHasSaved ? 'Sobreescribir' : 'Guardar Puntaje')}
                      </button>
                      {player2Error && (
                        <div className={baseStyles.errorMessage}>
                          {player2Error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={baseStyles.gameOverActions}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!player2Saved && onSaveScore) {
                            setPlayer2Error('');
                            setIsSavingP2(true);
                            try {
                              await handleSavePlayer2({
                                playerNum: 2,
                                name: player2Name,
                                score: score2,
                                gameType,
                                gameMode: 'multiplayer',
                                gameSpecificData,
                                isWin: player2Won
                              });
                            } catch (error) {
                              setPlayer2Error(error.message || 'Error al guardar');
                              setPlayer2Saved(false);
                            } finally {
                              setIsSavingP2(false);
                            }
                          }
                        }}
                        disabled={player2Saved || isSavingP2}
                        className={baseStyles.gameOverButton}
                      >
                        {isSavingP2 ? 'Guardando...' : player2Saved ? 'Guardado' : (p2ExistingHasSaved ? 'Sobreescribir' : 'Guardar Puntaje')}
                      </button>
                      {player2Error && (
                        <div className={baseStyles.errorMessage}>
                          {player2Error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Per-player save buttons are rendered inside each player's sector above. */}

          {/* Acciones principales */}
          <div className={baseStyles.gameOverActions}>
            <button onClick={onRestart} className={baseStyles.gameOverButton}>
              Jugar de Nuevo
            </button>
            <button onClick={onBackToMenu} className={baseStyles.gameOverButton}>
              Salir al Menú
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    // Sector único para multiplayer sin nombres válidos o sin guardar
    console.log('⚠️ SHOWING SINGLE SECTOR (MULTIPLAYER) - Condition not met:', { allSaved, bothHaveValidNames });
    console.log('🎯 RENDERING SINGLE SECTOR (MULTIPLAYER)');
    
    const winner = player1Won ? player1Name || 'Jugador 1' : (player2Won ? player2Name || 'Jugador 2' : 'Empate');
    const winnerScore = player1Won ? score : score2;
    
    return (
      <div className={`${baseStyles.gameOverOverlay} ${baseStyles.multiplayerMode}`}>
            <div className={baseStyles.Kaiosama}></div>
        <video className={baseStyles.gameOverVideo} autoPlay loop muted playsInline>
          <source src={finalVideoSrc} type="video/mp4" />
          Tu navegador no soporta video en HTML5.
        </video>
        
        <div className={baseStyles.gameOverModal}>
          <div className={baseStyles.gameOverContent}>
            <div className={baseStyles.gameOverHeader}>
              <h1 className={`${baseStyles.gameOverTitle} ${!isTie ? baseStyles.win : ''}`}>
                {isTie ? "¡EMPATE!" : `¡GANÓ ${winner.toUpperCase()}!`}
              </h1>
              <p className={baseStyles.gameOverSubtitle}>
                {isTie ? `Ambos: ${score.toLocaleString()}` : `Score: ${winnerScore.toLocaleString()}`}
              </p>
            </div>

            {/* Información de scores para ambos jugadores */}
            <div className={styles.multiplayerScoreInfo}>
              <div className={styles.playerScore}>
                <div className={styles.playerName}>{player1Name || 'Jugador 1'}</div>
                <div className={styles.scoreValue}>{score.toLocaleString()}</div>
              </div>
              <div className={styles.scoreVs}>VS</div>
              <div className={styles.playerScore}>
                <div className={styles.playerName}>{player2Name || 'Jugador 2'}</div>
                <div className={styles.scoreValue}>{score2.toLocaleString()}</div>
              </div>
            </div>

            {/* Niveles alcanzados por jugador - mostrar dos sectores separados */}
            <div className={baseStyles.multiplayerLevelInfo}>
              <div className={baseStyles.levelSector}>
                <p>Nivel alcanzado (Jugador 1)</p>
                <div className={baseStyles.highlight}>{gameSpecificData.level1 ?? gameSpecificData.level ?? 1}</div>
              </div>
              <div className={baseStyles.levelSector}>
                <p>Nivel alcanzado (Jugador 2)</p>
                <div className={baseStyles.highlight}>{gameSpecificData.level2 ?? gameSpecificData.level ?? 1}</div>
              </div>
            </div>

            {/* Formularios para ingresar nombres -- ocultos para PPT */}
            {allowNameInput && gameType !== 'ppt' && (
              <form className={baseStyles.gameOverForm} onSubmit={(e) => e.preventDefault()}>
                <div className={baseStyles.inputGroup}>
                  <input
                    type="text"
                    placeholder="Nombre Jugador 1 (mín. 3 caracteres)..."
                    value={player1InputName}
                    onChange={(e) => setPlayer1InputName(e.target.value)}
                    onKeyDown={handleKeyDownP1}
                    maxLength={20}
                    className={baseStyles.gameOverInput}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveScore(1)}
                    disabled={!player1InputName.trim() || player1Saved}
                    className={baseStyles.gameOverButton}
                  >
                    {player1Saved ? 'Guardado' : (p1InputHasSaved ? 'Sobreescribir' : 'Guardar Puntaje')}
                  </button>
                </div>
                <div className={baseStyles.inputGroup}>
                  <input
                    type="text"
                    placeholder="Nombre Jugador 2 (mín. 3 caracteres)..."
                    value={player2InputName}
                    onChange={(e) => setPlayer2InputName(e.target.value)}
                    onKeyDown={handleKeyDownP2}
                    maxLength={20}
                    className={baseStyles.gameOverInput}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveScore(2)}
                    disabled={!player2InputName.trim() || player2Saved}
                    className={baseStyles.gameOverButton}
                  >
                    {player2Saved ? 'Guardado' : (p2InputHasSaved ? 'Sobreescribir' : 'Guardar Puntaje')}
                  </button>
                </div>
              </form>
            )}

            {/* Información específica del juego (omitida para SpaceInvaders y PPT en este layout) */}
            {(gameType !== 'spaceinvaders' && gameType !== 'ppt') && (
              <div className={baseStyles.gameSpecificContent}>
                {renderGameSpecificContent(gameType, gameSpecificData, baseStyles)}
              </div>
            )}

            {/* Acciones principales */}
            <div className={baseStyles.gameOverActions}>
              <button onClick={onRestart} className={baseStyles.gameOverButton}>
                Jugar de Nuevo
              </button>
              <button onClick={onBackToMenu} className={baseStyles.gameOverButton}>
                Salir al Menú
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default MultiplayerGameOver;