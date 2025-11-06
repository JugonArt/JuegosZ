import React, { useState } from 'react';
import styles from '../styles/forms.module.css';

const GameForm = ({ onStartGame, onPlayButtonSound = () => {} }) => {
  const [playerName, setPlayerName] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setIsAnimating(true);
    onPlayButtonSound(); // Reproducir sonidos al hacer click
    setTimeout(() => onStartGame(playerName.trim()), 1000);
  };

  const handleGuestPlay = () => {
    setIsAnimating(true);
    onPlayButtonSound(); // Reproducir sonidos al hacer click
    setTimeout(() => onStartGame('Invitado'), 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmit(e);
  };

  return (

    <div className={`${styles.formOverlay} ${isAnimating ? styles.animating : ''}`}>
      <div className={styles.gameForm}>
        <label className={styles.formLabel} htmlFor="playerName">Ingresá tu nombre</label>
        <input
          type="text"
          id="playerName"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className={styles.formControl}
          placeholder="Nombre del jugador"
          onKeyPress={handleKeyPress}
          required
        />
        <div className={styles.buttonContainer}>
          <button className={styles.startButton} onClick={handleSubmit}>¡Jugá!</button>
          <button className={styles.guestButton} onClick={handleGuestPlay}>Jugar como invitado</button>
        </div>
      </div>
    </div>
  );
};

export default GameForm;
