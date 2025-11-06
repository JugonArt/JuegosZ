import React, { useEffect, useState, useRef } from 'react';
import styles from '../styles/Toast.module.css';

const Toast = ({ message, playerName, position, gameName, duration = 8000, onClose }) => {
  const [appears, setAppears] = useState(false);
  const [disappears, setDisappears] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Inicializar el sonido
    audioRef.current = new Audio('/sounds/LobbySounds/LevelUp.mp3');
    audioRef.current.volume = 0.6;
  }, []);

  useEffect(() => {
    // Agregar la clase "appears" después de un pequeño delay para trigger la animación
    const appearTimer = setTimeout(() => {
      setAppears(true);
      // Reproducir sonido cuando aparece
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.warn('Error playing sound:', err));
      }
    }, 10);

    // Agregar clase "disappears" antes de cerrar para trigger animación de salida
    const disappearTimer = setTimeout(() => {
      setAppears(false);
      setDisappears(true);
    }, duration - 300); // Iniciar salida 300ms antes del cierre

    // Cerrar el toast
    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(appearTimer);
      clearTimeout(disappearTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  return (
    <div className={styles.toastContainer}>
      <div className={`${styles.toast} ${appears ? styles.appears : ''} ${disappears ? styles.disappears : ''}`}>
        <div className={styles.toastContent}>
          {/* Si se pasa message, usarlo directamente (para compatibilidad) */}
          {message ? (
            message
          ) : (
            /* Si se pasan las props separadas, construir el mensaje con clases */
            <>
              ¡{playerName}, has alcanzado el <span className={styles.number}>top {position}</span> en <span className={styles.game}>{gameName}</span>!
            </>
          )}
        </div>
      <div className={styles.kaiosama} />
      </div>
    </div>
  );
};

export default Toast;
