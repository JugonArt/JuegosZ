import React, { useState, useEffect } from 'react';
import styles from '../../styles/tateti/tateti.module.css';

const winPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const GameBoard = ({ player1, player2, onReset }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [winner, setWinner] = useState(null);
  const [winningPattern, setWinningPattern] = useState([]);
  const [shakingCell, setShakingCell] = useState(null);

  // Mapeo de teclas a índices del tablero
  // Layout: 7 8 9
  //         4 5 6
  //         1 2 3
  const keyToIndex = {
    // Teclas numéricas superiores (usando e.key)
    '1': 6, '2': 7, '3': 8,
    '4': 3, '5': 4, '6': 5,
    '7': 0, '8': 1, '9': 2,
    // Teclado numérico (usando e.code)
    'Numpad1': 6, 'Numpad2': 7, 'Numpad3': 8,
    'Numpad4': 3, 'Numpad5': 4, 'Numpad6': 5,
    'Numpad7': 0, 'Numpad8': 1, 'Numpad9': 2
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignorar si ya hay ganador
      if (winner) return;

      // Primero intentar con e.code (para numpad), luego con e.key (para teclas normales)
      const key = e.key;
      const code = e.code;
      const index = keyToIndex[code] !== undefined ? keyToIndex[code] : keyToIndex[key];

      // Si la tecla no está en el mapeo, ignorar
      if (index === undefined) return;

      // Si la celda ya está ocupada, hacer shake
      if (board[index]) {
        setShakingCell(index);
        setTimeout(() => setShakingCell(null), 500);
        return;
      }

      // Hacer el movimiento
      handleClick(index);
    };

    const handleKeyUp = (e) => {
      // Listener opcional para debugging futuro
    };

    const globalTest = (e) => {
      // Listener opcional para debugging futuro
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keypress', globalTest);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keypress', globalTest);
    };
  }, [board, winner, currentPlayer]);

  const handleClick = (index) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const win = checkWinner(newBoard);
    if (win) {
      setWinner(currentPlayer);
      setWinningPattern(win);
    } else if (newBoard.every(Boolean)) {
      setWinner("Empate");
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  };

  const checkWinner = (board) => {
    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return pattern;
      }
    }
    return null;
  };

  const renderMarker = (cell, index) => {
    if (!cell) return null;

    const isWinnerCell = winningPattern.includes(index);
    const winnerClass =
      isWinnerCell
        ? cell === "X"
          ? styles.winnerGoku
          : styles.winnerVegeta
        : "";

    const className = `${styles.marker} ${cell === "X" ? styles["marker-X"] : styles["marker-O"]} ${winnerClass}`;

    return <div className={className}></div>;
  };

const getStatusText = () => {
  if (!winner) {
    const currentName = currentPlayer === "X" ? player1 : player2;
    const personaje = currentPlayer === "X" ? "Gokú" : "Vegeta";
    return `Turno de ${currentName} (${personaje})`;
  }
  if (winner === "Empate") return "¡Empate!";
  const winnerName = winner === "X" ? player1 : player2;
  const winnerPersonaje = winner === "X" ? "Gokú" : "Vegeta";
  return `¡${winnerName} (${winnerPersonaje}) GANA!`;
};

  // 🚀 Solo limpia el tablero y reinicia el turno
  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningPattern([]);
  };

  return (
    <div className={styles.boardContainer}>
      <h1>Ta-Te-Ti</h1>
      <p className={styles.status}>{getStatusText()}</p>
      <div className={styles.board}>
        {board.map((cell, i) => {
          // Mapear índice a número de tecla para mostrar
          const indexToKey = {
            0: '7', 1: '8', 2: '9',
            3: '4', 4: '5', 5: '6',
            6: '1', 7: '2', 8: '3'
          };
          
          return (
            <button
              key={i}
              className={`${styles.cell} ${shakingCell === i ? styles.shakeCell : ''}`}
              onClick={() => handleClick(i)}
            >
              {renderMarker(cell, i)}
              {!cell && !winner && (
                <span className={styles.keyHint}>{indexToKey[i]}</span>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "10px" }}>
        <button onClick={resetBoard} className={styles.resetBtn}>
          Reiniciar Tablero
        </button>
        <button onClick={onReset} className={styles.resetBtn}>
          Volver a Ingresar Jugadores
        </button>
      </div>
    </div>
  );
};

export default GameBoard;
