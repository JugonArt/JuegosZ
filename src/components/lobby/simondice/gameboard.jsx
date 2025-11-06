import React, { useState, useEffect } from 'react';
import styles from '../../styles/simondice/simon.module.css';

const GameBoard = ({ 
  spheres, 
  onSphereClick, 
  isPlaying, 
  isShowingSequence, 
  sequence, 
  playerSequence,
  currentLevel,
  currentRound,
  speedMs,
  isTransitioning,
  illuminatedSphereId,
  floatMode // NUEVA PROP
}) => {
  const [clickedSphere, setClickedSphere] = useState(null);

  const handleSphereClick = (sphere) => {
    if (!isPlaying || isShowingSequence) return;

    // Iluminar brevemente la esfera clickeada
    setClickedSphere(sphere.id);
    setTimeout(() => setClickedSphere(null), 200);

    onSphereClick(sphere);
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.simon}>
        <div className={`${styles.spheresContainer} ${isShowingSequence ? styles.disableHover : ''}`} id="esferascont">
          {spheres.map((sphere, index) => {
            let flotarClass = '';
            if (floatMode === 'flotar') flotarClass = styles[`flotar${index+1}`];
            else if (floatMode === 'flotar-stop') flotarClass = styles[`flotar${index+1}-stop`];
            // Si floatMode es '', no se aplica animación
            return (
              <button
                key={sphere.id}
                id={sphere.id}
                className={`${styles.sphere} ${styles[sphere.value]} ${flotarClass} ${
                  illuminatedSphereId === sphere.id || clickedSphere === sphere.id ? styles.illuminate : ''
                } ${isPlaying && !isShowingSequence ? '' : styles.disabled}`}
                onClick={() => handleSphereClick(sphere)}
                alt={sphere.name}
                disabled={!isPlaying || isShowingSequence || isTransitioning}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;