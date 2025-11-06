import { useState, useEffect, useRef } from 'react';
import baseStyles from '../styles/GameOver/GameOverBase.module.css';
import styles from '../styles/GameOver/SinglePlayerGameOver.module.css';
import Toast from './Toast';
import { 
  getGameConfig, 
  isValidPlayerName, 
  renderGameSpecificContent,
  getPersonalizedTitle,
  getPersonalizedSubtitle,
  createSaveScoreHandler
} from './gameOverUtils';
import { validatePlayerName, formatValidationErrors } from '../../utils/scoreValidation';
import { 
  getSpaceInvadersScoreByName, 
  getSimonDiceScoreByName,
  getSpaceInvadersRanking,
  getSimonDiceRanking
} from '../../utils/scoreDatabase';

const SinglePlayerGameOver = ({ 
  // Información básica
  gameType,           // 'spaceinvaders', '1942', 'simondice', 'ppt'
  isWin = false,      // true si ganó, false si perdió
  
  // Score
  score = 0,          // Score del jugador
  
  // Información específica del juego
  gameSpecificData = {}, // Datos específicos: {level, round, lives, etc}
  
  // Nombre del jugador
  playerName = '',
  
  // Callbacks
  onSaveScore,        // función para guardar scores
  onRestart,          // función para reiniciar
  onBackToMenu,       // función para volver al menú
  
  // Configuración
  allowNameInput = true,    // permitir ingresar nombres
  
  // Video personalizado (opcional)
  videoSrc
}) => {
  const [playerInputName, setPlayerInputName] = useState('');
  const [playerSaved, setPlayerSaved] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [existingNameHasSaved, setExistingNameHasSaved] = useState(false);
  const [inputNameHasSaved, setInputNameHasSaved] = useState(false);
  const [toastData, setToastData] = useState(null);
  
  const gameOverAudioRef = useRef(null);
  const saveSoundRef = useRef(null);

  const config = getGameConfig(gameType);
  const hasExistingName = isValidPlayerName(playerName);
  const finalVideoSrc = videoSrc || config.videoSrc;

  // Reproducir sonido de Game Over cuando se monta el componente
  useEffect(() => {
    gameOverAudioRef.current = new Audio('/sounds/LobbySounds/GameOver.mp3');
    gameOverAudioRef.current.volume = 0.6;
    gameOverAudioRef.current.play().catch(err => console.warn('Error playing GameOver sound:', err));
    
    saveSoundRef.current = new Audio('/sounds/LobbySounds/GameSelector.mp3');
    saveSoundRef.current.volume = 0.6;
  }, []);

  // Función para verificar ranking y mostrar toast
  const checkRankingAndShowToast = async (savedPlayerName) => {
    try {
      let position = null;
      let gameName = '';

      if (gameType === 'spaceinvaders' || gameType === '1942') {
        position = await getSpaceInvadersRanking(savedPlayerName);
        gameName = 'Space Invaders';
      } else if (gameType === 'simondice') {
        position = await getSimonDiceRanking(savedPlayerName);
        gameName = 'Simon Dice';
      }

      // Solo mostrar toast si está en top 3
      if (position && position <= 3) {
        setToastData({
          playerName: savedPlayerName,
          position: position,
          gameName: gameName
        });
      }
    } catch (error) {
      console.warn('Error checking ranking:', error);
    }
  };

  // Handler para guardar score
  const handleSaveScore = createSaveScoreHandler(onSaveScore, setPlayerSaved);

  // Guardar score con nombre ingresado
  const handleSaveWithInput = async () => {
    setValidationError('');
    
    // Validate name
    const validation = validatePlayerName(playerInputName);
    if (!validation.valid) {
      setValidationError(formatValidationErrors(validation.errors));
      return;
    }

    // Reproducir sonido al hacer click en guardar
    if (saveSoundRef.current) {
      saveSoundRef.current.currentTime = 0;
      saveSoundRef.current.play().catch(err => console.warn('Error playing save sound:', err));
    }

    setIsSaving(true);
    try {
      await handleSaveScore({
        playerNum: 1,
        name: validation.sanitized,
        score,
        gameType,
        gameMode: 'single',
        gameSpecificData,
        isWin
      });
      // Verificar ranking y mostrar toast si es top 3
      await checkRankingAndShowToast(validation.sanitized);
    } catch (error) {
      setValidationError(error.message || 'Error al guardar el puntaje');
      setPlayerSaved(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para Enter key en input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && playerInputName.trim() && !playerSaved && !isSaving) {
      e.preventDefault();
      handleSaveWithInput();
    }
  };

  // Guardar score con nombre existente
  const handleSaveWithExistingName = async () => {
    if (hasExistingName && onSaveScore) {
      setValidationError('');
      
      // Reproducir sonido al hacer click en guardar/sobreescribir
      if (saveSoundRef.current) {
        saveSoundRef.current.currentTime = 0;
        saveSoundRef.current.play().catch(err => console.warn('Error playing save sound:', err));
      }
      
      setIsSaving(true);
      try {
        await onSaveScore({
          name: playerName,
          score,
          gameType,
          gameMode: 'single',
          gameSpecificData,
          isWin
        });
        setPlayerSaved(true);
        // Verificar ranking y mostrar toast si es top 3
        await checkRankingAndShowToast(playerName);
      } catch (error) {
        setValidationError(error.message || 'Error al guardar el puntaje');
        setPlayerSaved(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Detect if current names already have saved scores to adjust button labels
  useEffect(() => {
    let cancelled = false;
    const checkExisting = async () => {
      if (gameType === 'ppt') return; // PPT doesn't save
      if (!hasExistingName) { setExistingNameHasSaved(false); return; }
      try {
        let exists = false;
        if (gameType === 'spaceinvaders' || gameType === '1942') {
          // For now, treat '1942' like spaceinvaders if present in future
          const rec = await getSpaceInvadersScoreByName(playerName);
          exists = !!rec;
        } else if (gameType === 'simondice') {
          const rec = await getSimonDiceScoreByName(playerName);
          exists = !!rec;
        }
        if (!cancelled) setExistingNameHasSaved(exists);
      } catch (_) {
        if (!cancelled) setExistingNameHasSaved(false);
      }
    };
    checkExisting();
    return () => { cancelled = true; };
  }, [playerName, gameType, hasExistingName]);

  useEffect(() => {
    let cancelled = false;
    const checkInput = async () => {
      if (gameType === 'ppt') return;
      const name = playerInputName.trim();
      if (!name) { setInputNameHasSaved(false); return; }
      try {
        let exists = false;
        if (gameType === 'spaceinvaders' || gameType === '1942') {
          const rec = await getSpaceInvadersScoreByName(name);
          exists = !!rec;
        } else if (gameType === 'simondice') {
          const rec = await getSimonDiceScoreByName(name);
          exists = !!rec;
        }
        if (!cancelled) setInputNameHasSaved(exists);
      } catch (_) {
        if (!cancelled) setInputNameHasSaved(false);
      }
    };
    checkInput();
    return () => { cancelled = true; };
  }, [playerInputName, gameType]);

  return (
    <div className={`${baseStyles.gameOverOverlay} ${baseStyles.singleplayerMode}`}>
      {/* Video seguro: si falla, simplemente no se muestra para evitar errores de "no supported source" */}
      {finalVideoSrc && (
        <video
          className={baseStyles.gameOverVideo}
          autoPlay
          loop
          muted
          playsInline
          onError={(e) => {
            // Ocultar el elemento de video si hay error de carga
            try { e.currentTarget.style.display = 'none' } catch (_) {}
            console.warn('GameOver video failed to load:', finalVideoSrc)
          }}
        >
          <source src={finalVideoSrc} type="video/mp4" />
          Tu navegador no soporta video en HTML5.
        </video>
      )}
            <div className={baseStyles.Kaiosama}></div>
      <div className={baseStyles.gameOverModal}>
        <div className={styles.singlePlayerContent}>
          <div className={baseStyles.gameOverHeader}>
            <h1 className={`${baseStyles.gameOverTitle} ${isWin ? baseStyles.win : baseStyles.lose}`}>
              {getPersonalizedTitle(config, isWin, playerName, 'single', true)}
            </h1>
            <p className={baseStyles.gameOverSubtitle}>
              {getPersonalizedSubtitle(config, isWin, hasExistingName, playerName, 'single', true)}
            </p>
          </div>

          {/* Información de score (o Ronda/Nivel para SimonDice). PPT mostrará "Vidas restantes" en lugar de Score y no ofrecerá guardado. */}
          {gameType === 'simondice' ? (
            <div className={`${styles.scoreInfo} ${!isWin ? styles.lose : ''}`}>
              <div style={{display:'flex',gap:'1rem',justifyContent:'center',alignItems:'center'}}>
                <div style={{flex:1}}>
                  <p>Ronda</p>
                  <div className={styles.scoreValue}>{gameSpecificData.round ?? 1}</div>
                </div>
                <div style={{flex:1}}>
                  <p>Nivel</p>
                  <div className={styles.scoreValue}>{gameSpecificData.level ?? 1}</div>
                </div>
              </div>
            </div>
          ) : gameType === 'ppt' ? (
            <div className={`${styles.scoreInfo} ${!isWin ? styles.lose : ''}`}>
              <p>{isWin ? 'Vidas restantes' : 'Vidas restantes del enemigo'}</p>
              <div className={styles.scoreValue}>{
                isWin ? (gameSpecificData.playerLives ?? (gameSpecificData.opponentLives ?? 0)) : (gameSpecificData.opponentLives ?? 0)
              }</div>
            </div>
          ) : (
            <div className={`${styles.scoreInfo} ${!isWin ? styles.lose : ''}`}>
              <p>Score Final</p>
              <div className={styles.scoreValue}>{score.toLocaleString()}</div>
            </div>
          )}

          {/* Formulario para ingresar nombre (si no hay nombre existente). Desactivado para PPT */}
          {gameType !== 'ppt' && !hasExistingName && allowNameInput && (
            <form className={baseStyles.gameOverForm} onSubmit={(e) => e.preventDefault()}>
              <div className={baseStyles.inputGroup}>
                <input
                  type="text"
                  placeholder="Ingresa tu nombre (mín. 3 caracteres)..."
                  value={playerInputName}
                  onChange={(e) => {
                    setPlayerInputName(e.target.value);
                    setValidationError(''); // Clear error on typing
                  }}
                  onKeyDown={handleKeyDown}
                  maxLength={20}
                  className={baseStyles.gameOverInput}
                  disabled={playerSaved || isSaving}
                />
                <button
                  type="button"
                  onClick={handleSaveWithInput}
                  disabled={!playerInputName.trim() || playerSaved || isSaving}
                  className={baseStyles.gameOverButton}
                >
                  {isSaving ? 'Guardando...' : playerSaved ? 'Guardado' : (inputNameHasSaved ? 'Sobreescribir' : 'Guardar Puntaje')}
                </button>
              </div>
              {validationError && (
                <div className={baseStyles.errorMessage}>
                  {validationError}
                </div>
              )}
            </form>
          )}

          {/* Botón para guardar con nombre existente */}
          {gameType !== 'ppt' && hasExistingName && (
            <div className={baseStyles.gameOverActions}>
              <button 
                onClick={handleSaveWithExistingName}
                disabled={playerSaved || isSaving}
                className={baseStyles.gameOverButton}
              >
                {isSaving ? 'Guardando...' : playerSaved ? 'Puntaje Guardado' : (existingNameHasSaved ? 'Sobreescribir' : 'Guardar Puntaje')}
              </button>
              {validationError && (
                        <div className={baseStyles.errorMessage}>
                  {validationError}
                </div>
              )}
            </div>
          )}

          {/* Contenido específico del juego */}
          {gameType === 'simondice' ? (
            <div className={baseStyles.gameSpecificContent}>
              <div className={baseStyles.gameSpecificInfo}>
                <p>Patrones completados: <span className={baseStyles.highlight}>{gameSpecificData.patterns ?? 0}</span></p>
              </div>
            </div>
          ) : gameType === 'ppt' ? (
            /* Para PPT no mostramos información adicional (rondas/duelo), ya mostramos "Vidas restantes" arriba */
            null
          ) : (
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

      {/* Toast notification for top 3 */}
      {toastData && (
        <Toast 
          playerName={toastData.playerName}
          position={toastData.position}
          gameName={toastData.gameName}
          onClose={() => setToastData(null)}
        />
      )}
    </div>
  );
};

export default SinglePlayerGameOver;