import React from 'react';
import { GAME_WIDTH } from '../../../utils1942/constants.js';
import styles from '../../styles/1942/Objects.module.css';

const Player = ({ player, playerId }) => {
  // Determinamos si debe estar flippeado basado en la posición original (sin escalar)
  const isFlipped = player.x < GAME_WIDTH / 2;

  return (
    <div
      className={`
        ${styles[`player${playerId}`]} 
        ${styles.absolute} 
        ${player.isLooping ? `${styles.opacity30} ${styles.looping}` : ""} 
        ${isFlipped ? styles[`flipPlayer${playerId}`] : ""}
      `}      
      style={{
        left: player.x,
        top: player.y,
        width: player.width,
        height: player.height,
        zIndex: player.isLooping ? 1 : 10,
        transition: "none", // Sin transiciones para fluidez
      }}
    />
  );
};

export default Player;