import React from 'react';
import styles from '../../styles/1942/Objects.module.css';

const Bullet = ({ bullet, isEnemy = false }) => {
  const getBulletColor = () => {
    if (isEnemy) return styles.enemyBullet;
    return bullet.playerId === 1 ? styles.player1bullet : styles.player2bullet;
  };

  return (
    <div
      className={`${styles.absolute} ${styles.player} ${styles.bullet} ${getBulletColor()}`}
      style={{
        left: bullet.x,
        top: bullet.y,
        width: bullet.width,
        height: bullet.height,
      }}
    />
  );
};

export default Bullet;