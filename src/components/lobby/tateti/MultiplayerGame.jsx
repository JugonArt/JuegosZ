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

const MultiplayerGame = ({ onBack, onBackToLobby, player1Name = 'Jugador 1', player2Name = 'Jugador 2' }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X"); // X = Jugador 1, O = Jugador 2
  const [winner, setWinner] = useState(null);
  const [winningPattern, setWinningPattern] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [gameState, setGameState] = useState('playing');
  const [scores, setScores] = useState({ player1: 0, player2: 0, draws: 0 });
  const [gameNumber, setGameNumber] = useState(1);
  const [player1IsX, setPlayer1IsX] = useState(true); // true = player1 es X, false = player1 es O
  const [showingResult, setShowingResult] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isResetting, setIsResetting] = useState(false);
  const [autoResetScheduled, setAutoResetScheduled] = useState(false);
  const [autoResetTimeoutId, setAutoResetTimeoutId] = useState(null);
  const [animatingScore, setAnimatingScore] = useState(null); // 'player1', 'player2', 'draws', null
  const [shakingCell, setShakingCell] = useState(null);
  const [musicMuted, setMusicMuted] = useState(false);
  const { 
    playDrawSound, 
    playMachineWinsSound, 
    playPlayerWinsSound, 
    playPlacePieceSound, 
    playResetBoardSound,
    playWrongMoveSound,
    playScoreResetSound
  } = useTatetiSounds(volume);

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
      // Ignorar si está en pausa, hay ganador, o está reseteando
      if (showPauseMenu || winner || isResetting) return;

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
  }, [board, winner, showPauseMenu, currentPlayer, isResetting]);

  // Handler used by PauseMenu to toggle music; sync with bgm state
  const handleToggleMusic = useCallback(() => {
    try {
      const state = bgm.getCurrentState();
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

  // Background music wiring: initialize manager and start playback
  // NOTE: Avoid forcing playback on mount. Initialize bgm and let the
  // state-driven effect (below) decide when to play/stop.
  useEffect(() => {
    try { bgm.init(); bgm.setVolume(volume); } catch (e) { /* ignore */ }
    // Avoid calling bgm.stop() during cleanup for the same reason as
    // SinglePlayerGame: React StrictMode (dev) may trigger an extra
    // unmount which would stop playback immediately after a user-initiated
    // play(). Navigation handlers will stop BGM when appropriate.
    return () => {};
  }, []);

  // Keep volume in sync
  useEffect(() => {
    try { bgm.setVolume(volume); } catch (e) {}
  }, [volume]);

  // Control bgm based on game state & mute
  // Track previous state to avoid unnecessary BGM restarts
  const prevPlayStateRef = useRef(false);
  useEffect(() => {
    // Game is considered "active" when playing and not game over
    const isGameActive = (gameState === 'playing') && !gameOver;
    const shouldPlay = isGameActive && !musicMuted;

    // Only take action if the play state has changed
    if (shouldPlay !== prevPlayStateRef.current) {
      try {
        if (shouldPlay) bgm.play();
        else {
          // Pause rather than stop so the BGM can be resumed later by the
          // pause menu toggle. stop() resets playback state preventing resume.
          bgm.pause();
        }
        prevPlayStateRef.current = shouldPlay;
      } catch (e) {
        console.warn('[BGM] play/pause error:', e);
      }
    }
  }, [gameState, gameOver, musicMuted]);

  const togglePauseMenu = useCallback(() => {
    // Only toggle the pause UI. Avoid flipping gameState to 'paused' so BGM
    // playback logic elsewhere doesn't stop the music when pausing.
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

  const handleClick = (index) => {
    if (board[index] || winner || showPauseMenu) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    playPlacePieceSound();

    const gameResult = checkWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult.winner);
      setWinningPattern(gameResult.pattern);
      setGameOver(true);
      
      // Actualizar puntuaciones basándose en quién es qué jugador
      setScores(prev => {
        const isPlayer1Winner = (player1IsX && gameResult.winner === "X") || (!player1IsX && gameResult.winner === "O");
        if (gameResult.winner === "Empate") {
          animateScoreIncrement('draws');
          playDrawSound();
          return { ...prev, draws: prev.draws + 1 };
        } else if (isPlayer1Winner) {
          animateScoreIncrement('player1');
          playPlayerWinsSound();
          return { ...prev, player1: prev.player1 + 1 };
        } else {
          animateScoreIncrement('player2');
          playPlayerWinsSound(); // En multiplayer, ambos jugadores usan el sonido de victoria de jugador
          return { ...prev, player2: prev.player2 + 1 };
        }
      });
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  };

  const renderMarker = (cell, index) => {
    if (!cell) return null;

    const isWinnerCell = winningPattern.includes(index);
    const winnerClass =
      isWinnerCell
        ? cell === "X"
          ? styles.winnerGoku
          : styles.winnerVegeta
        : "";

    // Determinar qué icono mostrar basándose en quién es cada jugador actualmente
    let markerClass;
    if (cell === "X") {
      // Si X es Player1, mostrar Gokú, si X es Player2, mostrar Vegeta
      markerClass = player1IsX ? styles["marker-X"] : styles["marker-O"];
    } else {
      // Si O es Player1, mostrar Gokú, si O es Player2, mostrar Vegeta
      markerClass = player1IsX ? styles["marker-O"] : styles["marker-X"];
    }

    const className = `${styles.marker} ${markerClass} ${winnerClass}`;

    return <div className={className}></div>;
  };

  // Función helper para formatear nombres sin duplicación
  const formatPlayerName = (playerName, isPlayer1) => {
    // Para jugadores invitados, siempre usar solo los personajes originales sin paréntesis
    if (playerName === 'Jugador 1' || playerName === 'Jugador 2' || 
        playerName === 'Gokú' || playerName === 'Vegeta') {
      return isPlayer1 ? 'Gokú' : 'Vegeta';
    }
    // Para nombres personalizados, mostrar "Nombre (Personaje FIJO)"
    // Player1 siempre es Gokú, Player2 siempre es Vegeta en los nombres mostrados
    const fixedCharacter = isPlayer1 ? 'Gokú' : 'Vegeta';
    return `${playerName} (${fixedCharacter})`;
  };

  // Función para activar animación de puntaje
  const animateScoreIncrement = (scoreType) => {
    setAnimatingScore(scoreType);
    setTimeout(() => {
      setAnimatingScore(null);
    }, 2000); // Duración de la animación - 2 segundos
  };

  const getStatusText = () => {
    if (!winner) {
      const isPlayer1Turn = (player1IsX && currentPlayer === "X") || (!player1IsX && currentPlayer === "O");
      
      return isPlayer1Turn 
        ? `Turno de ${formatPlayerName(player1Name, true)}` 
        : `Turno de ${formatPlayerName(player2Name, false)}`;
    }
    if (winner === "Empate") return "¡Empate!";
    
    const isPlayer1Winner = (player1IsX && winner === "X") || (!player1IsX && winner === "O");
    
    if (isPlayer1Winner) {
      return `¡${formatPlayerName(player1Name, true)} GANA!`;
    }
    return `¡${formatPlayerName(player2Name, false)} GANA!`;
  };

  const getResultText = () => {
    if (!winner) return "";
    
    if (winner === "Empate") return "¡EMPATE!";
    
    const isPlayer1Winner = (player1IsX && winner === "X") || (!player1IsX && winner === "O");
    
    if (isPlayer1Winner) {
      // Player 1 gana
      if (player1Name === 'Jugador 1' || !player1Name) {
        const character = player1IsX ? 'GOKÚ' : 'VEGETA';
        return `¡GANA ${character}!`;
      } else {
        return `¡GANA ${player1Name.toUpperCase()}!`;
      }
    } else {
      // Player 2 gana
      if (player2Name === 'Jugador 2' || !player2Name) {
        const character = player1IsX ? 'VEGETA' : 'GOKÚ';
        return `¡GANA ${character}!`;
      } else {
        return `¡GANA ${player2Name.toUpperCase()}!`;
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X"); // Siempre X empieza, pero quién es X cambia cada partida
    setWinner(null);
    setWinningPattern([]);
    setGameOver(false);
    setGameNumber(prev => prev + 1);
    setIsResetting(false);
    setAutoResetScheduled(false);
  };

  const resetBoardOnly = () => {
    // Solo resetear el tablero, mantener todo lo demás igual
    playResetBoardSound();
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X"); // Volver al jugador que debería empezar según player1IsX actual
    setWinner(null);
    setWinningPattern([]);
    setGameOver(false);
    setIsResetting(false);
    setAutoResetScheduled(false);
    // NO cambiar: gameNumber, scores, player1IsX (mantener el turno actual)
  };

  const resetGameWithAnimation = () => {
    // Evitar múltiples resets simultáneos
    if (isResetting || autoResetScheduled) return;
    
    setIsResetting(true);
    
    setTimeout(() => {
      resetBoardOnly(); // Usar resetBoardOnly en lugar de resetGame
    }, 1200); // Duración de la animación
  };

  const playAnotherGame = () => {
    // Evitar múltiples resets simultáneos
    if (isResetting || autoResetScheduled) return;
    
    setIsResetting(true);
    
    setTimeout(() => {
      // Intercambiar roles de los jugadores ANTES de resetear
      setPlayer1IsX(prev => !prev);
      setShowingResult(false);
      setIsResetting(false);
      setAutoResetScheduled(false);
      // Ahora resetear el juego (X siempre empieza, pero quién es X ha cambiado)
      setBoard(Array(9).fill(null));
      setCurrentPlayer("X"); 
      setWinner(null);
      setWinningPattern([]);
      setGameOver(false);
      setGameNumber(prev => prev + 1);
    }, 1200);
  };

  const resetScore = () => {
    // Cancelar auto-reset programado si existe
    if (autoResetTimeoutId) {
      clearTimeout(autoResetTimeoutId);
      setAutoResetTimeoutId(null);
    }
    
    playScoreResetSound();
    
    setScores({ player1: 0, player2: 0, draws: 0 });
    setGameNumber(1);
    setPlayer1IsX(true); // Resetear a la configuración inicial
    setShowingResult(false);
    setAutoResetScheduled(false);
    // Resetear el juego SIN incrementar contador
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningPattern([]);
    setGameOver(false);
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
        playAnotherGame();
        setAutoResetTimeoutId(null); // Limpiar el timeout ID
      }, 2000);
      setAutoResetTimeoutId(timeoutId); // Almacenar el timeout ID para poder cancelarlo
    }
  }

  return (
    <div className={styles.multiplayerContainer}>
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
        <h1 className={styles.gameTitle}>Ta-Te-Ti - Dos Jugadores</h1>
        
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
                className={`${styles.cell} ${isResetting ? styles.cellResetting : ''} ${showPauseMenu ? styles.disabled : ''} ${shakingCell === i ? styles.shakeCell : ''}`}
                onClick={() => handleClick(i)}
                disabled={showPauseMenu || isResetting}
              >
                {renderMarker(cell, i)}
                {!cell && !winner && !isResetting && (
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
      <div className={styles.sectorizquierdo}>
            <span className={styles.gameNumberTitle}>Partida {gameNumber}</span>
        <div className={styles.scoreBoard}>
          <div className={styles.playerScore}>
            <span className={((player1IsX && currentPlayer === "X") || (!player1IsX && currentPlayer === "O")) ? styles.activePlayer : ""}>
              {formatPlayerName(player1Name, true)}: <div className={animatingScore === 'player1' ? styles.scoreIncrement : styles.scoreNumber}>{scores.player1}</div>
            </span>
          </div>
          <div className={styles.gameInfo}>
            <span>
              Empates: <div className={animatingScore === 'draws' ? styles.scoreIncrement : styles.scoreNumber}>{scores.draws}</div>
            </span>
          </div>
          <div className={styles.playerScore}>
            <span className={((player1IsX && currentPlayer === "O") || (!player1IsX && currentPlayer === "X")) ? styles.activePlayer : ""}>
              {formatPlayerName(player2Name, false)}: <div className={animatingScore === 'player2' ? styles.scoreIncrement : styles.scoreNumber}>{scores.player2}</div>
            </span>
          </div>
        </div>
        <button onClick={resetScore} className={styles.scoreResetBtn}>
          Resetear puntuaciones
        </button>
      </div>
      
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
    </div>
  );
};

export default MultiplayerGame;