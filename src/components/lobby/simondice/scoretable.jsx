import React, { useState, useEffect } from 'react';
import styles from '../../styles/simondice/simon.module.css';

const ScoreTable = ({ isGameOver = false, onClose }) => {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = () => {
    const savedScores = localStorage.getItem('dragonBallPuntajes');
    const parsedScores = savedScores ? JSON.parse(savedScores) : [];
    setScores(parsedScores);
  };

  const clearScores = () => {
    localStorage.removeItem('dragonBallPuntajes');
    setScores([]);
  };

  return (
    <div className={`${styles.scoresTable} ${isGameOver ? styles.gameOverScores : styles.normalScores}`}>
      <h3>Puntajes</h3>
      <table className={styles.scoresTableContent}>
        <thead>
          <tr>
            <th>Puesto</th>
            <th>Jugador</th>
            <th>Puntos</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {scores.length === 0 ? (
            <tr>
              <td colSpan={4} className={styles.noScores}>
                No hay puntajes registrados aún
              </td>
            </tr>
          ) : (
            scores.map((score, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{score.nombre}</td>
                <td>{score.nivel}</td>
                <td>{score.fecha}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {!isGameOver && (
        <div className={styles.scoresButtons}>
          <button onClick={onClose} className={styles.closeScoresButton}>
            Cerrar puntajes
          </button>
          <button onClick={clearScores} className={styles.clearScoresButton}>
            Quitar puntajes
          </button>
        </div>
      )}
    </div>
  );
};

export default ScoreTable;