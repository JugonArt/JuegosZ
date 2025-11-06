"use client"
import { useState } from 'react'
import styles from '../../styles/spaceinvaders/gameover.module.css';

const TwoPlayerGameOverForm = ({ 
  player1Results, 
  player2Results, 
  player1InitialName = "",
  player2InitialName = "",
  onSubmit, 
  onSkip, 
  GameOverVideoSrc
}) => {
  const [player1Name, setPlayer1Name] = useState(player1InitialName)
  const [player2Name, setPlayer2Name] = useState(player2InitialName)
  const [player1Saved, setPlayer1Saved] = useState(false)
  const [player2Saved, setPlayer2Saved] = useState(false)
  const [player1Error, setPlayer1Error] = useState('')
  const [player2Error, setPlayer2Error] = useState('')

  // Determinar el ganador
  const winnerName = player1Results?.score > player2Results?.score ? (player1InitialName || "JUGADOR 1") : 
                    player1Results?.score < player2Results?.score ? (player2InitialName || "JUGADOR 2") : 
                    null; // Empate
  
  // Mantener compatibilidad con código existente
  const winner = player1Results?.score > player2Results?.score ? 1 : 
                player1Results?.score < player2Results?.score ? 2 : 
                null; // Empate

  const handlePlayer1Submit = (e) => {
    e.preventDefault()
    setPlayer1Error('')
    
    if (player1Name.trim()) {
      // Validar que los nombres no sean iguales (si el jugador 2 ya guardó)
      if (player2Saved && player1Name.trim().toLowerCase() === player2Name.trim().toLowerCase()) {
        setPlayer1Error('No pueden jugar dos personas con un mismo nombre.')
        return
      }
      
      const scoreData = {
        name: player1Name.trim(),
        score: player1Results.score,
        date: new Date().toISOString(),
        isWin: player1Results.win,
        player: 1
      }

      // Guardar en localStorage
      try {
        const existingScores = JSON.parse(localStorage.getItem("spaceInvadersScores") || "[]")
        existingScores.push(scoreData)
        existingScores.sort((a, b) => b.score - a.score)
        localStorage.setItem("spaceInvadersScores", JSON.stringify(existingScores.slice(0, 20)))
      } catch (error) {
        console.log("No se pudo guardar el score del jugador 1")
      }

      setPlayer1Saved(true)
      checkBothCompleted()
    }
  }

  const handlePlayer2Submit = (e) => {
    e.preventDefault()
    setPlayer2Error('')
    
    if (player2Name.trim()) {
      // Validar que los nombres no sean iguales (si el jugador 1 ya guardó)
      if (player1Saved && player2Name.trim().toLowerCase() === player1Name.trim().toLowerCase()) {
        setPlayer2Error('No pueden jugar dos personas con un mismo nombre.')
        return
      }
      
      const scoreData = {
        name: player2Name.trim(),
        score: player2Results.score,
        date: new Date().toISOString(),
        isWin: player2Results.win,
        player: 2
      }

      // Guardar en localStorage
      try {
        const existingScores = JSON.parse(localStorage.getItem("spaceInvadersScores") || "[]")
        existingScores.push(scoreData)
        existingScores.sort((a, b) => b.score - a.score)
        localStorage.setItem("spaceInvadersScores", JSON.stringify(existingScores.slice(0, 20)))
      } catch (error) {
        console.log("No se pudo guardar el score del jugador 2")
      }

      setPlayer2Saved(true)
      checkBothCompleted()
    }
  }

  const checkBothCompleted = () => {
    // Usar setTimeout para asegurar que el estado se actualice
    setTimeout(() => {
      if (player1Saved && player2Saved) {
        onSubmit({ player1Name, player2Name, winner })
      }
    }, 100)
  }

  const handleSkip = () => {
    onSkip()
  }

  // Mostrar resumen final si ambos jugadores han completado
  if (player1Saved && player2Saved) {
    return (
      <div className={styles.gameOverOverlay}>
        <video className={styles.gameOverVideo} autoPlay loop muted>
          <source src={GameOverVideoSrc} type="video/mp4" />
        </video>
        <div className={styles.gameOverModal}>
          <div className={styles.gameOverHeader}>
            <h1 className={`${styles.gameOverTitle} ${styles.win}`}>
              {winnerName ? `¡${winnerName} HIZO UN MAYOR PUNTAJE!` : "¡EMPATE!"}
            </h1>
            <div className={`${styles.gameOverIcon} ${styles.bardockIcon}`}></div>
          </div>

          <div className={styles.twoPlayerSummary}>
            <div className={styles.playerSummary}>
              <h3>{player1InitialName || "JUGADOR 1"}</h3>
              <p className={styles.playerName}>{player1Name || "Anónimo"}</p>
              <p className={styles.playerScore}>{player1Results?.score.toLocaleString()}</p>
            </div>
            
            <div className={styles.vsSeparator}>VS</div>
            
            <div className={styles.playerSummary}>
              <h3>{player2InitialName || "JUGADOR 2"}</h3>
              <p className={styles.playerName}>{player2Name || "Anónimo"}</p>
              <p className={styles.playerScore}>{player2Results?.score.toLocaleString()}</p>
            </div>
          </div>

          <div className={styles.formButtons}>
            <button onClick={handleSkip} className={styles.continueBtn}>
              VOLVER AL MENÚ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar formularios lado a lado
  return (
    <div className={styles.gameOverOverlay}>
      <video className={styles.gameOverVideo} autoPlay loop muted>
        <source src={GameOverVideoSrc} type="video/mp4" />
      </video>
      <div className={`${styles.gameOverModal} ${styles.dualPlayerModal} ${styles.players2}`}>
        <div className={styles.gameOverHeader}>
          <h1 className={`${styles.gameOverTitle} ${styles.win} ${styles.players2title}`}>
            {winnerName ? `¡${winnerName} HIZO UN MAYOR PUNTAJE!!` : "¡EMPATE!"}
          </h1>
        </div>

        <div className={`${styles.dualFormsContainer} ${styles.players2dual}`}>
          {/* Formulario Jugador 1 */}
          <div className={`${styles.playerFormSection} ${player1Results?.win ? styles.winner : styles.loser}`}>
            <div className={styles.playerFormHeader}>
              <h2 className={`${styles.playerFormTitle} ${player1Results?.win ? styles.win : styles.lose}`}>
                {player1InitialName || "JUGADOR 1"}
              </h2>
              <h3 className={`${styles.playerFormSubtitle} ${player1Results?.win ? styles.win : styles.lose}`}>
                {player1Results?.win ? "¡VENCISTE!" : "TE DERROTARON"}
              </h3>
              <div className={`${styles.playerFormIcon} ${player1Results?.win ? styles.bardockIcon : styles.FreezerIcon}`}></div>
            </div>

            <div className={styles.finalScore}>
              <span className={styles.scoreLabel}>PUNTUACIÓN:</span>
              <span className={styles.scoreValue}>{player1Results?.score.toLocaleString()}</span>
            </div>

            {!player1Saved ? (
              <form onSubmit={handlePlayer1Submit} className={styles.scoreForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="player1Name">Ingresa tu nombre:</label>
                  <input
                    type="text"
                    id="player1Name"
                    value={player1Name}
                    onChange={(e) => {
                      setPlayer1Name(e.target.value)
                      setPlayer1Error('')
                    }}
                    placeholder="Saiyajin 1..."
                    maxLength={20}
                    className={styles.nameInput}
                  />
                </div>
                {player1Error && (
                  <div className={styles.errorMessage}>
                    {player1Error}
                  </div>
                )}
                <button type="submit" className={styles.submitBtn} disabled={!player1Name.trim()}>
                  GUARDAR PUNTAJE
                </button>
              </form>
            ) : (
              <div className={styles.playerSaved}>
                <p className={styles.savedName}>{player1Name}</p>
                <p className={styles.savedStatus}>✓ PUNTAJE GUARDADO</p>
              </div>
            )}
          </div>

          {/* Separador VS */}
          <div className={styles.vsDivider}>VS</div>

          {/* Formulario Jugador 2 */}
          <div className={`${styles.playerFormSection} ${player2Results?.win ? styles.winner : styles.loser}`}>
            <div className={styles.playerFormHeader}>
              <h2 className={`${styles.playerFormTitle} ${player2Results?.win ? styles.win : styles.lose}`}>
                {player2InitialName || "JUGADOR 2"}
              </h2>
              <h3 className={`${styles.playerFormSubtitle} ${player2Results?.win ? styles.win : styles.lose}`}>
                {player2Results?.win ? "¡VENCISTE!" : "TE DERROTARON"}
              </h3>
              <div className={`${styles.playerFormIcon} ${player2Results?.win ? styles.bardockIcon : styles.FreezerIcon}`}></div>
            </div>

            <div className={styles.finalScore}>
              <span className={styles.scoreLabel}>PUNTUACIÓN:</span>
              <span className={styles.scoreValue}>{player2Results?.score.toLocaleString()}</span>
            </div>

            {!player2Saved ? (
              <form onSubmit={handlePlayer2Submit} className={styles.scoreForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="player2Name">Ingresa tu nombre:</label>
                  <input
                    type="text"
                    id="player2Name"
                    value={player2Name}
                    onChange={(e) => {
                      setPlayer2Name(e.target.value)
                      setPlayer2Error('')
                    }}
                    placeholder="Saiyajin 2..."
                    maxLength={20}
                    className={styles.nameInput}
                  />
                </div>
                {player2Error && (
                  <div className={styles.errorMessage}>
                    {player2Error}
                  </div>
                )}
                <button type="submit" className={styles.submitBtn} disabled={!player2Name.trim()}>
                  GUARDAR PUNTAJE
                </button>
              </form>
            ) : (
              <div className={styles.playerSaved}>
                <p className={styles.savedName}>{player2Name}</p>
                <p className={styles.savedStatus}>✓ PUNTAJE GUARDADO</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.formButtons}>
          <button onClick={handleSkip} className={styles.skipBtn}>
            VOLVER AL MENÚ
          </button>
        </div>
      </div>
    </div>
  )
}

export default TwoPlayerGameOverForm