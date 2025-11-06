"use client"

import { useState } from 'react'

const GameOver = ({
  gameMode,
  score,
  score2,
  onRestart,
  onBackToMenu,
  onSaveScore1942,
  player1Name: initialPlayer1Name = '',
  player2Name: initialPlayer2Name = ''
}) => {
  const [player1Name, setPlayer1Name] = useState(initialPlayer1Name || "")
  const [player2Name, setPlayer2Name] = useState(initialPlayer2Name || "")
  const [player1Saved, setPlayer1Saved] = useState(false)
  const [player2Saved, setPlayer2Saved] = useState(false)
  
  const isSingle = gameMode === "single"
  const isMultiplayer = gameMode === "multiplayer" || gameMode === "two-player"

  const isWin = isSingle && score > 0
  const isTie = isMultiplayer && score === score2
  const player1Wins = isMultiplayer && score > score2
  const player2Wins = isMultiplayer && score2 > score
  const winner = player1Wins ? 1 : player2Wins ? 2 : null

  const player1IsWin = player1Wins || isTie
  const player2IsWin = player2Wins || isTie

  const handleSaveScore = async (playerNum) => {
    if (playerNum === 1 && player1Name.trim()) {
      console.log(`Guardando puntaje del jugador 1: ${player1Name} con un score de ${score}`);
      await onSaveScore1942(Date.now().toString(), player1Name, score); 
      setPlayer1Saved(true);
    } else if (playerNum === 2 && player2Name.trim()) {
      console.log(`Guardando puntaje del jugador 2: ${player2Name} con un score de ${score2}`);
      await onSaveScore1942(Date.now().toString(), player2Name, score2); 
      setPlayer2Saved(true);
    }
  };

  // Modo Single Player
  if (isSingle) {
    return (
      <div className="game-over-overlay">
        <video className="game-over-video" autoPlay loop muted playsInline  style={{ pointerEvents: 'none' }}>
          <source src="/videos/GameOver.webm" type="video/webm" />
          <source src="/videos/GameOver.mp4" type="video/mp4" />
          Tu navegador no soporta video en HTML5.
        </video>
        <div className="game-over-modal">
          <div className="game-over-header">
            <h1 className={`game-over-title ${isWin ? "win" : "lose"}`}>{isWin ? "¡Venciste!" : "TE DERROTARON"}</h1>
            <div className={`game-over-icon ${isWin ? "bardockIcon" : "FreezerIcon"}`}></div>
          </div>
          <div className="final-score">
            <span className="score-label">PUNTUACIÓN FINAL:</span>
            <span className="score-value">{score.toLocaleString()}</span>
          </div>
          {!player1Saved ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveScore(1) }} className="score-form">
              <div className="input-group">
                <label htmlFor="playerName">Ingresa tu nombre:</label>
                <input
                  type="text"
                  id="playerName"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="Nombre del Saiyajin..."
                  maxLength={20}
                  autoFocus
                  className="name-input"
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="submit-btn" disabled={!player1Name.trim()}>
                  GUARDAR PUNTAJE
                </button>
                <button type="button" onClick={onBackToMenu} className="skip-btn">
                  VOLVER AL MENÚ
                </button>
              </div>
            </form>
          ) : (
            <div className="form-buttons">
              <button onClick={onBackToMenu} className="continue-btn">
                VOLVER AL MENÚ
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Modo Multiplayer (incluye "two-player")
  if (isMultiplayer) {
    if (player1Saved && player2Saved) {
      return (
        <div className="game-over-overlay">
          <video className="game-over-video" autoPlay loop muted playsInline>
            <source src="/videos/GameOver.webm" type="video/webm" />
            <source src="/videos/GameOver.mp4" type="video/mp4" />
            Tu navegador no soporta video en HTML5.
          </video>
          <div className="game-over-modal">
            <div className="game-over-header">
              <h1 className="game-over-title win">
                {winner ? `¡JUGADOR ${winner} HIZO UN MAYOR PUNTAJE!` : "¡EMPATE!"}
              </h1>
              <div className="game-over-icon bardockIcon"></div>
            </div>
            <div className="two-player-summary">
              <div className="player-summary">
                <h3>JUGADOR 1</h3>
                <p className="player-name">{player1Name || "Anónimo"}</p>
                <p className="player-score">{score.toLocaleString()}</p>
              </div>
              <div className="vs-separator">VS</div>
              <div className="player-summary">
                <h3>JUGADOR 2</h3>
                <p className="player-name">{player2Name || "Anónimo"}</p>
                <p className="player-score">{score2.toLocaleString()}</p>
              </div>
            </div>
            <div className="form-buttons">
              <button onClick={onBackToMenu} className="continue-btn">
                VOLVER AL MENÚ
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Formulario para jugadores que aún no guardaron sus nombres
    return (
      <div className="game-over-overlay">
        <video className="game-over-video" autoPlay loop muted playsInline>
          <source src="/videos/GameOver.webm" type="video/webm" />
          <source src="/videos/GameOver.mp4" type="video/mp4" />
          Tu navegador no soporta video en HTML5.
        </video>
        <div className="game-over-modal dual-player-modal players2">
          <div className="game-over-header">
            <h1 className="game-over-title win players2title">
              {winner ? `¡JUGADOR ${winner} HIZO UN MAYOR PUNTAJE!` : "¡EMPATE!"}
            </h1>
          </div>
          <div className="dual-forms-container players2dual">
            {/* Formulario Jugador 1 */}
            <div className={`player-form-section ${player1IsWin ? 'winner' : 'loser'}`}>
              <div className="player-form-header">
                <h2 className={`player-form-title ${player1IsWin ? "win" : "lose"}`}>JUGADOR 1</h2>
                <h3 className={`player-form-subtitle ${player1IsWin ? "win" : "lose"}`}>
                  {player1IsWin ? "¡VENCISTE!" : "TE DERROTARON"}
                </h3>
                <div className={`player-form-icon ${player1IsWin ? "bardockIcon" : "FreezerIcon"}`}></div>
              </div>
              <div className="final-score">
                <span className="score-label">PUNTUACIÓN:</span>
                <span className="score-value">{score.toLocaleString()}</span>
              </div>
              {!player1Saved ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveScore(1) }} className="score-form">
                  <div className="input-group">
                    <label htmlFor="player1Name">Ingresa tu nombre:</label>
                    <input
                      type="text"
                      id="player1Name"
                      value={player1Name}
                      onChange={(e) => setPlayer1Name(e.target.value)}
                      placeholder="Saiyajin 1..."
                      maxLength={20}
                      className="name-input"
                    />
                  </div>
                  <button type="submit" className="submit-btn" disabled={!player1Name.trim()}>
                    GUARDAR PUNTAJE
                  </button>
                </form>
              ) : (
                <div className="player-saved">
                  <p className="saved-name">{player1Name}</p>
                  <p className="saved-status">✓ PUNTAJE GUARDADO</p>
                </div>
              )}
            </div>

            {/* Separador VS */}
            <div className="vs-divider">VS</div>

            {/* Formulario Jugador 2 */}
            <div className={`player-form-section ${player2IsWin ? 'winner' : 'loser'}`}>
              <div className="player-form-header">
                <h2 className={`player-form-title ${player2IsWin ? "win" : "lose"}`}>JUGADOR 2</h2>
                <h3 className={`player-form-subtitle ${player2IsWin ? "win" : "lose"}`}>
                  {player2IsWin ? "¡VENCISTE!" : "TE DERROTARON"}
                </h3>
                <div className={`player-form-icon ${player2IsWin ? "bardockIcon" : "FreezerIcon"}`}></div>
              </div>
              <div className="final-score">
                <span className="score-label">PUNTUACIÓN:</span>
                <span className="score-value">{score2.toLocaleString()}</span>
              </div>
              {!player2Saved ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveScore(2) }} className="score-form">
                  <div className="input-group">
                    <label htmlFor="player2Name">Ingresa tu nombre:</label>
                    <input
                      type="text"
                      id="player2Name"
                      value={player2Name}
                      onChange={(e) => setPlayer2Name(e.target.value)}
                      placeholder="Saiyajin 2..."
                      maxLength={20}
                      className="name-input"
                    />
                  </div>
                  <button type="submit" className="submit-btn" disabled={!player2Name.trim()}>
                    GUARDAR PUNTAJE
                  </button>
                </form>
              ) : (
                <div className="player-saved">
                  <p className="saved-name">{player2Name}</p>
                  <p className="saved-status">✓ PUNTAJE GUARDADO</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-buttons">
            <button onClick={onBackToMenu} className="skip-btn">
              VOLVER AL MENÚ
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default GameOver
