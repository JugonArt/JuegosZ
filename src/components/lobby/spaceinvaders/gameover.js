"use client"
import styles from '../../styles/spaceinvaders/gameover.module.css';
import { useState } from 'react'

const GameOverForm = ({ isWin, finalScore, onSubmit, onSkip, winVideoSrc, loseVideoSrc }) => {
  const [playerName, setPlayerName] = useState("")
  const [showNameInput, setShowNameInput] = useState(true)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (playerName.trim()) {
      const scoreData = {
        name: playerName.trim(),
        score: finalScore,
        date: new Date().toISOString(),
        isWin: isWin,
      }
      
      onSubmit(scoreData)
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  return (
    <div className={styles.gameOverOverlay}>
      <video className={styles.gameOverVideo} autoPlay loop muted>
        <source src={isWin ? winVideoSrc : loseVideoSrc} type="video/mp4" />
      </video>
      <div className={styles.gameOverModal}>
        <div className={styles.gameOverHeader}>
          <h1 className={`${styles.gameOverTitle} ${isWin ? styles.win : styles.lose}`}>
            {isWin ? "¡Venciste!" : "TE DERROTARON"}
          </h1>
          <div className={`${styles.gameOverIcon} ${isWin ? styles.bardockIcon : styles.FreezerIcon}`}></div>
        </div>

        <div className={styles.finalScore}>
          <span className={styles.scoreLabel}>PUNTUACIÓN FINAL:</span>
          <span className={styles.scoreValue}>{finalScore.toLocaleString()}</span>
        </div>

        {showNameInput ? (
          <form onSubmit={handleSubmit} className={styles.scoreForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="playerName">Ingresa tu nombre:</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nombre del Saiyajin..."
                maxLength={20}
                autoFocus
                className={styles.nameInput}
              />
            </div>

            <div className={styles.formButtons}>
              <button type="submit" className={styles.submitBtn} disabled={!playerName.trim()}>
                GUARDAR PUNTAJE
              </button>
              <button type="button" onClick={handleSkip} className={styles.skipBtn}>
                VOLVER AL MENÚ
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.formButtons}>
            <button onClick={handleSkip} className={styles.continueBtn}>
              VOLVER AL MENÚ
            </button>
          </div>
        )}

        <div className={styles.gameOverStats}>
          <p>{isWin ? "¡Has cambiado el destino!" : "Freezer ha destruido el planeta..."}</p>
          {finalScore > 0 && (
            <p className={styles.encouragement}>
              {finalScore >= 10000
                ? "¡Increíble puntuación!"
                : finalScore >= 5000
                  ? "¡Excelente trabajo!"
                  : finalScore >= 1000
                    ? "¡Buen intento!"
                    : "¡Sigue practicando!"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameOverForm