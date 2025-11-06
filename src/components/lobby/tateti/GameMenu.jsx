import React, { useState } from 'react';
import styles from '../../styles/tateti/tateti.module.css';
import { useNameSelectorSounds } from '../../UI/useNameSelectorSounds';

const GameMenu = ({ onSinglePlayer, onMultiplayer, onBack }) => {
  const [selecting, setSelecting] = useState(null); // null | 'single' | 'multi'
  const [showSelectorContent, setShowSelectorContent] = useState(false); // Para el delay
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [error, setError] = useState('');
  const { playOpenSound, playCloseSound, playSelectedSound } = useNameSelectorSounds();

  const handleSelect = (mode) => {
    if (selecting === mode) {
      // Si ya está seleccionado, no hacer nada
      return;
    }
    
    playOpenSound();
    setSelecting(mode);
    setPlayer1Name('');
    setPlayer2Name('');
    setError('');
    setShowSelectorContent(false);
    setTimeout(() => setShowSelectorContent(true), 100); // Reducir delay para mejor UX
  };

  const handlePlayGuest = () => {
    playSelectedSound();
    if (selecting === 'single') {
      onSinglePlayer('Gokú'); // Nombre por defecto para invitado
    } else {
      onMultiplayer('Gokú', 'Vegeta'); // Nombres por defecto para invitados
    }
    setSelecting(null);
  };

  const handlePlay = () => {
    if (selecting === 'single') {
      if (!player1Name.trim()) {
        setError('Ingresa un nombre para jugar.');
        return;
      }
      playSelectedSound();
      onSinglePlayer(player1Name.trim());
    } else {
      if (!player1Name.trim() || !player2Name.trim()) {
        setError('Ingresa ambos nombres para jugar.');
        return;
      }
      // Validar que los nombres no sean iguales
      if (player1Name.trim().toLowerCase() === player2Name.trim().toLowerCase()) {
        setError('No pueden jugar dos personas con un mismo nombre.');
        return;
      }
      playSelectedSound();
      onMultiplayer(player1Name.trim(), player2Name.trim());
    }
    setSelecting(null);
  };

  const handleExit = (e) => {
    e.stopPropagation(); // Evitar que se propague al onClick del botón
    playCloseSound();
    setSelecting(null);
    setPlayer1Name('');
    setPlayer2Name('');
    setError('');
    setShowSelectorContent(false);
  };

  return (
    <div className={styles.Contenedor}>
      <button
        onClick={onBack}
        className="backBtn"
        title="Volver al lobby"
      ></button>
      <div className={styles.gameMenu}>
        <div className={styles.menuContainer}>
          <div className={styles.Titles}>
            <div className={styles.titleGrid}>
              <div className={styles.gridCell}><span>TA</span></div>
              <div className={styles.gridCell}><span>TE</span></div>
              <div className={styles.gridCell}><span>TI</span></div>
              <div className={styles.gridCell}><span>El radar del dragón</span></div>
            </div>
          </div>
          <div className={styles.menuOptions}>
            <div
              className={`${styles.menuButton} ${styles.singlePlayer} ${selecting === 'single' ? styles.expandedButton : ''}`}
              onClick={() => handleSelect('single')}
              style={{ cursor: 'pointer', position: 'relative', zIndex: selecting === 'single' ? 2 : 1 }}
            >
              {selecting !== 'single' && <i className={`${styles.player1Icon} ${styles.playersIcon}`}></i>}
              {selecting !== 'single' && '1 JUGADOR'}
              <div className={`${styles.nameSelectorContent} ${selecting === 'single' && showSelectorContent ? styles.active : ''}`}>
                <input
                  type="text"
                  className={`${styles.nameInput} ${styles.SelectButton}`}
                  placeholder="Nombre del jugador"
                  value={player1Name}
                  onChange={e => setPlayer1Name(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePlay();
                    }
                  }}
                  maxLength={15}
                />
                <button
                  className={`${styles.guestButton} ${styles.SelectButton}`}
                  style={{ width: '100%' }}
                  onClick={(e) => { e.stopPropagation(); handlePlayGuest(); }}
                >
                  Jugar como invitado
                </button>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.playButton} ${styles.SelectButton}`}
                    style={{ width: '100%' }}
                    onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                    disabled={!player1Name.trim()}
                  >
                    Jugar
                  </button>
                  <button
                    className={`${styles.exitButton} ${styles.SelectButton}`}
                    style={{ width: '100%' }}
                    onClick={handleExit}
                  >
                    Salir
                  </button>
                </div>
                {error && <div className={styles.errorMsg}>{error}</div>}
              </div>
            </div>
            <div
              className={`${styles.menuButton} ${styles.multiPlayer} ${selecting === 'multi' ? styles.expandedButton : ''}`}
              onClick={() => handleSelect('multi')}
              style={{ cursor: 'pointer', position: 'relative', zIndex: selecting === 'multi' ? 2 : 1 }}
            >
              {selecting !== 'multi' && <i className={`${styles.player2Icon} ${styles.playersIcon}`}></i>}
              {selecting !== 'multi' && '2 JUGADORES'}
              <div className={`${styles.nameSelectorContent} ${selecting === 'multi' && showSelectorContent ? styles.active : ''}`}>
                <input
                  type="text"
                  className={`${styles.nameInput} ${styles.SelectButton}`}
                  placeholder="Nombre Jugador 1"
                  value={player1Name}
                  onChange={e => setPlayer1Name(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Si hay texto en input 1, mover al input 2
                      if (player1Name.trim()) {
                        const input2 = e.target.parentElement.querySelector('input[placeholder="Nombre Jugador 2"]');
                        if (input2) {
                          input2.focus();
                        }
                      }
                    }
                    // Navegación con flechas
                    else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const input2 = e.target.parentElement.querySelector('input[placeholder="Nombre Jugador 2"]');
                      if (input2) {
                        input2.focus();
                      }
                    }
                  }}
                  maxLength={15}
                />
                <input
                  type="text"
                  className={`${styles.nameInput} ${styles.SelectButton}`}
                  placeholder="Nombre Jugador 2"
                  value={player2Name}
                  onChange={e => setPlayer2Name(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Si hay texto en input 2 pero no en input 1, mover al input 1
                      if (player2Name.trim() && !player1Name.trim()) {
                        const input1 = e.target.parentElement.querySelector('input[placeholder="Nombre Jugador 1"]');
                        if (input1) {
                          input1.focus();
                        }
                      } 
                      // Si ambos tienen texto, enviar
                      else if (player1Name.trim() && player2Name.trim()) {
                        handlePlay();
                      }
                    }
                    // Navegación con flechas
                    else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const input1 = e.target.parentElement.querySelector('input[placeholder="Nombre Jugador 1"]');
                      if (input1) {
                        input1.focus();
                      }
                    }
                  }}
                  maxLength={15}
                />
                <button
                  className={`${styles.guestButton} ${styles.SelectButton}`}
                  style={{ width: '100%' }}
                  onClick={(e) => { e.stopPropagation(); handlePlayGuest(); }}
                >
                  Jugar como invitado
                </button>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.playButton} ${styles.SelectButton}`}
                    style={{ width: '100%' }}
                    onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                    disabled={!player1Name.trim() || !player2Name.trim()}
                  >
                    Jugar
                  </button>
                  <button
                    className={`${styles.exitButton} ${styles.SelectButton}`}
                    style={{ width: '100%' }}
                    onClick={handleExit}
                  >
                    Salir
                  </button>
                </div>
                {error && <div className={styles.errorMsg}>{error}</div>}
              </div>
            </div>
          </div>
          <div className={styles.menuControls}>
            <p>Controles:</p>
            <p>Click en las casillas para marcar • ESC: volver al menú</p>
          </div>
          <div className={styles.BulmaMenu} />
        </div>
      </div>
    </div>
  );
};

export default GameMenu;