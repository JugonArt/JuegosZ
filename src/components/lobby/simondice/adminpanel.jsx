import React, { useState } from 'react';
import styles from '../../styles/simondice/simon.module.css';

const AdminPanel = ({ onStartAdminGame, onClose, playerName = 'Admin', calculateTotalPatterns, calculateSpeed, calculateTimings }) => {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedRound, setSelectedRound] = useState(1);

  const levelConfig = {
    1: { maxRounds: 5, name: "Principiante" },
    2: { maxRounds: 8, name: "Intermedio" },
    3: { maxRounds: 10, name: "Experto" }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedRound > levelConfig[selectedLevel].maxRounds) {
      alert(`El nivel ${selectedLevel} solo tiene ${levelConfig[selectedLevel].maxRounds} rondas máximo`);
      return;
    }

    onStartAdminGame(playerName, selectedLevel, selectedRound);
  };

  const handleTestVictoryLevel1 = () => {
    // Simular victoria al completar nivel 1 (transición 1→2 con video)
    onStartAdminGame(playerName, 1, 5, 'levelCompleted');
  };

  const handleTestVictoryLevel2 = () => {
    // Simular victoria al completar nivel 2 (transición 2→3)
    onStartAdminGame(playerName, 2, 8, 'levelCompleted');
  };

  const handleTestVictoryLevel3 = () => {
    // Simular victoria al completar nivel 3 (victoria final)
    onStartAdminGame(playerName, 3, 10, 'levelCompleted');
  };

  const handleTestWin = () => {
    // Simular victoria directa
    onStartAdminGame(playerName, 3, 10, 'win');
  };

  const handleTestLose = () => {
    // Simular derrota directa
    onStartAdminGame(playerName, selectedLevel, selectedRound, 'lose');
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPanel}>
        <h3>🎮 Modo Administrador - Simon Dice</h3>
        <p style={{color: '#FFA500', fontSize: '0.9em', marginBottom: '10px', fontStyle: 'italic'}}>
          Código activado: "ginyurana"
        </p>
        <p style={{color: '#90EE90', fontSize: '0.85em', marginBottom: '20px'}}>
          👤 Jugador: <strong>{playerName}</strong>
        </p>

        <div className={styles.adminLevelConfig}>
          <div className={styles.adminInputGroup}>
            <label htmlFor="adminLevel">Nivel:</label>
            <select
              id="adminLevel"
              value={selectedLevel}
              onChange={(e) => {
                const newLevel = parseInt(e.target.value);
                setSelectedLevel(newLevel);
                setSelectedRound(1); // Reset round when level changes
              }}
              className={styles.adminSelect}
            >
              {Object.entries(levelConfig).map(([level, config]) => (
                <option key={level} value={level}>
                  Nivel {level} - {config.name} ({config.maxRounds} rondas)
                </option>
              ))}
            </select>
          </div>

          <div className={styles.adminInputGroup}>
            <label htmlFor="adminRound">Ronda:</label>
            <select
              id="adminRound"
              value={selectedRound}
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              className={styles.adminSelect}
            >
              {Array.from({ length: levelConfig[selectedLevel].maxRounds }, (_, i) => i + 1).map(round => (
                <option key={round} value={round}>
                  Ronda {round}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.adminInfo}>
          <p>🎯 Nivel seleccionado: <strong>{levelConfig[selectedLevel].name}</strong></p>
          <p>🎲 Ronda: <strong>{selectedRound}/{levelConfig[selectedLevel].maxRounds}</strong></p>
          <p>🧩 Patrones totales: <strong>{calculateTotalPatterns ? calculateTotalPatterns(selectedLevel, selectedRound) : 'N/A'}</strong></p>
          {calculateTimings ? (() => {
            const timings = calculateTimings(selectedLevel, selectedRound);
            return (
              <>
                <p>💡 Iluminación: <strong>{timings.illumination}ms</strong> | ⏸️ Pausa: <strong>{timings.interval}ms</strong></p>
                <p>⚡ Total por patrón: <strong>{timings.total}ms</strong></p>
                <p>🕐 Secuencia de 5: <strong>{(timings.total * 5 / 1000).toFixed(1)}s</strong></p>
              </>
            );
          })() : (
            <>
              <p>⚡ Tiempo por patrón: <strong>{calculateSpeed ? calculateSpeed(selectedLevel, selectedRound) : 'N/A'}</strong>ms</p>
              <p>🕐 Secuencia completa (~5 patrones): <strong>{calculateSpeed ? `~${((calculateSpeed(selectedLevel, selectedRound) * 5) / 1000).toFixed(1)}s` : 'N/A'}</strong></p>
            </>
          )}
          {selectedLevel === 3 && selectedRound >= 7 && (
            <p style={{color: '#FF6B6B', fontSize: '0.85em', fontStyle: 'italic'}}>
              {selectedRound === 9 ? 
                '🚀 ULTRA-RÁPIDO: 200ms + 50ms = 250ms total' : 
                '⚡ Intervalos súper-cortos activados'
              }
            </p>
          )}
        </div>

        <div className={styles.adminButtons}>
          <button 
            onClick={handleSubmit}
            className={styles.adminStartButton}
          >
            🚀 Iniciar en Nivel {selectedLevel} - Ronda {selectedRound}
          </button>
          
          <div className={styles.adminTestButtons}>
            <button 
              onClick={handleTestWin}
              className={styles.adminTestWin}
            >
              🏆 Victoria Instantánea
            </button>
            <button 
              onClick={handleTestLose}
              className={styles.adminTestLose}
            >
              💀 Derrota Instantánea
            </button>
          </div>

          <div className={styles.adminVictoryButtons}>
            <h4 style={{color: '#FFD700', fontSize: '0.9em', margin: '10px 0 5px 0'}}>🎬 Transiciones de Victoria:</h4>
            <button 
              onClick={handleTestVictoryLevel1}
              className={styles.adminVictoryLevel1}
            >
              🐉 Victoria Nivel 1 → 2 (Con Video)
            </button>
            <button 
              onClick={handleTestVictoryLevel2}
              className={styles.adminVictoryLevel2}
            >
              ⚡ Victoria Nivel 2 → 3
            </button>
            <button 
              onClick={handleTestVictoryLevel3}
              className={styles.adminVictoryLevel3}
            >
              🏆 Victoria Nivel 3 (Final)
            </button>
          </div>

          <div className={styles.adminUtilityButtons}>
            <button 
              onClick={() => {
                console.clear();
                console.log('🧪 TABLA DE TIMINGS SUPER AGRESIVA:');
                console.log('==========================================');
                
                const levels = [
                  [1, 1], [1, 3], [1, 5], 
                  [2, 3], [2, 6], [2, 8], 
                  [3, 3], [3, 6], [3, 9], [3, 10]
                ];
                
                levels.forEach(([level, round]) => {
                  if (calculateTimings) {
                    const timings = calculateTimings(level, round);
                    const patternCount = calculateTotalPatterns ? calculateTotalPatterns(level, round) : 0;
                    
                    // Calcular aceleración vs nivel 1 ronda 1
                    const baseTimings = calculateTimings(1, 1);
                    const speedup = (baseTimings.total / timings.total).toFixed(1);
                    
                    console.log(`🎯 Level ${level}, Round ${round} (${patternCount} patrones):`);
                    console.log(`   💡 Iluminación: ${timings.illumination}ms`);
                    console.log(`   ⏸️ Pausa: ${timings.interval}ms`);
                    console.log(`   📊 Total: ${timings.total}ms (${speedup}x más rápido)`);
                    console.log(`   🕐 Secuencia de 10: ${(timings.total * 10 / 1000).toFixed(1)}s`);
                    console.log('   ');
                  } else {
                    console.log(`Level ${level}, Round ${round}: Funciones no disponibles`);
                  }
                });
                
                console.log('⚡ INTERVALOS ULTRA-CORTOS:');
                console.log('- Base: 1400ms iluminación + 300ms intervalo (SÚPER CORTO)');
                console.log('- Reducción: 9% más rápido por patrón (0.91^patrones)');
                console.log('- Objetivo: Level 3, Round 9 = 200ms + 50ms');
                console.log('- Intervalos mínimos: 50ms (casi sin pausa)');
                console.log('- Secuencias súper fluidas y rápidas');
                
                // Verificación matemática del objetivo
                if (calculateTimings) {
                  const targetTimings = calculateTimings(3, 9);
                  console.log('🧮 VERIFICACIÓN MATEMÁTICA:');
                  console.log(`   1400 × 0.91^21 = ${Math.round(1400 * Math.pow(0.91, 21))}ms`);
                  console.log(`   Resultado real: ${targetTimings.illumination}ms`);
                  console.log(`   ¿Objetivo alcanzado? ${targetTimings.illumination === 200 ? '✅ SÍ' : '❌ NO'}`);
                }
                
                alert('📊 Revisa la consola del navegador (F12) para ver los timings detallados!');
              }}
              style={{backgroundColor: '#4CAF50', fontSize: '0.8em', padding: '5px 10px'}}
            >
              🧪 Ver Timings (Consola)
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className={styles.adminCloseButton}
        >
          ❌ Cerrar Panel
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;