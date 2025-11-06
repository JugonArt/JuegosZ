import React from 'react';
import { GAME_WIDTH } from '../../../utils1942/constants.js';
import styles from '../../styles/1942/Objects.module.css';

const Enemy = ({ enemy }) => {
  // Función para determinar la clase del enemigo basada en la formación o el tipo
  const getEnemyClass = () => {
    if (enemy.isRedFormation) {
      return styles.Enemy5;
    }
    if (enemy.isSpecialPatrol) {
      return styles.Enemy6;
    }
    if (enemy.isBomberSquadron) {
      return styles.Enemy7;
    }
    if (enemy.isScoutSquadron) {
      return styles.Enemy8;
    }

    // Lógica para enemigos regulares
    switch (enemy.name || enemy.color) {
      case "fighter":
      case "gray":
      case "red":
        return styles.Enemy1;
      case "bomber":
      case "blue":
        return styles.Enemy2;
      case "heavy":
      case "green":
        return styles.Enemy3;
      case "interceptor":
      case "purple":
        return styles.Enemy4;
      default:
        return styles.Enemy1;
    }
  };

  // Determinamos si debe estar flippeado basado en la posición original (sin escalar)
  const isFlipped = enemy.x < GAME_WIDTH / 2;
  
  return (
    <div
      className={`${getEnemyClass()} ${styles.Enemy} ${styles.absolute} ${isFlipped ? styles.flipEnemy : styles.nonFlipped}`}
      style={{
        left: enemy.x,
        top: enemy.y,
        width: enemy.width,
        height: enemy.height,
      }}
    >
    </div>
  );
};

export default Enemy;