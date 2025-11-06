import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/PPT/PPT.module.css';
// PauseMenu is rendered by the PPT parent (piedrapapeltijeras.jsx) to avoid duplicates
import MultiplayerGameOver from '../../UI/MultiplayerGameOver.jsx';
import { usePPTSounds } from './usePPTSounds';

const MultiplayerGame = ({ onBack, player1Name = 'Jugador 1', player2Name = 'Jugador 2', showPauseMenu = false, onTogglePause = () => {}, onRequestClose = () => {}, registerReset = null, volume = 0.5, onVolumeChange }) => {
  // Estados de la lógica del juego (se actualizan inmediatamente)
  const [player1Lives, setPlayer1Lives] = useState(3);
  const [player2Lives, setPlayer2Lives] = useState(3);
  // Estados para controlar si terminó la animación de aparición de cada tarjeta
  const [p1AnimDone, setP1AnimDone] = useState(false);
  const [p2AnimDone, setP2AnimDone] = useState(false);
  

  const {
    playChoiceChosenSound,
    playHandGestureSounds,
    playResultSounds,
    playGokuWins,
    playGokuLoose,
    playVegetaWins,
    playVegetaLoose,
    playPPTLoose,
    playPPTDraw,
    playContinueGame,
    cleanup
  } = usePPTSounds(volume);

  // Refs to detect transitions
  const prevPlayer1Status = React.useRef('normal');
  const prevPlayer2Status = React.useRef('normal');
  const prevPlayer1VisualLives = React.useRef(3);
  const prevPlayer2VisualLives = React.useRef(3);

  // Determina el estado de cada elección para las tarjetas, solo si terminó la animación
  const getChoiceCardClass = (player) => {
    if (!showResult || !player1Choice || !player2Choice) return '';
    // Solo agregar clase si terminó la animación
    if ((player === 1 && !p1AnimDone) || (player === 2 && !p2AnimDone)) return '';
    if (player1Choice === player2Choice) return styles.choiceDraw;
    if (player === 1) {
      return ((player1Choice === 'piedra' && player2Choice === 'tijeras') ||
              (player1Choice === 'papel' && player2Choice === 'piedra') ||
              (player1Choice === 'tijeras' && player2Choice === 'papel'))
        ? styles.choiceWinner
        : styles.choiceLooser;
    } else {
      return ((player2Choice === 'piedra' && player1Choice === 'tijeras') ||
              (player2Choice === 'papel' && player1Choice === 'piedra') ||
              (player2Choice === 'tijeras' && player1Choice === 'papel'))
        ? styles.choiceWinner
        : styles.choiceLooser;
    }
  };
  
  // NUEVOS ESTADOS para el retraso visual de la barra de vida
  const [player1VisualLives, setPlayer1VisualLives] = useState(3);
  const [player2VisualLives, setPlayer2VisualLives] = useState(3);
  const [player1Choice, setPlayer1Choice] = useState(null);
  const [player2Choice, setPlayer2Choice] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [resultText, setResultText] = useState('');
  const [roundActive, setRoundActive] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [player1Status, setPlayer1Status] = useState('normal');
  const [player2Status, setPlayer2Status] = useState('normal');

  // Estados para manejar los IDs de los timeouts y poder limpiarlos
  const [resultTimeoutId, setResultTimeoutId] = useState(null);
  const [visualLivesTimeoutId, setVisualLivesTimeoutId] = useState(null);

  // --- Lógica de Pausa ---
  // Pause state is controlled by the parent component for multiplayer mode
  const [gameState, setGameState] = useState('playing');

  const choices = {
    piedra: 'https://emojiisland.com/cdn/shop/products/Fisted_Hand_Sign_Emoji_Icon_ios10_large.png?v=1571606090',
    papel: 'https://emojiisland.com/cdn/shop/products/Raised_Hand_With_Fingers_Splayed_Emoji_Icon_ios10.png?v=1571606092',
    tijeras: 'https://emojiisland.com/cdn/shop/products/Victory_Hand_Emoji_Icon_ios10_large.png?v=1571606113',
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignorar input si el juego está en pausa o terminado
      if (gameOver || showResult || showPauseMenu) {
        return;
      }

      const key = e.key.toUpperCase();
      
      if (!player1Choice && (window.innerWidth >= 768 || currentTurn === 1)) {
        if (key === 'Q') {
          setPlayer1Choice('piedra');
          playChoiceChosenSound();
          if (window.innerWidth < 768) setCurrentTurn(2);
        }
        else if (key === 'W') {
          setPlayer1Choice('papel');
          playChoiceChosenSound();
          if (window.innerWidth < 768) setCurrentTurn(2);
        }
        else if (key === 'E') {
          setPlayer1Choice('tijeras');
          playChoiceChosenSound();
          if (window.innerWidth < 768) setCurrentTurn(2);
        }
      }
      
      if (!player2Choice && (window.innerWidth >= 768 || currentTurn === 2)) {
        if (key === '7' || key === 'NUMPAD7') {
          setPlayer2Choice('piedra');
          playChoiceChosenSound();
          if (window.innerWidth < 768) setCurrentTurn(1);
        }
        else if (key === '8' || key === 'NUMPAD8') {
          setPlayer2Choice('papel');
          playChoiceChosenSound();
          if (window.innerWidth < 768) setCurrentTurn(1);
        }
        else if (key === '9' || key === 'NUMPAD9') {
          setPlayer2Choice('tijeras');
          playChoiceChosenSound();
          if (window.innerWidth < 768) setCurrentTurn(1);
        }
      }
    };
    // 2. Bloque de código erróneo eliminado de aquí
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [player1Choice, player2Choice, showResult, gameOver, currentTurn, showPauseMenu]);

  useEffect(() => {
    if (player1Choice && player2Choice && !showResult) {
      determineWinner();
    }
  }, [player1Choice, player2Choice]);

  const determineWinner = () => {
    setRoundActive(false);
    // Compute winner early and schedule sounds to play in sync with the result timeout
    let winnerType = null; // 'draw' or 'winner'
    let winnerIsPlayer1 = false;
    if (player1Choice === player2Choice) {
      winnerType = 'draw';
    } else if (
      (player1Choice === 'piedra' && player2Choice === 'tijeras') ||
      (player1Choice === 'papel' && player2Choice === 'piedra') ||
      (player1Choice === 'tijeras' && player2Choice === 'papel')
    ) {
      winnerType = 'winner';
      winnerIsPlayer1 = true;
    } else {
      winnerType = 'winner';
      winnerIsPlayer1 = false;
    }
    // This hook function will internally play after ~1s so it lines up with the visual update
    playResultSounds(winnerType, winnerIsPlayer1);
    
    // Almacenamos el ID del primer timeout (mostrar el texto de suspense)
    const resId = setTimeout(() => {
      setShowResult(true);
      
      // *** NUEVO: Mostramos el texto de suspense inmediatamente después del primer delay ***
      setResultText('El resultado es...'); 

      let finalResultText;
      let newLives1 = player1Lives;
      let newLives2 = player2Lives;
      let p1Status = 'normal';
      let p2Status = 'normal';

      if (player1Choice === player2Choice) {
        finalResultText = '¡EMPATE!';
      } else if (
        (player1Choice === 'piedra' && player2Choice === 'tijeras') ||
        (player1Choice === 'papel' && player2Choice === 'piedra') ||
        (player1Choice === 'tijeras' && player2Choice === 'papel')
      ) {
        // GANA JUGADOR 1
        finalResultText = `¡GANA ${player1Name.toUpperCase()}!`;
        p1Status = 'winning';
        p2Status = 'losing';
        newLives2 = player2Lives - 1;
      } else {
        // GANA JUGADOR 2
        finalResultText = `¡GANA ${player2Name.toUpperCase()}!`;
        p1Status = 'losing';
        p2Status = 'winning';
        newLives1 = player1Lives - 1;
      }
      
      // Almacenamos el ID del segundo timeout (actualizar resultado final y vidas)
      const visId = setTimeout(() => {
        // *** SEGUNDO DELAY (1000ms): Actualiza el texto de resultado final ***
        setResultText(finalResultText);

        // Actualiza el estado de los jugadores
        setPlayer1Status(p1Status);
        setPlayer2Status(p2Status);

        // Actualiza la lógica de las vidas
        setPlayer1Lives(newLives1); 
        setPlayer2Lives(newLives2); 

        // Actualiza la visualización de las vidas (el cambio de color)
        setPlayer1VisualLives(newLives1);
        setPlayer2VisualLives(newLives2);
        
        // Verifica Game Over
        if (newLives1 === 0) {
          setGameOver(true);
          setWinner(player2Name);
        } else if (newLives2 === 0) {
          setGameOver(true);
          setWinner(player1Name);
        }

        setVisualLivesTimeoutId(null); // Limpiar ID una vez ejecutado
      }, 1000); // 1 segundo de retraso para el feedback de resultado y vidas
      
      setVisualLivesTimeoutId(visId); // Guardamos el ID del visualLives timeout
      setResultTimeoutId(null); // Limpiar ID una vez ejecutado
    }, 500); // 0.5 segundo de retraso para el texto de suspense
    
    setResultTimeoutId(resId); // Guardamos el ID del result timeout
  };

  // Play HandGesture exactly when the choice appear animation starts (showResult becomes true)
  React.useEffect(() => {
    if (showResult && !gameOver) {
      // play gesture sounds twice in sync with animation
      playHandGestureSounds();
    }
  }, [showResult, gameOver, playHandGestureSounds]);

  // Play character sounds when their status class changes
  React.useEffect(() => {
    if (prevPlayer1Status.current !== player1Status) {
      if (player1Status === 'winning') playGokuWins();
      else if (player1Status === 'losing') playGokuLoose();
      prevPlayer1Status.current = player1Status;
    }
  }, [player1Status, playGokuWins, playGokuLoose]);

  React.useEffect(() => {
    if (prevPlayer2Status.current !== player2Status) {
      if (player2Status === 'winning') playVegetaWins();
      else if (player2Status === 'losing') playVegetaLoose();
      prevPlayer2Status.current = player2Status;
    }
  }, [player2Status, playVegetaWins, playVegetaLoose]);

  // Play PPTLoose when a health box is removed (visual lives decreases)
  React.useEffect(() => {
    if (prevPlayer1VisualLives.current > player1VisualLives) {
      playPPTLoose();
    }
    prevPlayer1VisualLives.current = player1VisualLives;
  }, [player1VisualLives, playPPTLoose]);

  React.useEffect(() => {
    if (prevPlayer2VisualLives.current > player2VisualLives) {
      playPPTLoose();
    }
    prevPlayer2VisualLives.current = player2VisualLives;
  }, [player2VisualLives, playPPTLoose]);

  // Play draw sound only when the visible result text updates to the EMPATE string
  React.useEffect(() => {
    if (resultText === '¡EMPATE!') {
      playPPTDraw();
    }
  }, [resultText, playPPTDraw]);

  const resetRound = () => {
    // *** CLAVE: Limpiar timeouts pendientes antes de resetear ***
    if (resultTimeoutId) clearTimeout(resultTimeoutId);
    if (visualLivesTimeoutId) clearTimeout(visualLivesTimeoutId);
    setResultTimeoutId(null);
    setVisualLivesTimeoutId(null);
    // ************************************************************

  setPlayer1Choice(null);
  setPlayer2Choice(null);
  setShowResult(false);
  setResultText('');
  setRoundActive(true);
  setCurrentTurn(1);
  setPlayer1Status('normal');
  setPlayer2Status('normal');
  setP1AnimDone(false);
  setP2AnimDone(false);
    
    // Se eliminó la sincronización de vidas visuales de aquí en la corrección anterior.
  };

useEffect(() => {
  if (showResult && !gameOver) {
    const handleNextRound = (e) => {
      // Ignorar 'Escape' para no interferir con la pausa
      if (e.key === 'Escape') return;

      // Play continue sound once when user advances the round
      try { playContinueGame(); } catch (err) {}

      resetRound();

      // Limpiar después de la primera interacción
      window.removeEventListener('keyup', handleNextRound);
      window.removeEventListener('click', handleNextRound);
    };

    // Esperar 1.5s antes de permitir avanzar (da tiempo a la animación)
    const delayId = setTimeout(() => {
      window.addEventListener('keyup', handleNextRound);
      window.addEventListener('click', handleNextRound);
    }, 1500);

    // Limpieza en caso de que el efecto se reinicie antes de los 1.5s
    return () => {
      clearTimeout(delayId);
      window.removeEventListener('keyup', handleNextRound);
      window.removeEventListener('click', handleNextRound);
    };
  }
}, [showResult, gameOver, player1Lives, player2Lives]);

// Cleanup PPT sound timeouts on unmount
useEffect(() => {
  return () => {
    cleanup();
  };
}, [cleanup]);

  const resetGame = useCallback(() => {
    // Close pause menu if open (ask parent to close), then resetea las vidas lógicas y visuales
    if (showPauseMenu && typeof onRequestClose === 'function') onRequestClose();
    setPlayer1Lives(3);
    setPlayer2Lives(3);
    setPlayer1VisualLives(3);
    setPlayer2VisualLives(3);

    setGameOver(false);
    setWinner(null);

    // Limpieza de timeouts pendientes y estados de la ronda.
    if (resultTimeoutId) clearTimeout(resultTimeoutId);
    if (visualLivesTimeoutId) clearTimeout(visualLivesTimeoutId);
    setResultTimeoutId(null);
    setVisualLivesTimeoutId(null);

    setPlayer1Choice(null);
    setPlayer2Choice(null);
    setShowResult(false);
    setResultText('');
    setRoundActive(true);
    setCurrentTurn(1);
    setPlayer1Status('normal');
    setPlayer2Status('normal');
    setP1AnimDone(false);
    setP2AnimDone(false);
  }, [showPauseMenu, onRequestClose, resultTimeoutId, visualLivesTimeoutId]);

  // If the parent wants to trigger the child's reset, register the reset function
  useEffect(() => {
    if (typeof registerReset === 'function') {
      try {
        registerReset(resetGame);
      } catch (e) {}
      return () => {
        try { registerReset(null); } catch (e) {}
      };
    }
  }, [registerReset, resetGame]);

  const handleChoiceClick = (choice, player) => {
    if (gameOver || showResult || showPauseMenu) return;
    
    if (player === 1 && !player1Choice && (window.innerWidth >= 768 || currentTurn === 1)) {
      setPlayer1Choice(choice);
      playChoiceChosenSound();
      if (window.innerWidth < 768) setCurrentTurn(2);
    } else if (player === 2 && !player2Choice && (window.innerWidth >= 768 || currentTurn === 2)) {
      setPlayer2Choice(choice);
      playChoiceChosenSound();
      if (window.innerWidth < 768) setCurrentTurn(1);
    }
  };

  if (gameOver) {
    return (
      <MultiplayerGameOver
        gameType="ppt"
        score={winner === player1Name ? player1Lives : 0} // Vidas restantes para el ganador, 0 para el perdedor
        score2={winner === player2Name ? player2Lives : 0}
        player1Name={player1Name}
        player2Name={player2Name}
        gameSpecificData={{
          rounds: 6 - (player1Lives + player2Lives) // Total de rondas jugadas
        }}
        onSaveScore={(data) => {
          // PPT multiplayer no guarda scores tradicionalmente
          console.log('PPT Multiplayer Game Over:', data);
        }}
        onRestart={resetGame}
        onBackToMenu={onBack}
      />
    );
  }

  // Se crea una clase dinámica para Player 1
  const p1ChoiceClass = player1Choice ? styles[`${player1Choice}Player1`] : '';
  // Se crea una clase dinámica para Player 2
  const p2ChoiceClass = player2Choice ? styles[`${player2Choice}Player2`] : '';

  return (
  <div className={styles.multiplayerContainer}>
      
      {/* JUGADOR 1 - Izquierda en PC, Abajo en Mobile */}
      <div className={`${styles.playerSection} ${styles.player1Section} ${
        (player1Choice && !showResult) || showPauseMenu ? styles.blurred : ''
      }`}>
        <div className={styles.playerSidebar}>
          <div className={styles.playerName}>{player1Name}</div>
          <div className={`${styles.playerImage} ${styles.player1Image} ${styles[player1Status]}`}>
            <div className={styles.goku}></div>
          </div>
{/* USAMOS player1VisualLives para la visualización con delay */}
<div className={`${styles.healthBar} ${player1VisualLives === 1 ? styles.lowLives : ''}`}>
  {[...Array(3)].map((_, i) => (
    <div
      key={i}
      className={`
        ${styles.healthBox}
        ${i < player1VisualLives ? styles.healthActive : ''}
        ${(i < player1VisualLives && player1VisualLives === 2) ? styles.yellow : ''}
        ${(i < player1VisualLives && player1VisualLives === 1) ? styles.red : ''}
      `}
    />
  ))}
</div>
          <div className={styles.optionsGrid}>
            <button 
              onClick={() => handleChoiceClick('piedra', 1)}
              className={styles.optionButton}
              disabled={player1Choice !== null || showPauseMenu}
            >
              <div className={styles.opcion} style={{ backgroundImage: `url(${choices.piedra})` }}></div>
              <span className={styles.optionLabel}>Q</span>
            </button>
            <button 
              onClick={() => handleChoiceClick('papel', 1)}
              className={styles.optionButton}
              disabled={player1Choice !== null || showPauseMenu}
            >
              <div className={styles.opcion} style={{ backgroundImage: `url(${choices.papel})` }}></div>
              <span className={styles.optionLabel}>W</span>
            </button>
            <button 
              onClick={() => handleChoiceClick('tijeras', 1)}
              className={styles.optionButton}
              disabled={player1Choice !== null || showPauseMenu}
            >
              <div className={styles.opcion} style={{ backgroundImage: `url(${choices.tijeras})` }}></div>
              <span className={styles.optionLabel}>E</span>
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA CENTRAL - Solo visible en PC con jugadas */}
      <div className={styles.centralBattleArea}>
        {showResult ? (
          <div className={styles.battleResult}>
            <div className={styles.vsContainer}>
                <div
                  className={`${styles.choiceCard} ${styles.choiceP1} ${p1ChoiceClass} ${getChoiceCardClass(1)}`}
                  onAnimationEnd={() => setP1AnimDone(true)}
                >
                  {/* Contenido de la elección de J1 */}
                </div>
                <div
                  className={`${styles.choiceCard} ${styles.choiceP2} ${p2ChoiceClass} ${getChoiceCardClass(2)}`}
                  onAnimationEnd={() => setP2AnimDone(true)}
                >
                  {/* Contenido de la elección de J2 */}
                </div>
            </div>
            <div className={styles.resultText}>{resultText}</div>
            <div className={styles.continueText}>Presiona cualquier tecla para continuar...</div>
          </div>
        ) : (
          <div className={styles.waitingBattle}>
            <p>Esperando selecciones...</p>
            {player1Choice && <p className={styles.readyIndicator}>{player1Name} listo</p>}
            {player2Choice && <p className={styles.readyIndicator}>{player2Name} listo</p>}
          </div>
        )}
      </div>

      {/* JUGADOR 2 - Derecha en PC, Arriba en Mobile */}
      <div className={`${styles.playerSection} ${styles.player2Section} ${
        (player2Choice && !showResult) || showPauseMenu ? styles.blurred : ''
      }`}>
        <div className={styles.playerSidebar}>
          <div className={styles.playerName}>{player2Name}</div>
          <div className={`${styles.playerImage} ${styles.player2Image} ${styles[player2Status]}`}>
            <div className={styles.vegeta}></div>
          </div>
{/* USAMOS player2VisualLives para la visualización con delay */}
<div className={`${styles.healthBar} ${player2VisualLives === 1 ? styles.lowLives : ''}`}>
  {[...Array(3)].map((_, i) => (
    <div
      key={i}
      className={`
        ${styles.healthBox}
        ${i < player2VisualLives ? styles.healthActive : ''}
        ${(i < player2VisualLives && player2VisualLives === 2) ? styles.yellow : ''}
        ${(i < player2VisualLives && player2VisualLives === 1) ? styles.red : ''}
      `}
    />
  ))}
</div>
          <div className={styles.optionsGrid}>
            <button 
              onClick={() => handleChoiceClick('piedra', 2)}
              className={styles.optionButton}
              disabled={player2Choice !== null || showPauseMenu}
            >
              <div className={styles.opcion} style={{ backgroundImage: `url(${choices.piedra})` }}></div>
              <span className={styles.optionLabel}>7</span>
            </button>
            <button 
              onClick={() => handleChoiceClick('papel', 2)}
              className={styles.optionButton}
              disabled={player2Choice !== null || showPauseMenu}
            >
              <div className={styles.opcion} style={{ backgroundImage: `url(${choices.papel})` }}></div>
              <span className={styles.optionLabel}>8</span>
            </button>
            <button 
              onClick={() => handleChoiceClick('tijeras', 2)}
              className={styles.optionButton}
              disabled={player2Choice !== null || showPauseMenu}
            >
              <div className={styles.opcion} style={{ backgroundImage: `url(${choices.tijeras})` }}></div>
              <span className={styles.optionLabel}>9</span>
            </button>
          </div>
        </div>
      </div>

      {/* Área de resultado mobile - Solo visible en mobile */}
      <div className={styles.mobileResultArea}>
        {showResult && (
            <div
              className={`${styles.mobileResult} ${p1ChoiceClass} ${p2ChoiceClass} ${getChoiceCardClass(1)} ${getChoiceCardClass(2)}`}
              onAnimationEnd={(e) => {
                // Detecta cuál terminó en mobile (ambos pueden disparar)
                if (e.target.classList.contains(styles.choiceP1)) setP1AnimDone(true);
                if (e.target.classList.contains(styles.choiceP2)) setP2AnimDone(true);
              }}
            >
            <div className={styles.resultText}>{resultText}</div>
            <div className={styles.continueText}>Toca para continuar</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerGame;