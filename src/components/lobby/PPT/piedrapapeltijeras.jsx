import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameForm from '../../UI/formularioradar.jsx';
import SinglePlayerGame from '../PPT/SinglePlayerGame.jsx';
import GameMenu from '../PPT/GameMenu.jsx';
import MultiplayerGame from '../PPT/MultiplayerGame.jsx';
import VideoPlayer from '../../UI/videoplayer.jsx';
import PauseMenu from '../../UI/MenuPausa.jsx';
import '../../styles/UI.css';
import styles from '../../styles/PPT/PPT.module.css';
import Nube from '../../UI/nube.jsx';
import { useBGM } from '../../../utils/bgmManager';

const PiedraPapelTijeras = ({ onBack }) => {
  const [gameMode, setGameMode] = useState(null);
  const [gameState, setGameState] = useState('menu');
  const [showVideo, setShowVideo] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [musicMuted, setMusicMuted] = useState(false);
  // Estado y función de pausa SOLO para multiplayer
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const bgm = useBGM();

  const togglePauseMenu = useCallback(() => {
    // Toggle pause UI only. Do not stop or restart the central BGM here so music
    // keeps playing while the pause menu is open.
    setShowPauseMenu(prev => !prev);
  }, [bgm]);
  


  // Nombres de jugadores
  const [playerNames, setPlayerNames] = useState({ player1: null, player2: null });
  // Ref para recibir la función de reseteo desde el hijo multiplayer
  const multiplayerResetRef = useRef(null);

  // Recibe modo y nombres desde el menú
  const handleSelectMode = (mode, names = {}) => {
    setGameMode(mode);
    setPlayerNames({
      player1: names.player1 || null,
      player2: names.player2 || null,
    });
  // Start or resume music without forcing a new random track.
  // Forcing a new track on mode selection causes unexpected song changes when
  // opening menus or adjusting volume — prefer non-forcing play here.
  bgm.play();
    setGameState('playing');
  };

  // El formulario y el nombre ya no se usan en singleplayer

  const handleSkipVideo = () => {
    setShowVideo(false);
    setGameState('playing');
  };
  
  // Manejador para volver al lobby o al selector de jugadores
  const handleBack = (destination) => {
    bgm.stop();
    if (destination === 'playerSelect') {
      setGameState('menu');
      setGameMode(null);
    } else {
      if (typeof onBack === 'function') onBack();
    }
  };

  // Handler para re-elegir jugadores/modo (volver al menú de selección de modo)
  const handleRechoosePlayers = () => {
    setGameState('menu');
    setGameMode(null);
    setShowVideo(false);
    bgm.stop();
  };

  // Función de reseteo para el modo de un jugador
  const resetGame = () => {
    setGameState('menu');
    setShowVideo(false);
    bgm.stop();
  };
  
  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    bgm.setVolume(newVolume);
  }, [bgm]);

  // Toggle music: pause/resume the bgm and keep local state in sync
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
      console.warn('Error toggling music state:', e);
    }
  }, [bgm]);

  // Sync initial musicMuted with bgm on mount
  useEffect(() => {
    try {
      const state = bgm.getCurrentState();
      setMusicMuted(!!state.isPaused);
    } catch (e) {
      // ignore
    }
  }, [bgm]);


  return (
    <div className={styles.pptContainer}>
      <Nube />
      
      {gameState === 'menu' && (
        <>
          {/* 5. BOTÓN PARA VOLVER AL LOBBY */}
          <button onClick={onBack} className="backBtn" title="Volver al Lobby"></button>
          <GameMenu onSelectMode={handleSelectMode} />
        </>
      )}

      {/* El formulario ya no se muestra en singleplayer */}

      {showVideo && gameState === 'video' && (
        <VideoPlayer onSkip={handleSkipVideo} />
      )}

      {gameState === 'playing' && gameMode === 'single' && (
        <SinglePlayerGame 
          onBack={handleBack} 
          playerName={playerNames.player1 || 'Jugador 1'} 
          volume={volume}
          onVolumeChange={handleVolumeChange}
        />
      )}

      {gameState === 'playing' && gameMode === 'multi' && (
        <>
          <PauseMenu
            showPauseMenu={showPauseMenu}
            onTogglePause={togglePauseMenu}
            onBackToMenu={() => handleBack()}
            onBackToPlayerSelect={() => handleBack('playerSelect')}
            onResetGame={() => {
              // If multiplayer is active and the multiplayer child provided a reset function, call it.
              if (multiplayerResetRef.current) {
                multiplayerResetRef.current();
              } else {
                // Fallback: parent reset (navigates to menu)
                resetGame();
              }
            }}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            musicMuted={musicMuted}
            onToggleMusic={handleToggleMusic}
          />
          <MultiplayerGame
            onBack={handleBack}
            player1Name={playerNames.player1 || 'Jugador 1'}
            player2Name={playerNames.player2 || 'Jugador 2'}
            showPauseMenu={showPauseMenu}
            onTogglePause={togglePauseMenu}
            onRequestClose={() => setShowPauseMenu(false)}
            registerReset={(fn) => { multiplayerResetRef.current = fn; }}
            volume={volume}
            onVolumeChange={handleVolumeChange}
          />
        </>
      )}
    </div>
  );
};

export default PiedraPapelTijeras;