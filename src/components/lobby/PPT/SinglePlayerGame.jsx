import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/PPT/PPT.module.css';
import PauseMenu from '../../UI/MenuPausa.jsx';
import { useBGM } from '../../../utils/bgmManager';
import SinglePlayerGameOver from '../../UI/SinglePlayerGameOver.jsx';
import { usePPTSounds } from './usePPTSounds';

const choices = {
  piedra: 'https://emojiisland.com/cdn/shop/products/Fisted_Hand_Sign_Emoji_Icon_ios10_large.png?v=1571606090',
  papel: 'https://emojiisland.com/cdn/shop/products/Raised_Hand_With_Fingers_Splayed_Emoji_Icon_ios10.png?v=1571606092',
  tijeras: 'https://emojiisland.com/cdn/shop/products/Victory_Hand_Emoji_Icon_ios10_large.png?v=1571606113',
};

function getRandomChoice() {
  const arr = Object.keys(choices);
  return arr[Math.floor(Math.random() * arr.length)];
}

const SinglePlayerGame = ({ onBack, playerName = 'Jugador 1', volume = 0.5, onVolumeChange }) => {
// ...existing code...
  const [player1Lives, setPlayer1Lives] = useState(3);
  const [cpuLives, setCpuLives] = useState(3);
  const [player1VisualLives, setPlayer1VisualLives] = useState(3);
  const [cpuVisualLives, setCpuVisualLives] = useState(3);
  const [player1Choice, setPlayer1Choice] = useState(null);
  const [cpuChoice, setCpuChoice] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [resultText, setResultText] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [player1Status, setPlayer1Status] = useState('normal');
  const [cpuStatus, setCpuStatus] = useState('normal');
  const [p1AnimDone, setP1AnimDone] = useState(false);
  const [cpuAnimDone, setCpuAnimDone] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const bgm = useBGM();
  const [gameState, setGameState] = useState('playing');
  const [resultTimeoutId, setResultTimeoutId] = useState(null);
  const [visualLivesTimeoutId, setVisualLivesTimeoutId] = useState(null);

  const togglePauseMenu = useCallback(() => {
    // Only toggle pause UI; avoid changing gameState to 'paused' so BGM
    // remains playing while the pause menu is visible.
    setShowPauseMenu(prev => !prev);
  }, [showPauseMenu]);

  // Sync music state and allow pause/resume from this child
  useEffect(() => {
    try {
      const state = bgm.getCurrentState();
      // Reflect paused state in the local toggle UI (isPaused indicates pause)
      setMusicMuted(!!state.isPaused);
    } catch (e) { /* ignore */ }
  }, [bgm]);

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
    } catch (e) { console.warn('Error toggling music:', e); }
  }, [bgm]);

  // Sounds for singleplayer (use default 0.5 volume multiplier)
  const {
    playHandGestureSounds,
    playAndroid16Loose,
    playPPTLoose,
    playPPTDraw,
    playChoiceChosenSound,
    playGokuWins,
    playGokuLoose,
    playContinueGame,
  } = usePPTSounds(volume);

  const prevCpuVisualLives = React.useRef(3);
  const prevCpuStatus = React.useRef('normal');
  const prevPlayerVisualLives = React.useRef(3);
  const prevPlayerStatus = React.useRef('normal');

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver || showResult || showPauseMenu) {
        return;
      }
      const key = e.key.toUpperCase();
      if (!player1Choice) {
        if (key === 'Q') {
          playChoiceChosenSound();
          setPlayer1Choice('piedra');
        } else if (key === 'W') {
          playChoiceChosenSound();
          setPlayer1Choice('papel');
        } else if (key === 'E') {
          playChoiceChosenSound();
          setPlayer1Choice('tijeras');
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [player1Choice, showResult, gameOver, showPauseMenu, togglePauseMenu, playChoiceChosenSound]);

  // Play draw sound when resultText explicitly becomes the EMPATE string
  useEffect(() => {
    if (resultText === '¡EMPATE!') {
      playPPTDraw();
    }
  }, [resultText, playPPTDraw]);

  useEffect(() => {
    if (player1Choice && !showResult) {
      setCpuChoice(getRandomChoice());
    }
  }, [player1Choice]);

  useEffect(() => {
    if (player1Choice && cpuChoice && !showResult) {
      determineWinner();
    }
  }, [player1Choice, cpuChoice]);

  // Play hand gesture when choice appear animation starts (showResult true)
  useEffect(() => {
    if (showResult && !gameOver) {
      playHandGestureSounds();
    }
  }, [showResult, gameOver, playHandGestureSounds]);

  const determineWinner = () => {
    // Animación de suspense
    const resId = setTimeout(() => {
      setShowResult(true);
      setResultText('El resultado es...');
      let finalResultText;
      let newLives1 = player1Lives;
      let newLives2 = cpuLives;
      let p1Status = 'normal';
      let cpuStat = 'normal';
      if (player1Choice === cpuChoice) {
        finalResultText = '¡EMPATE!';
      } else if (
        (player1Choice === 'piedra' && cpuChoice === 'tijeras') ||
        (player1Choice === 'papel' && cpuChoice === 'piedra') ||
        (player1Choice === 'tijeras' && cpuChoice === 'papel')
      ) {
        finalResultText = `¡GANASTE ${playerName.toUpperCase()}!`;
        p1Status = 'winning';
        cpuStat = 'losing';
        newLives2 = cpuLives - 1;
      } else {
        finalResultText = `¡PERDISTE ${playerName.toUpperCase()}!`;
        p1Status = 'losing';
        cpuStat = 'winning';
        newLives1 = player1Lives - 1;
      }
      const visId = setTimeout(() => {
        setResultText(finalResultText);
        setPlayer1Status(p1Status);
        setCpuStatus(cpuStat);
        setPlayer1Lives(newLives1);
        setCpuLives(newLives2);
        setPlayer1VisualLives(newLives1);
        setCpuVisualLives(newLives2);
        if (newLives1 === 0) {
          setGameOver(true);
          setWinner('CPU');
        } else if (newLives2 === 0) {
          setGameOver(true);
          setWinner(playerName);
        }
        setVisualLivesTimeoutId(null);
      }, 1000);
      setVisualLivesTimeoutId(visId);
      setResultTimeoutId(null);
    }, 500);
    setResultTimeoutId(resId);
  };

  const resetRound = () => {
    if (resultTimeoutId) clearTimeout(resultTimeoutId);
    if (visualLivesTimeoutId) clearTimeout(visualLivesTimeoutId);
    setResultTimeoutId(null);
    setVisualLivesTimeoutId(null);
    setPlayer1Choice(null);
    setCpuChoice(null);
    setShowResult(false);
    setResultText('');
    setPlayer1Status('normal');
    setCpuStatus('normal');
    setP1AnimDone(false);
    setCpuAnimDone(false);
  };

  // Play Android16Loose when PlayerCPUDamaged class is added (cpuVisualLives drops to <=2)
useEffect(() => {
  // Only play when lives drop from 3 to 2 (when .PlayerCPUDamaged is first added)
  if (prevCpuVisualLives.current === 3 && cpuVisualLives === 2) {
    playAndroid16Loose();
  }
}, [cpuVisualLives, playAndroid16Loose]);

  // Play PPTLoose when a health box is removed for CPU
  useEffect(() => {
    if (prevCpuVisualLives.current > cpuVisualLives) {
      playPPTLoose();
    }
    prevCpuVisualLives.current = cpuVisualLives;
  }, [cpuVisualLives, playPPTLoose]);

  // Play PPTLoose and Goku win/lose when a health box is removed for the PLAYER
  useEffect(() => {
    if (prevPlayerVisualLives.current > player1VisualLives) {
      // play generic life-lost sound
      playPPTLoose();
    }
    prevPlayerVisualLives.current = player1VisualLives;
  }, [player1VisualLives, playPPTLoose]);

  // Play Goku win/lose when player1Status class changes (sync with class addition)
  useEffect(() => {
    if (prevPlayerStatus.current !== player1Status) {
      if (player1Status === 'winning') playGokuWins();
      else if (player1Status === 'losing') playGokuLoose();
      prevPlayerStatus.current = player1Status;
    }
  }, [player1Status, playGokuWins, playGokuLoose]);

  useEffect(() => {
    if (showResult && !gameOver) {
      const handleNextRound = (e) => {
        if (e.key === "Escape") return;
        // Play continue sound once when user advances the round
        try { playContinueGame(); } catch (err) {}
        resetRound();
        window.removeEventListener('keyup', handleNextRound);
        window.removeEventListener('click', handleNextRound);
      };
      const delayId = setTimeout(() => {
        window.addEventListener('keyup', handleNextRound);
        window.addEventListener('click', handleNextRound);
      }, 1500);
      return () => {
        clearTimeout(delayId);
        window.removeEventListener('keyup', handleNextRound);
        window.removeEventListener('click', handleNextRound);
      };
    }
  }, [showResult, gameOver, player1Lives, cpuLives]);

  const resetGame = () => {
    setPlayer1Lives(3);
    setCpuLives(3);
    setPlayer1VisualLives(3);
    setCpuVisualLives(3);
    setGameOver(false);
    setWinner(null);
    if (resultTimeoutId) clearTimeout(resultTimeoutId);
    if (visualLivesTimeoutId) clearTimeout(visualLivesTimeoutId);
    setResultTimeoutId(null);
    setVisualLivesTimeoutId(null);
    setPlayer1Choice(null);
    setCpuChoice(null);
    setShowResult(false);
    setResultText('');
    setPlayer1Status('normal');
    setCpuStatus('normal');
    setP1AnimDone(false);
    setCpuAnimDone(false);
    if (showPauseMenu) togglePauseMenu();
  };

  // Play immediate choice sound when a choice is made (click)
  const handleChoiceClickWithSound = (choice) => {
    if (gameOver || showResult || showPauseMenu) return;
    if (!player1Choice) {
      playChoiceChosenSound();
      setPlayer1Choice(choice);
    }
  };

  // Clases dinámicas
  const p1ChoiceClass = player1Choice ? styles[`${player1Choice}Player1`] : '';
  const cpuChoiceClass = cpuChoice ? styles[`${cpuChoice}CPU`] : '';

  if (gameOver) {
    return (
      <SinglePlayerGameOver
        gameType="ppt"
        isWin={winner === playerName}
        score={0} // PPT no tiene score numérico
        playerName={playerName}
        gameSpecificData={{
          opponentLives: cpuLives,
          playerLives: player1Lives,
          rounds: 3 - player1Lives // Rondas completadas
        }}
        onSaveScore={(data) => {
          // PPT no guarda scores tradicionalmente
          console.log('PPT Game Over:', data);
        }}
        onRestart={resetGame}
        onBackToMenu={onBack}
      />
    );
  }

  // Animación de resultado
  const getChoiceCardClass = (player) => {
    if (!showResult || !player1Choice || !cpuChoice) return '';
    if ((player === 1 && !p1AnimDone) || (player === 2 && !cpuAnimDone)) return '';
    if (player1Choice === cpuChoice) return styles.choiceDraw;
    if (player === 1) {
      return ((player1Choice === 'piedra' && cpuChoice === 'tijeras') ||
              (player1Choice === 'papel' && cpuChoice === 'piedra') ||
              (player1Choice === 'tijeras' && cpuChoice === 'papel'))
        ? styles.choiceWinner
        : styles.choiceLooser;
    } else {
      return ((cpuChoice === 'piedra' && player1Choice === 'tijeras') ||
              (cpuChoice === 'papel' && player1Choice === 'piedra') ||
              (cpuChoice === 'tijeras' && player1Choice === 'papel'))
        ? styles.choiceWinner
        : styles.choiceLooser;
    }
  };

  return (
    <div className={styles.multiplayerContainer}>
      <PauseMenu
        showPauseButton={!gameOver}
        showPauseMenu={showPauseMenu}
        onTogglePause={togglePauseMenu}
        onBackToMenu={onBack}
        onResetGame={resetGame}
        onBackToPlayerSelect={() => onBack('playerSelect')}
        enableEsc={(!gameOver && !showResult) || showPauseMenu}
        volume={volume}
        onVolumeChange={onVolumeChange}
        musicMuted={musicMuted}
        onToggleMusic={handleToggleMusic}
      />
  {/* JUGADOR 1 - Izquierda en PC, Abajo en Mobile */}
      <div className={`${styles.playerSection} ${styles.player1Section} ${(player1Choice && !showResult) || showPauseMenu ? styles.blurred : ''}`}> 
        <div className={styles.playerSidebar}>
          <div className={styles.playerName}>{playerName}</div>
          <div className={`${styles.playerImage} ${styles.player1Image} ${styles[player1Status]}`}></div>
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
              onClick={() => handleChoiceClickWithSound('piedra')}
              className={styles.optionButton}
              disabled={player1Choice !== null || showPauseMenu}
            >
              <div className={styles.opcion} style={{ backgroundImage: `url(${choices.piedra})` }}></div>
              <span className={styles.optionLabel}>Q</span>
            </button>
            <button 
              onClick={() => handleChoiceClickWithSound('papel')}
              className={styles.optionButton}
              disabled={player1Choice !== null || showPauseMenu}
            >
              <div className={styles.opcion} style={{ backgroundImage: `url(${choices.papel})` }}></div>
              <span className={styles.optionLabel}>W</span>
            </button>
            <button 
              onClick={() => handleChoiceClickWithSound('tijeras')}
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
              ></div>
              <div
                className={`${styles.choiceCard} ${styles.choiceCPU} ${cpuChoiceClass} ${getChoiceCardClass(2)}`}
                onAnimationEnd={() => setCpuAnimDone(true)}
              ></div>
            </div>
            <div className={styles.resultText}>{resultText}</div>
            <div className={styles.continueText}>Presiona cualquier tecla para continuar...</div>
          </div>
        ) : (
          <div className={styles.waitingBattle}>
            <p>Esperando selección...</p>
            {player1Choice && <p className={styles.readyIndicator}>{playerName} listo</p>}
          </div>
        )}
      </div>
      {/* CPU - Derecha en PC, Arriba en Mobile */}
      <div className={`${styles.playerSection} ${styles.player2Section} ${(cpuChoice && !showResult) || showPauseMenu ? styles.blurred : ''}`}>
        <div className={styles.playerSidebar}>
          <div className={styles.playerName}>ANDROIDE</div>
          <div className={`${styles.playerImage} ${styles.PlayerCPUImage} ${cpuVisualLives <= 2 ? styles.PlayerCPUDamaged : ''}`}></div>
          <div className={`${styles.healthBar} ${cpuVisualLives === 1 ? styles.lowLives : ''}`}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`
                  ${styles.healthBox}
                  ${i < cpuVisualLives ? styles.healthActive : ''}
                  ${(i < cpuVisualLives && cpuVisualLives === 2) ? styles.yellow : ''}
                  ${(i < cpuVisualLives && cpuVisualLives === 1) ? styles.red : ''}
                `}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Área de resultado mobile - Solo visible en mobile */}
      <div className={styles.mobileResultArea}>
        {showResult && (
          <div
            className={`${styles.mobileResult} ${p1ChoiceClass} ${cpuChoiceClass} ${getChoiceCardClass(1)} ${getChoiceCardClass(2)}`}
            onAnimationEnd={(e) => {
              if (e.target.classList.contains(styles.choiceP1)) setP1AnimDone(true);
              if (e.target.classList.contains(styles.choiceCPU)) setCpuAnimDone(true);
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

export default SinglePlayerGame;
