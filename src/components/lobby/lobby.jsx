import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import CircularCarousel from './CircularCarousel.jsx';
import Puntajes from './Puntajes.jsx';
import styles from '../styles/lobby.module.css';
import useMobileDetection from '../../hooks1942/useMobileDetection';
import useLobbySound from '../../hooks/useLobbySound';

const Lobby = ({ onNavigate, animate, isTransitioning }) => {
  const [activeView, setActiveView] = useState('juegos');
  const [isAnimating, setIsAnimating] = useState(false);

  const projects = useMemo(() => [
    { id: 'spaceinvaders', title: 'Space Invaders', description: 'Juego de Space Invaders que revive la batalla final de Bardock', colorClass: 'pink' },
    // { id: 'game1942', title: '1942', description: 'Clásico juego basado en el 1942 con temática épica', colorClass: 'purple' },
    { id: 'piedrapapeltijeras', title: 'Piedra Papel Tijeras', description: 'Enfréntate a Vegeta en el clásico juego con temática Dragon Ball', colorClass: 'orange' },
    { id: 'tateti', title: 'Tateti', description: 'Juego clásico de Tateti que representa una batalla icónica de rivales', colorClass: 'blue' },
    { id: 'simondice', title: 'Simon Dice', description: 'Memoriza la secuencia de las esferas del dragón', colorClass: 'green' },
  ], []);

  // Detectar dispositivo (móvil/tablet) y filtrar proyectos para dispositivos pequeños
  const { isMobile, isTablet, isTouchDevice } = useMobileDetection();

  const displayedProjects = useMemo(() => {
    // Solo en móviles/tablets mostrar únicamente SpaceInvaders
    if (isMobile || isTablet || isTouchDevice) {
      return projects.filter(p => p.id === 'spaceinvaders');
    }
    return projects;
  }, [projects, isMobile, isTablet, isTouchDevice]);

  const getGameplayClasses = useCallback((gameId) => {
    const gameplayConfig = {
      'spaceinvaders': {
        players1: { classes: [styles.players1], text: "1 jugador" },
        players2: { classes: [styles.players2VS], text: "competitivo" }
      },
      'tateti': {
        players1: { classes: [styles.players1], text: "1 jugador" },
        players2: { classes: [styles.players2VS], text: "competitivo" }
      },
      'piedrapapeltijeras': {
        players1: { classes: [styles.players1], text: "1 jugador" },
        players2: { classes: [styles.players2VS], text: "competitivo" }
      },
      'simondice': {
        players1: { classes: [styles.players1], text: "1 jugador" },
        players2: { classes: [styles.players2VS, styles.players2COOP, styles.noplayers], text: "" }
      },
      // 'game1942': {
      //   players1: { classes: [styles.players1], text: "1 jugador" },
      //   players2: { classes: [styles.players2COOP], text: "cooperativo" }
      // }
    };

    return gameplayConfig[gameId] || {
      players1: { classes: [styles.players1, styles.noplayers], text: "" },
      players2: { classes: [styles.players2VS, styles.players2COOP, styles.noplayers], text: "" }
    };
  }, []);

  const handlePlayClick = useCallback((projectId) => {
    onNavigate?.(projectId);
  }, [onNavigate]);

  const playLobbyChange = useLobbySound('/sounds/LobbySounds/LobbyChanging.mp3', { volume: 0.6 });

  const handleViewChange = (view) => {
    if (view !== activeView) {
      // Reproducir sonido al cambiar de vista
      try { playLobbyChange(); } catch (e) {}

      setIsAnimating(true);
      setActiveView(view);
      
      // Resetear la animación después de que termine
      setTimeout(() => {
        setIsAnimating(false);
      }, 5000); // Duración de la animación
    }
  };

  return (
    <div className={styles.lobby}>
      <div className={`${styles.header} ${animate ? styles.entryTop : ''}`}>
        <div className={styles.icon}/>
        <div className={styles.shorts}>
          <button
            className={`${styles.boton} ${activeView === 'juegos' ? styles.active : ''}`}
            onClick={() => handleViewChange('juegos')}
          >
            <div className={`${styles.Icon} ${styles.home}`}/>
            {!(isMobile || isTablet) && <h1 className={styles.shortcuts}>Juegos</h1>}
          </button>
          <div className={styles.gap}/>
          <button 
            className={`${styles.boton} ${activeView === 'puntajes' ? styles.active : ''}`}
            onClick={() => handleViewChange('puntajes')}
          >
            <div className={`${styles.Icon} ${styles.score}`}/>
            {!(isMobile || isTablet) && <h1 className={styles.shortcuts}>Puntajes</h1>}
          </button>
        </div>
      </div>

      {activeView === 'juegos' && (
        <CircularCarousel 
          projects={displayedProjects}
          onPlayClick={handlePlayClick}
          getGameplayClasses={getGameplayClasses}
          animate={animate || isAnimating}
          isTransitioning={isTransitioning}
        />
      )}

      {activeView === 'puntajes' && (
        <Puntajes animate={isAnimating} />
      )}

      <div className={styles.circle}/>


    </div>
  );
};

export default Lobby;