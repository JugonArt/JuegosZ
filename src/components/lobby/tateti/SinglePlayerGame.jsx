import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from '../../styles/tateti/tateti.module.css';
import PauseMenu from '../../UI/MenuPausa.jsx';
import { useTatetiSounds } from './useTatetiSounds';
import bgm from '../../../utils/backgroundMusic.js';

const winPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const SinglePlayerGame = ({ onBack, onBackToLobby, playerName = 'Jugador 1' }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X"); // X = Jugador, O = CPU
  const [winner, setWinner] = useState(null);
  const [winningPattern, setWinningPattern] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [gameState, setGameState] = useState('playing');
  const [cpuThinking, setCpuThinking] = useState(false);
  const [showingResult, setShowingResult] = useState(false);
  const [difficulty, setDifficulty] = useState('Medio'); // Fácil, Medio, Difícil
  const [isResetting, setIsResetting] = useState(false);
  const [autoResetScheduled, setAutoResetScheduled] = useState(false);
  const [scores, setScores] = useState({ player: 0, cpu: 0, draws: 0 });
  const [volume, setVolume] = useState(0.5);
  const [gameNumber, setGameNumber] = useState(1);
  const [autoResetTimeoutId, setAutoResetTimeoutId] = useState(null);
  const [animatingScore, setAnimatingScore] = useState(null); // 'player', 'cpu', 'draws', null
  const [changingOpponent, setChangingOpponent] = useState(false);
  const [shakingCell, setShakingCell] = useState(null);
  const { 
    playDrawSound, 
    playMachineWinsSound, 
    playPlayerWinsSound, 
    playPlacePieceSound, 
    playResetBoardSound,
    playWrongMoveSound,
    playMrSatanChosenSound,
    playTienChosenSound,
    playVegetaChosenSound,
    playScoreResetSound
  } = useTatetiSounds(volume);

  // Background music wiring: initialize manager and start playback
  // NOTE: Do NOT force-play music on mount. Playback is controlled by the
  // state-based effect below (prevShouldPlayRef) so we avoid unwanted
  // restarts when other props (eg. volume) change.
  useEffect(() => {
    try { bgm.init(); bgm.setVolume(volume); } catch (e) { /* ignore */ }
    // NOTE: do not call bgm.stop() in the cleanup here. React StrictMode may
    // mount/unmount components quickly during development which can trigger
    // an immediate stop() call right after play() was invoked from a user
    // gesture; that causes the music to stop unexpectedly. Higher-level
    // navigation/back handlers already stop the BGM when leaving the game.
    return () => {};
  }, []);

  // Keep volume in sync
  useEffect(() => {
    try { bgm.setVolume(volume); } catch (e) {}
  }, [volume]);

  // Play bgm when showPauseButton is true, gameState is 'playing', !gameOver,
  // or any combination of these conditions, unless music is muted
  const [musicMuted, setMusicMuted] = useState(false);
  const prevShouldPlayRef = useRef(null);

  useEffect(() => {
    // Play while the game is playing OR when the pause menu is open during a game.
    // This prevents opening the pause menu from stopping the music.
    const playingOrPaused = (gameState === 'playing') || showPauseMenu;
    const notGameOver = !gameOver;

    const shouldPlay = playingOrPaused && notGameOver && !musicMuted;
    const prev = prevShouldPlayRef.current;

    if (shouldPlay && !prev) {
      try { bgm.play(); } catch (e) { console.log('[BGM] play error', e); }
    } else if (!shouldPlay && prev) {
      // Use pause() instead of stop() so that the music can be resumed later.
      // stop() fully resets playback state (isPlaying=false) which prevents a
      // subsequent resume() from working; pause preserves the paused state.
      try { bgm.pause(); } catch (e) { console.log('[BGM] pause error', e); }
    }

    prevShouldPlayRef.current = shouldPlay;
  }, [gameState, gameOver, showPauseMenu, musicMuted]);

  // Handler used by PauseMenu to toggle music; sync with bgm state
  const handleToggleMusic = useCallback(() => {
    try {
      const state = bgm.getCurrentState();
      // Use isPaused to determine whether to resume or pause. isMuted
      // is a different semantic (mute) and shouldn't control pause/resume.
      if (state.isPaused) {
        bgm.resume();
        setMusicMuted(false);
      } else {
        bgm.pause();
        setMusicMuted(true);
      }
    } catch (e) {
      console.warn('[BGM] toggle failed', e);
    }
  }, [bgm]);

  // Mapeo de teclas a índices del tablero
  // Layout: 7 8 9
  //         4 5 6
  //         1 2 3
  const keyToIndex = {
    // Teclas numéricas superiores (usando e.key)
    '1': 6, '2': 7, '3': 8,
    '4': 3, '5': 4, '6': 5,
    '7': 0, '8': 1, '9': 2,
    // Teclado numérico (usando e.code)
    'Numpad1': 6, 'Numpad2': 7, 'Numpad3': 8,
    'Numpad4': 3, 'Numpad5': 4, 'Numpad6': 5,
    'Numpad7': 0, 'Numpad8': 1, 'Numpad9': 2
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignorar si no es el turno del jugador, está en pausa, hay ganador, CPU pensando, o está reseteando
      if (currentPlayer !== "X" || showPauseMenu || winner || cpuThinking || isResetting) return;

      // Primero intentar con e.code (para numpad), luego con e.key (para teclas normales)
      const key = e.key;
      const code = e.code;
      const index = keyToIndex[code] !== undefined ? keyToIndex[code] : keyToIndex[key];

      // Si la tecla no está en el mapeo, ignorar
      if (index === undefined) return;

      // Si la celda ya está ocupada, hacer shake y reproducir sonido de error
      if (board[index]) {
        setShakingCell(index);
        playWrongMoveSound();
        setTimeout(() => setShakingCell(null), 500);
        return;
      }

      // Hacer el movimiento
      handleClick(index);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [board, winner, showPauseMenu, currentPlayer, cpuThinking, isResetting]);

  // Función para obtener el nombre del oponente según la dificultad
  const getCpuName = () => {
    switch (difficulty) {
      case 'Fácil': return 'Mr. Satán';
      case 'Medio': return 'Ten Shin Han';
      case 'Difícil': return 'Vegeta';
      default: return 'Vegeta';
    }
  };

  // Función helper para formatear nombres
  const formatPlayerName = (isPlayer) => {
    if (isPlayer) {
      return playerName === 'Gokú' || playerName === 'Jugador 1' ? 'Gokú' : playerName;
    } else {
      return getCpuName();
    }
  };

  // Función para activar animación de puntaje
  const animateScoreIncrement = (scoreType) => {
    setAnimatingScore(scoreType);
    setTimeout(() => {
      setAnimatingScore(null);
    }, 2000); // Duración de la animación - 2 segundos
  };

  const togglePauseMenu = useCallback(() => {
    // Only toggle pause UI; don't flip gameState to 'paused' because that would
    // stop the central BGM. We want music to continue while the pause menu is open.
    setShowPauseMenu(prev => !prev);
  }, [showPauseMenu]);

  const checkWinner = (board) => {
    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], pattern };
      }
    }
    if (board.every(Boolean)) {
      return { winner: "Empate", pattern: [] };
    }
    return null;
  };

  const getBestMove = (board) => {
    const available = board.map((cell, i) => cell === null ? i : null).filter(i => i !== null);
    
    // Dificultad Fácil - Jugadas aleatorias
    if (difficulty === 'Fácil') {
      return available[Math.floor(Math.random() * available.length)];
    }
    
    // Dificultad Medio - Estrategia básica
    if (difficulty === 'Medio') {
      // 1. Ganar si es posible
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          const testBoard = [...board];
          testBoard[i] = "O";
          if (checkWinner(testBoard)?.winner === "O") {
            return i;
          }
        }
      }

      // 2. Bloquear al jugador si va a ganar (solo 70% de las veces)
      if (Math.random() < 0.7) {
        for (let i = 0; i < 9; i++) {
          if (!board[i]) {
            const testBoard = [...board];
            testBoard[i] = "X";
            if (checkWinner(testBoard)?.winner === "X") {
              return i;
            }
          }
        }
      }

      // 3. Movimiento aleatorio
      return available[Math.floor(Math.random() * available.length)];
    }
    
    // Dificultad Difícil - Estrategia avanzada
    if (difficulty === 'Difícil') {
      // 1. Ganar si es posible
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          const testBoard = [...board];
          testBoard[i] = "O";
          if (checkWinner(testBoard)?.winner === "O") {
            return i;
          }
        }
      }

      // 2. Bloquear al jugador si va a ganar
      for (let i = 0; i < 9; i++) {
        if (!board[i]) {
          const testBoard = [...board];
          testBoard[i] = "X";
          if (checkWinner(testBoard)?.winner === "X") {
            return i;
          }
        }
      }

      // 3. Tomar el centro si está disponible
      if (!board[4]) return 4;

      // 4. Tomar una esquina
      const corners = [0, 2, 6, 8];
      const availableCorners = corners.filter(i => !board[i]);
      if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
      }

      // 5. Tomar cualquier casilla disponible
      return available[Math.floor(Math.random() * available.length)];
    }
  };

  const handleClick = (index) => {
    if (board[index] || winner || currentPlayer !== "X" || cpuThinking || showPauseMenu) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    playPlacePieceSound();

    const gameResult = checkWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult.winner);
      setWinningPattern(gameResult.pattern);
      setGameOver(true);
      
      // Actualizar puntuaciones con animación
      setScores(prev => {
        if (gameResult.winner === "Empate") {
          animateScoreIncrement('draws');
          playDrawSound();
          return { ...prev, draws: prev.draws + 1 };
        } else if (gameResult.winner === "X") {
          animateScoreIncrement('player');
          playPlayerWinsSound();
          return { ...prev, player: prev.player + 1 };
        } else {
          animateScoreIncrement('cpu');
          playMachineWinsSound();
          return { ...prev, cpu: prev.cpu + 1 };
        }
      });
    } else {
      setCurrentPlayer("O");
    }
  };

  // Efecto para el turno de la CPU
  useEffect(() => {
    if (currentPlayer === "O" && !winner && !showPauseMenu) {
      setCpuThinking(true);
      const timer = setTimeout(() => {
        const cpuMove = getBestMove(board);
        if (cpuMove !== undefined) {
          const newBoard = [...board];
          newBoard[cpuMove] = "O";
          setBoard(newBoard);
          playPlacePieceSound();

          const gameResult = checkWinner(newBoard);
          if (gameResult) {
            setWinner(gameResult.winner);
            setWinningPattern(gameResult.pattern);
            setGameOver(true);
            
            // Actualizar puntuaciones con animación
            setScores(prev => {
              if (gameResult.winner === "Empate") {
                animateScoreIncrement('draws');
                playDrawSound();
                return { ...prev, draws: prev.draws + 1 };
              } else if (gameResult.winner === "X") {
                animateScoreIncrement('player');
                playPlayerWinsSound();
                return { ...prev, player: prev.player + 1 };
              } else {
                animateScoreIncrement('cpu');
                playMachineWinsSound();
                return { ...prev, cpu: prev.cpu + 1 };
              }
            });
          } else {
            setCurrentPlayer("X");
          }
        }
        setCpuThinking(false);
      }, 800); // Delay para simular pensamiento

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, board, winner, showPauseMenu]);

  const renderMarker = (cell, index) => {
    if (!cell) return null;

    const isWinnerCell = winningPattern.includes(index);
    let winnerClass = "";
    let markerClass = "";

    if (cell === "X") {
      markerClass = styles["marker-X"];
      winnerClass = isWinnerCell ? styles.winnerGoku : "";
    } else {
      // Para la ficha O (CPU), usar la clase según la dificultad
      if (difficulty === 'Fácil') {
        markerClass = styles["marker-O-MrSatan"];
        winnerClass = isWinnerCell ? styles.winnerMrSatan : "";
      } else if (difficulty === 'Medio') {
        markerClass = styles["marker-O-TenShinHan"];
        winnerClass = isWinnerCell ? styles.winnerTenShinHan : "";
      } else { // Difícil
        markerClass = styles["marker-O-Vegeta"];
        winnerClass = isWinnerCell ? styles.winnerVegeta : "";
      }
    }

    const className = `${styles.marker} ${markerClass} ${winnerClass}`;

    return <div className={className}></div>;
  };

  const getStatusText = () => {
    if (cpuThinking) return "CPU está pensando...";
    if (!winner) {
      const cpuCharacter = difficulty === 'Fácil' ? 'Mr. Satan' : 
                          difficulty === 'Medio' ? 'Ten Shin Han' : 'Vegeta';
      return currentPlayer === "X" ? `Turno de ${playerName} (Gokú)` : `Turno del CPU (${cpuCharacter}) - ${difficulty}`;
    }
    if (winner === "Empate") return "¡Empate!";
    if (winner === "X") return `¡${playerName} (Gokú) GANA!`;
    
    const cpuCharacter = difficulty === 'Fácil' ? 'Mr. Satan' : 
                        difficulty === 'Medio' ? 'Ten Shin Han' : 'Vegeta';
    return `¡CPU (${cpuCharacter}) GANA!`;
  };

  const getResultText = () => {
    if (!winner) return "";
    
    if (winner === "Empate") return "¡EMPATE!";
    
    if (winner === "X") {
      // Jugador gana
      if (playerName === 'Jugador 1' || !playerName) {
        return "¡GANA GOKÚ!";
      } else {
        return `¡GANA ${playerName.toUpperCase()}!`;
      }
    } else {
      // CPU gana
      const cpuCharacter = difficulty === 'Fácil' ? 'MR. SATAN' : 
                          difficulty === 'Medio' ? 'TEN SHIN HAN' : 'VEGETA';
      return `¡GANA ${cpuCharacter}!`;
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningPattern([]);
    setGameOver(false);
    setShowingResult(false);
    setCpuThinking(false);
    setIsResetting(false);
    setAutoResetScheduled(false);
    setGameNumber(prev => prev + 1);
  };

  const resetBoardOnly = () => {
    // Solo resetear el tablero, mantener todo lo demás igual
    playResetBoardSound();
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X"); // Siempre volver a empezar con X (jugador)
    setWinner(null);
    setWinningPattern([]);
    setGameOver(false);
    setShowingResult(false);
    setCpuThinking(false);
    setIsResetting(false);
    setAutoResetScheduled(false);
    // NO cambiar: gameNumber, scores, difficulty
  };

  const resetGameWithAnimation = () => {
    // Evitar múltiples resets simultáneos
    if (isResetting || autoResetScheduled) return;
    
    setIsResetting(true);
    setCpuThinking(false); // Detener pensamiento de CPU si está activo
    
    setTimeout(() => {
      resetBoardOnly(); // Usar resetBoardOnly en lugar de resetGame
    }, 1200); // Duración de la animación
  };

  const nextGameWithAnimation = () => {
    // Para auto-reset después de ganar/perder/empatar
    if (isResetting || autoResetScheduled) return;
    
    setIsResetting(true);
    setCpuThinking(false);
    
    setTimeout(() => {
      resetGame(); // SÍ incrementar contador para nueva partida
    }, 1200);
  };

  const changeDifficulty = (newDifficulty) => {
    // Cancelar auto-reset programado si existe
    if (autoResetTimeoutId) {
      clearTimeout(autoResetTimeoutId);
      setAutoResetTimeoutId(null);
    }
    
    // Reproducir el sonido correspondiente a la dificultad seleccionada
    if (newDifficulty === 'Fácil') {
      playMrSatanChosenSound();
    } else if (newDifficulty === 'Medio') {
      playTienChosenSound();
    } else if (newDifficulty === 'Difícil') {
      playVegetaChosenSound();
    }
    
    // Activar animación de cambio de oponente
    setChangingOpponent(true);
    
    setTimeout(() => {
      setDifficulty(newDifficulty);
      // Reiniciar scoreboard al cambiar dificultad
      setScores({ player: 0, cpu: 0, draws: 0 });
      setGameNumber(1);
      
      setTimeout(() => {
        setChangingOpponent(false);
      }, 150); // Terminar la animación después de un breve delay
    }, 150); // Cambiar los valores después de fade out
    // Si hay un juego en progreso, reiniciarlo SIN incrementar contador
    if (board.some(cell => cell !== null)) {
      setBoard(Array(9).fill(null));
      setCurrentPlayer("X");
      setWinner(null);
      setWinningPattern([]);
      setGameOver(false);
      setShowingResult(false);
      setCpuThinking(false);
      setIsResetting(false);
      setAutoResetScheduled(false);
      // NO llamar a resetGame() para evitar incrementar gameNumber
    }
  };

  const resetScore = () => {
    // Cancelar auto-reset programado si existe
    if (autoResetTimeoutId) {
      clearTimeout(autoResetTimeoutId);
      setAutoResetTimeoutId(null);
    }
    
    playScoreResetSound();
    
    setScores({ player: 0, cpu: 0, draws: 0 });
    setGameNumber(1);
    setShowingResult(false);
    setAutoResetScheduled(false);
    // Resetear el juego SIN incrementar contador
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningPattern([]);
    setGameOver(false);
    setCpuThinking(false);
    setIsResetting(false);
    // NO llamar a resetGame() para evitar incrementar gameNumber
  };

  if (gameOver) {
    // Auto-reset después de mostrar el resultado brevemente
    if (!showingResult && !autoResetScheduled && !isResetting) {
      setShowingResult(true);
      setAutoResetScheduled(true);
      const timeoutId = setTimeout(() => {
        setShowingResult(false);
        nextGameWithAnimation(); // Usar nextGameWithAnimation para incrementar contador
        setAutoResetTimeoutId(null); // Limpiar el timeout ID
      }, 2000);
      setAutoResetTimeoutId(timeoutId); // Almacenar el timeout ID para poder cancelarlo
    }
  }

  return (
    <div className={styles.singlePlayerContainer}>
      <PauseMenu
        showPauseButton={true}
        showPauseMenu={showPauseMenu}
        onTogglePause={togglePauseMenu}
        onBackToMenu={onBackToLobby}
        onResetGame={resetGameWithAnimation}
        onBackToPlayerSelect={() => onBack('playerSelect')}
        enableEsc={!gameOver || showPauseMenu} // Habilitar ESC si no hay gameOver O si el menú está abierto
        volume={volume}
        onVolumeChange={setVolume}
        musicMuted={musicMuted}
        onToggleMusic={handleToggleMusic}
      />
      <div className={styles.radarContainer}>
      <div className={styles.radarBackground}/>
      <div className={styles.boardContainer}>
        <h1 className={styles.gameTitle}>Ta-Te-Ti - Un Jugador</h1>
        
        {/* Cuadrícula 7x7 del radar */}
        <div className={styles.radarGrid}>
          {Array.from({ length: 49 }, (_, i) => (
            <div key={i} className={styles.gridLine}></div>
          ))}
        </div>
        
        {/* Tablero de juego 3x3 en el centro */}
        <div className={`${styles.board} ${isResetting ? styles.boardResetting : ''}`}>
          {board.map((cell, i) => {
            // Mapear índice a número de tecla para mostrar
            const indexToKey = {
              0: '7', 1: '8', 2: '9',
              3: '4', 4: '5', 5: '6',
              6: '1', 7: '2', 8: '3'
            };
            
            return (
              <button
                key={i}
                className={`${styles.cell} ${isResetting ? styles.cellResetting : ''} ${cpuThinking || showPauseMenu ? styles.disabled : ''} ${shakingCell === i ? styles.shakeCell : ''}`}
                onClick={() => handleClick(i)}
                disabled={cpuThinking || showPauseMenu || isResetting}
              >
                {renderMarker(cell, i)}
                {!cell && !winner && !isResetting && currentPlayer === "X" && (
                  <span className={styles.keyHint}>{indexToKey[i]}</span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Texto de resultado */}
        {gameOver && winner && !isResetting && (
          <div className={styles.resultText}>
            {getResultText()}
          </div>
        )}
        
        <p className={styles.status}>{getStatusText()}</p>
      </div>
      </div>
      {/* Sector izquierdo: Scoreboard */}
      <div className={styles.sectorizquierdo}>
        <span className={styles.gameNumberTitle}>Partida {gameNumber}</span>
        <div className={styles.scoreBoard}>
          <div className={styles.playerScore}>
            <span className={currentPlayer === "X" ? styles.activePlayer : ""}>
              {formatPlayerName(true)}: <div className={animatingScore === 'player' ? styles.scoreIncrement : styles.scoreNumber}>{scores.player}</div>
            </span>
          </div>
          <div className={styles.gameInfo}>
            <span>
              Empates: <div className={animatingScore === 'draws' ? styles.scoreIncrement : styles.scoreNumber}>{scores.draws}</div>
            </span>
          </div>
          <div className={`${styles.playerScore} ${changingOpponent ? styles.changingOpponent : ''}`}>
            <span className={currentPlayer === "O" ? styles.activePlayer : ""}>
              {formatPlayerName(false)}: <div className={animatingScore === 'cpu' ? styles.scoreIncrement : styles.scoreNumber}>{scores.cpu}</div>
            </span>
          </div>
        </div>
        <button onClick={resetScore} className={styles.scoreResetBtn}>
          Resetear puntuaciones
        </button>
      </div>
      
      {/* Sector derecho: Controles del juego */}
      <div className={styles.sectorderecho}>
        <div className={styles.gameControls}>
          <button onClick={resetGameWithAnimation} className={styles.resetBtn}>
            Reiniciar tablero
          </button>
          <button onClick={() => onBack('playerSelect')} className={styles.resetBtn}>
            Cambiar nombres
          </button>
        </div>
      </div>
      
      {/* Sector central abajo: Botones de dificultad */}
      <div className={styles.difficultySelectorBottom}>
        <div className={styles.difficultyTitle}>Dificultad:</div>
        <div className={styles.difficultyButtonsRow}>
          <button 
            onClick={() => changeDifficulty('Fácil')} 
            className={`${styles.resetBtn} ${styles.difficultyButton} ${difficulty === 'Fácil' ? styles.activePlayer : ''}`}
            style={{ 
              borderColor: difficulty === 'Fácil' ? '#00ff62ff' : 'rgba(0, 0, 0, 0.7)',
              fontSize: '0.9em',
              padding: '0.8vw 1.5vw',
              minWidth: '12vw'
            }}
          >
            <div className={`${styles.difficultyIcon} ${styles.MrSatanIcon}`}></div>
            Fácil
          </button>
          <button 
            onClick={() => changeDifficulty('Medio')} 
            className={`${styles.resetBtn} ${styles.difficultyButton} ${difficulty === 'Medio' ? styles.activePlayer : ''}`}
            style={{ 
              borderColor: difficulty === 'Medio' ? '#ff9800' : 'rgba(0, 0, 0, 0.7)',
              fontSize: '0.9em',
              padding: '0.8vw 1.5vw',
              minWidth: '12vw'
            }}
          >
            <div className={`${styles.difficultyIcon} ${styles.TenShinHanIcon}`}></div>
            Medio
          </button>
          <button 
            onClick={() => changeDifficulty('Difícil')} 
            className={`${styles.resetBtn} ${styles.difficultyButton} ${difficulty === 'Difícil' ? styles.activePlayer : ''}`}
            style={{ 
              borderColor: difficulty === 'Difícil' ? '#f44336' : 'rgba(0, 0, 0, 0.7)',
              fontSize: '0.9em',
              padding: '0.8vw 1.5vw',
              minWidth: '12vw'
            }}
          >
            <div className={`${styles.difficultyIcon} ${styles.VegetaIcon}`}></div>
            Difícil
          </button>
        </div>
      </div>
    </div>
  );
};

export default SinglePlayerGame;