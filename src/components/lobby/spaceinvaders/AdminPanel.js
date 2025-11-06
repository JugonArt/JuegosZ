import React from 'react';
import styles from '../../styles/spaceinvaders/adminpanel.module.css';

const AdminPanel = ({
  showPanel,
  onClose,
  gameState,
  players,
  currentPlayer,
  score,
  lives,
  onForceWin,
  onForceLose,
  onAddLife,
  onRemoveLife,
  onAddScore,
  onEnableSuper,
  onClearAliens
  ,onLevelUp, onIncreaseSpeed, onSpawnSpecialEnemy
}) => {
  if (!showPanel) return null;

  return (
    <div className={styles.adminPanelOverlay}>
      <div className={styles.adminPanel}>
        <h2>PANEL DE ADMINISTRADOR</h2>
        <div className={styles.adminInfo}>
          <p>Estado: {gameState}</p>
          <p>Jugadores: {players} | Jugador Actual: {currentPlayer}</p>
          <p>Score: {score[currentPlayer - 1]} | Vidas: {lives[currentPlayer - 1]}</p>
        </div>
        
        <div className={styles.adminControls}>
          <div className={styles.adminSection}>
            <h3>Resultado del Juego</h3>
            <button
              className={`${styles.adminBtn} ${styles.win}`}
              onClick={() => {
                onForceWin();
                onClose();
              }}
            >
              FORZAR VICTORIA
            </button>
            <button 
              className={`${styles.adminBtn} ${styles.lose}`}
              onClick={() => {
                onForceLose();
                onClose();
              }}
            >
              FORZAR DERROTA
            </button>
          </div>
          
          <div className={styles.adminSection}>
            <h3>Vidas</h3>
            <button className={styles.adminBtn} onClick={onAddLife}>
              AGREGAR VIDA
            </button>
            <button className={styles.adminBtn} onClick={onRemoveLife}>
              QUITAR VIDA
            </button>
          </div>
          
          <div className={styles.adminSection}>
            <h3>Puntuación</h3>
            <button className={styles.adminBtn} onClick={onAddScore}>
              +1000 PUNTOS
            </button>
            <button className={styles.adminBtn} onClick={onEnableSuper}>
              HABILITAR SÚPER
            </button>
          </div>
          
          <div className={styles.adminSection}>
            <h3>Aliens</h3>
            <button className={styles.adminBtn} onClick={onClearAliens}>
              ELIMINAR TODOS
            </button>
            <button className={styles.adminBtn} onClick={() => { onLevelUp && onLevelUp(); onClose(); }}>
              AVANZAR DE NIVEL
            </button>
            <button className={styles.adminBtn} onClick={() => { onIncreaseSpeed && onIncreaseSpeed(); onClose(); }}>
              AUMENTAR VELOCIDAD
            </button>
            <button className={styles.adminBtn} onClick={() => { onSpawnSpecialEnemy && onSpawnSpecialEnemy(); onClose(); }}>
              SPAWN ENEMIGO ESPECIAL
            </button>
          </div>
        </div>
        
        <button className={styles.adminClose} onClick={onClose}>
          CERRAR (ESC)
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;