import React, { useState, useEffect } from 'react';
import styles from '../../styles/1942/Menu.module.css'; 
import BackButton from '../../UI/backbutton.jsx';
import { useNameSelectorSounds } from '../../UI/useNameSelectorSounds';

const MainMenu = ({ onStartGame, getTopScores1942, onBack }) => {
  const [selecting, setSelecting] = useState(null); // null | 'single' | 'two-player'
  const [showSelectorContent, setShowSelectorContent] = useState(false); // Para el delay
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [error, setError] = useState('');
  const [scores1942, setScores1942] = useState([]);
  const [loading, setLoading] = useState(false);
  const { playOpenSound, playCloseSound, playSelectedSound } = useNameSelectorSounds();

  useEffect(() => {
    const fetchScores = async () => {
      if (!getTopScores1942) return;
      setLoading(true);
      const results = await getTopScores1942();
      setScores1942(results || []);
      setLoading(false);
    };
    fetchScores();
  }, [getTopScores1942]);

  const handleSelect = (mode) => {
    if (selecting === mode) {
      return; // Ya está seleccionado
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
      onStartGame('single', 'Jugador 1');
    } else {
      onStartGame('two-player', 'Jugador 1', 'Jugador 2');
    }
    setSelecting(null);
  };

  const handlePlay = () => {
    if (selecting === 'single') {
      if (!player1Name.trim()) {
        setError('Por favor ingresa un nombre');
        return;
      }
      playSelectedSound();
      onStartGame('single', player1Name.trim());
    } else {
      if (!player1Name.trim() || !player2Name.trim()) {
        setError('Por favor ingresa ambos nombres');
        return;
      }
      playSelectedSound();
      onStartGame('two-player', player1Name.trim(), player2Name.trim());
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
      <div className={styles.gameMenu}>
        <BackButton onBack={onBack} /> 
        <div className={styles.menuContainer}>
          <div className={styles.Titles}>
            <h1 className={styles.gameTitle}><span>1942</span></h1>
            <h2 className={styles.gameSubtitle}>Gokú contra la Patrulla Roja</h2>
          </div>
          <div className={styles.GokuMenu}/>
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
              className={`${styles.menuButton} ${styles.multiPlayer} ${selecting === 'two-player' ? styles.expandedButton : ''}`}
              onClick={() => handleSelect('two-player')}
              style={{ cursor: 'pointer', position: 'relative', zIndex: selecting === 'two-player' ? 2 : 1 }}
            >
              {selecting !== 'two-player' && <i className={`${styles.player2Icon} ${styles.playersIcon}`}></i>}
              {selecting !== 'two-player' && '2 JUGADORES'}
              <div className={`${styles.nameSelectorContent} ${selecting === 'two-player' && showSelectorContent ? styles.active : ''}`}>
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
                      const nextInput = e.target.parentElement.querySelector('input:nth-of-type(2)');
                      if (nextInput) {
                        nextInput.focus();
                      }
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const nextInput = e.target.parentElement.querySelector('input:nth-of-type(2)');
                      if (nextInput) {
                        nextInput.focus();
                      }
                    } else if (e.key === 'ArrowUp') {
                      // No hay input anterior en este caso
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
                      if (player1Name.trim() && player2Name.trim()) {
                        handlePlay();
                      }
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prevInput = e.target.parentElement.querySelector('input:nth-of-type(1)');
                      if (prevInput) {
                        prevInput.focus();
                      }
                    } else if (e.key === 'ArrowDown') {
                      // No hay input siguiente en este caso
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
            <p>P1: WASD, Q, Shift Izq • P2: Flechas, Espacio, Ctrl Der • ESC: pausa</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;