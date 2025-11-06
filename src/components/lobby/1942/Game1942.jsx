import React, { useState, useEffect, useCallback } from 'react';
import MainMenu from './MainMenu.jsx';
import SinglePlayerGameOver from '../../UI/SinglePlayerGameOver.jsx';
import PauseMenu from '../../UI/MenuPausa.jsx'
import GameHUD from './GameHUD.jsx';
import GameArea from './GameArea.jsx';
import MobileControls from './MobileControls.jsx';
import useGameLoop from '../../../hooks1942/useGameLoop.js';
import useKeyboard from '../../../hooks1942/useKeyboard.js';
import useSoundEffects from '../../../utils1942/useSoundEffects.js';
import useMobileDetection from '../../../hooks1942/useMobileDetection.js';
import useMobileControls from '../../../hooks1942/useMobileControls.js';
import {
  INITIAL_PLAYER_STATE,
  GAME_WIDTH,
  GAME_HEIGHT,
} from "../../../utils1942/constants";
import styles from '../../styles/1942/GameHud.module.css';

const Game1942 = ({ onSaveScore1942, getTopScores1942, onBack }) => {
  const [gameState, setGameState] = useState("menu");
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [gameMode, setGameMode] = useState("single");
  const [score, setScore] = useState(0);
  const [score2, setScore2] = useState(0);
  const [level, setLevel] = useState(1);
  const [volume, setVolume] = useState(0.5); 
  const [player1, setPlayer1] = useState(INITIAL_PLAYER_STATE);
  const [player2, setPlayer2] = useState({ ...INITIAL_PLAYER_STATE, x: 450 });
  
  // Estados para nombres de jugadores
  const [player1Name, setPlayer1Name] = useState('Jugador 1');
  const [player2Name, setPlayer2Name] = useState('Jugador 2');

  const [isNewGame, setIsNewGame] = useState(false);

  // --- NUEVOS HOOKS PARA RESPONSIVIDAD ---
  const { isMobile } = useMobileDetection();
  const { mobileKeys, handleControlPress, handleControlRelease } =
    useMobileControls(gameState);

  const togglePause = useCallback(() => {
    setShowPauseMenu(prev => !prev);
  }, []);

  // Sincronizar gameState con showPauseMenu
  useEffect(() => {
    if (showPauseMenu && gameState === "playing") {
      setGameState("paused");
    } else if (!showPauseMenu && gameState === "paused") {
      setGameState("playing");
    }
  }, [showPauseMenu, gameState]);

  const keys = useKeyboard(gameState, setGameState, togglePause);
  const { playSound } = useSoundEffects();

  // --- COMBINAR TECLADO Y CONTROLES TÁCTILES ---
  const combinedKeys = isMobile ? mobileKeys : keys;

  const gameData = useGameLoop(gameState, gameMode, combinedKeys, {
  player1,
    setPlayer1,
    player2,
    setPlayer2,
    score,
    setScore,
    score2,
    setScore2,
    level,
    setLevel,
    setGameState,
    playSound,
  });


    const { resetLoopState } = gameData;
  const [gameScale, setGameScale] = useState(1);
  const calculateScale = useCallback(() => {
    // --- LÓGICA DE ESCALADO ADAPTATIVA ---
    if (isMobile) {
      // En móvil, queremos que el juego llene la pantalla.
      const isLandscape = window.innerWidth > window.innerHeight;
      // En landscape, intercambiamos ancho y alto para el cálculo.
      const gameW = isLandscape ? GAME_HEIGHT : GAME_WIDTH;
      const gameH = isLandscape ? GAME_WIDTH : GAME_HEIGHT;
      
      const scaleX = window.innerWidth / gameW;
      const scaleY = window.innerHeight / gameH;
      setGameScale(Math.min(scaleX, scaleY));
    } else {
      // Lógica original para escritorio.
      const scaleX = window.innerWidth / GAME_WIDTH;
      const scaleY = (window.innerHeight - 80) / GAME_HEIGHT;
      setGameScale(Math.min(scaleX, scaleY, 1));
    }
  }, [isMobile]);
 // 💡 NUEVA FUNCIÓN para reiniciar el juego que usará MenuPausa
  const restartGame = () => {
    // Cerrar el menú de pausa antes de reiniciar para que el botón tenga efecto visual
    setShowPauseMenu(false);
    // Resetear loop e estado local
    resetLoopState(); // 👈 Resetea enemigos, balas, power-ups y spawn state.
    resetGameState(); // Resetea el estado local del componente (score, level, players).
    // Reiniciar el juego (inicia el loop)
    setGameState("playing");
  };

  // 💡 NUEVA FUNCIÓN para cambiar el volumen (placeholder)
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    // Lógica para aplicar el nuevo volumen a los efectos/música
    // ...
  };

  // 💡 NUEVA FUNCIÓN para pantalla completa (placeholder)
  const toggleFullScreen = () => {
    // Lógica para alternar pantalla completa
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error al habilitar pantalla completa: ${err.message}`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, [calculateScale]);

  const startGame = (mode, name1 = 'Jugador 1', name2 = 'Jugador 2') => {
    // Forzar modo single-player en móviles
    const finalMode = isMobile ? "single" : mode;
    setGameMode(finalMode);
    setIsNewGame(true);
    setPlayer1Name(name1);
    setPlayer2Name(name2);
    resetGameState();
    setGameState("playing");
    playSound("intro");
  };

  const resetGameState = () => {
    setScore(0);
    setScore2(0);
    setLevel(1);
    const resetPlayer1 = {
      ...INITIAL_PLAYER_STATE,
      x: 500, y: 600, lives: 3, fireMode: "single", wingmen: [], loopCount: 3, isLooping: false,
    };
    const resetPlayer2 = {
      ...INITIAL_PLAYER_STATE,
      x: 450, y: 600, lives: 3, fireMode: "single", wingmen: [], loopCount: 3, isLooping: false,
    };
    setPlayer1(resetPlayer1);
    setPlayer2(resetPlayer2);
  };

useEffect(() => {
    if (isNewGame && gameState === "playing") {
      setIsNewGame(false);
    }
  }, [isNewGame, gameState]);

const backToMenu = useCallback(() => {
  if (onBack) {
    onBack(); // 👈 vuelve al lobby global
  } else {
    setGameState("menu"); // fallback al menú interno de 1942
  }
}, [onBack]);

const backToPlayerSelect = useCallback(() => {
  resetLoopState();
  resetGameState();
  setGameState("menu");
}, [resetLoopState]);
  
  if (gameState === "menu") {
    return (
      <MainMenu
        onStartGame={startGame}
        onBack={onBack}
        isMobile={isMobile}
        getTopScores1942={getTopScores1942} 
      />
    );
  }

  if (gameState === "gameOver") {
    if (gameMode === 'single') {
      return (
        <SinglePlayerGameOver
          gameType="1942"
          isWin={false} // En 1942 siempre es game over por derrota
          score={score}
          playerName={player1Name}
          gameSpecificData={{
            level: level,
            enemiesDestroyed: 0, // Valor por defecto si no se trackea
            powerUpsCollected: 0 // Valor por defecto si no se trackea
          }}
          onSaveScore={(data) => {
            onSaveScore1942(
              Date.now().toString(),
              data.name,
              data.score
            );
            backToMenu();
          }}
          onRestart={() => startGame(gameMode, player1Name, player2Name)}
          onBackToMenu={backToMenu}
        />
      );
    } else {
      // Para multiplayer, importar y usar MultiplayerGameOver cuando sea necesario
      return (
        <SinglePlayerGameOver
          gameType="1942"
          isWin={false}
          score={Math.max(score, score2)}
          playerName={score > score2 ? player1Name : player2Name}
          gameSpecificData={{
            level: level,
            enemiesDestroyed: 0, // Valor por defecto si no se trackea
            powerUpsCollected: 0 // Valor por defecto si no se trackea
          }}
          onSaveScore={(data) => {
            // Guardar ambos scores
            onSaveScore1942(Date.now().toString() + "-1", player1Name, score);
            onSaveScore1942(Date.now().toString() + "-2", player2Name, score2);
            backToMenu();
          }}
          onRestart={() => startGame(gameMode, player1Name, player2Name)}
          onBackToMenu={backToMenu}
        />
      );
    }
  }

  // --- NUEVA ESTRUCTURA DE RENDERIZADO ---
  // Un div principal que ocupa toda la pantalla para posicionar todo.
  return (
    <div className={`${styles.gameWrapper} ${isMobile ? styles.mobile : styles.desktop}`}>
      <GameHUD
        gameMode={gameMode} score={score} score2={score2} level={level}
        player1={player1} player2={player2} enemyCount={gameData.enemies.length}
        currentWave={gameData.currentWave} wavesThisLevel={gameData.wavesThisLevel}
        powerUpCount={gameData.powerUps.length}
        isMobile={isMobile} // Pasar prop para estilos responsivos
        player1Name={player1Name} player2Name={player2Name}
      />
      <div
        className={styles.gameContainer}
        style={{
          transform: `scale(${gameScale})`,
          transformOrigin: "center center", // Centrar siempre
        }}
      >
        <GameArea
          gameMode={gameMode} gameData={gameData}
          player1={player1} player2={player2} level={level}
          enemiesKilled={gameData.enemiesKilled}
        />
      </div>

      {(showPauseMenu || gameState === "playing") && ( // Renderizar siempre para la animación de salida
<PauseMenu
  showPauseButton={gameState === "playing"}
  showPauseMenu={showPauseMenu}
  gameState={gameState}
  volume={volume}
  onTogglePause={togglePause}
  onBackToMenu={backToMenu}   // 👈 ahora funciona igual que en SpaceInvaders
  onToggleFullScreen={toggleFullScreen}
  onResetGame={restartGame}
  onVolumeChange={handleVolumeChange}
  onBackToPlayerSelect={backToPlayerSelect}
  enableEsc={gameState === "playing" || showPauseMenu} // Habilitar ESC durante juego y cuando menú está abierto
/>
      )}
      {/* --- RENDERIZADO CONDICIONAL DE CONTROLES --- */}
      {isMobile && (
        <MobileControls
          onControlPress={handleControlPress}
          onControlRelease={handleControlRelease}
          onTogglePause={togglePause}
          gameState={gameState}
        />
      )}

      {/* La leyenda de controles solo se muestra en escritorio */}
      {!isMobile && (
        <div className={`${styles.legend} ${styles.textWhite} ${styles.mt4} ${styles.textCenter} ${styles.textXs} ${styles.opacity70} ${styles.maxW4xl}`}>
          {gameMode === "single" ? (
            <p>WASD: mover • Q: disparar • Shift Izq: loop • ESC: pausa</p>
          ) : (
            <p>P1: WASD + Q + Shift Izq • P2: Flechas + Espacio + Ctrl Der • ESC: pausa</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Game1942;