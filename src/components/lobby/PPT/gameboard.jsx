import React, { useState } from 'react';
import styles from '../../styles/PPT/PPT.module.css';

// 1. Aceptar el prop "isPaused"
const GameBoard = ({ playerName, onReset, isPaused }) => {
  const [gameResult, setGameResult] = useState(null);

  const choices = {
    piedra: 'https://emojiisland.com/cdn/shop/products/Fisted_Hand_Sign_Emoji_Icon_ios10_large.png?v=1571606090',
    papel: 'https://emojiisland.com/cdn/shop/products/Raised_Hand_With_Fingers_Splayed_Emoji_Icon_ios10.png?v=1571606092',
    tijeras: 'https://emojiisland.com/cdn/shop/products/Victory_Hand_Emoji_Icon_ios10_large.png?v=1571606113',
  };

  const choiceNames = { piedra: 'Piedra', papel: 'Papel', tijeras: 'Tijeras' };

  const getComputerChoice = () => ['piedra', 'papel', 'tijeras'][Math.floor(Math.random() * 3)];

  const determineWinner = (userChoice, computerChoice) => {
    if (userChoice === computerChoice) return 'tie';
    if (
      (userChoice === 'piedra' && computerChoice === 'tijeras') ||
      (userChoice === 'papel' && computerChoice === 'piedra') ||
      (userChoice === 'tijeras' && computerChoice === 'papel')
    ) return 'win';
    return 'lose';
  };

  const playGame = (userChoice) => {
    const computerChoice = getComputerChoice();
    const result = determineWinner(userChoice, computerChoice);
    const resultText = result === 'win' ? '¡Ganaste!' : result === 'lose' ? '¡Perdiste!' : '¡Empate!';
    setGameResult({ userChoice, computerChoice, result, resultText });
  };

  return (
    <div className={styles.container2}>
      <div className={styles.goku}></div>
      <div className={styles.vegeta}></div>

      <h1>Piedra, Papel o Tijeras</h1>
      <p className={styles.playerName}>Jugador: {playerName}</p>

      <div className={styles.buttons}>
        {Object.keys(choices).map((choice) => (
          <button 
            className={`${styles.boton}`} 
            key={choice} 
            onClick={() => playGame(choice)}
            disabled={isPaused || gameResult} // 2. Deshabilitar si está en pausa o si ya hay un resultado
          >
            <div className={`${styles.opcion} ${styles[choice]}`} style={{ backgroundImage: `url(${choices[choice]})` }}></div>
          </button>
        ))}
      </div>

      <div className={styles.result}>
        {gameResult ? (
          <>
            {/* ...código de resultado... */}
            <button className={styles.btnInicio} onClick={() => setGameResult(null)} disabled={isPaused}>Jugar otra vez</button>
          </>
        ) : (
          <div className={styles.initialMessage}>Selecciona tu jugada...</div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;