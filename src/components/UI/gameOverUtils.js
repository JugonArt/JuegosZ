// Utilidades compartidas para componentes de Game Over

// Validar si un nombre es válido (no vacío, no genérico)
export const isValidPlayerName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return false;
  
  // Lista de nombres genéricos que no consideramos válidos
  const genericNames = ['invitado', 'guest', 'player', 'jugador', 'user', 'usuario', 'bardock'];

  // Nombres generados por el juego como "Jugador 1", "Player 1" no deben contarse como nombres válidos
  const generatedNamePattern = /^\s*(jugador|player)\s*\d+\s*$/i;

  if (generatedNamePattern.test(trimmedName)) return false;

  return !genericNames.includes(trimmedName.toLowerCase());
};

// Configuración específica por juego
export const getGameConfig = (gameType) => {
  const configs = {
    spaceinvaders: {
      winTitle: "¡FREEZER FUE DERROTADO!",
      loseTitle: "BARDOCK HA MUERTO",
      winSubtitle: "Has reescrito el destino del planeta",
      loseSubtitle: "Freezer ha destruido el planeta",
      videoSrc: "/videos/BardockWin.mp4"
    },
    1942: {
      winTitle: "¡MISIÓN CUMPLIDA!",
      loseTitle: "PILOTO DERRIBADO",
      winSubtitle: "Has completado tu misión de combate",
      loseSubtitle: "Tu avión ha sido destruido en combate",
      videoSrc: "/videos/BardockWin.mp4"
    },
    simondice: {
      winTitle: "¡SECUENCIA PERFECTA!",
      loseTitle: "SECUENCIA FALLIDA",
      winSubtitle: "Has invocado a Super Shenlong",
      loseSubtitle: "No has podido pedir tu deseo",
      videoSrc: "/videos/BardockWin.mp4"
    },
    ppt: {
      winTitle: "¡VICTORIA!",
      loseTitle: "DERROTA",
      winSubtitle: "Serás el primero en luchar",
      loseSubtitle: "Tendrás que esperar tu turno",
      videoSrc: "/videos/BardockWin.mp4"
    }
  };

  return configs[gameType] || configs.spaceinvaders;
};

// Obtener información específica del juego para mostrar
export const getGameSpecificInfo = (gameType, gameSpecificData = {}) => {
  switch(gameType) {
    case 'simondice':
      return {
        level: gameSpecificData.level || 1,
        round: gameSpecificData.round || 1,
        patterns: gameSpecificData.patterns || 0
      };
    
    case 'ppt':
      return {
        opponentLives: gameSpecificData.opponentLives || 0,
        rounds: gameSpecificData.rounds
      };
    
    case '1942':
      return {
        level: gameSpecificData.level || 1,
        enemiesDestroyed: gameSpecificData.enemiesDestroyed || 0,
        powerUpsCollected: gameSpecificData.powerUpsCollected || 0
      };
    
    case 'spaceinvaders':
      return {
        level: gameSpecificData.level || 1,
        aliensDestroyed: gameSpecificData.aliensDestroyed || 0
      };
    
    default:
      return {};
  }
};

// Renderizar contenido específico del juego
export const renderGameSpecificContent = (gameType, gameSpecificData = {}, styles = {}) => {
  const info = getGameSpecificInfo(gameType, gameSpecificData);
  
  switch(gameType) {
    case 'simondice':
      return (
        <div className={styles.gameSpecificInfo}>
          <p>Nivel alcanzado: <span className={styles.highlight}>{info.level}</span></p>
          <p>Ronda alcanzada: <span className={styles.highlight}>{info.round}</span></p>
          <p>Patrones completados: <span className={styles.highlight}>{info.patterns}</span></p>
        </div>
      );
    
    case 'ppt':
      return (
        <div className={styles.gameSpecificInfo}>
          {info.rounds && (
            <p>Rondas jugadas: <span className={styles.highlight}>{info.rounds}</span></p>
          )}
          <p>Resultado del duelo completado</p>
        </div>
      );
    
    case '1942':
      return (
        <div className={styles.gameSpecificInfo}>
          <p>Nivel alcanzado: <span className={styles.highlight}>{info.level}</span></p>
          <p>Enemigos destruidos: <span className={styles.highlight}>{info.enemiesDestroyed}</span></p>
          {info.powerUpsCollected > 0 && (
            <p>Power-ups recolectados: <span className={styles.highlight}>{info.powerUpsCollected}</span></p>
          )}
        </div>
      );
    
    case 'spaceinvaders':
      return (
        <div className={styles.gameSpecificInfo}>
          <p>Nivel alcanzado: <span className={styles.highlight}>{info.level || 1}</span></p>
        </div>
      );
    
    default:
      return null;
  }
};

// Generar títulos personalizados
export const getPersonalizedTitle = (config, isWin, playerName, gameMode, isSinglePlayer) => {
  // Si es single player y hay nombre válido
  if ((gameMode === 'single' || gameMode === true || isSinglePlayer) && isValidPlayerName(playerName)) {
    if (isWin) {
      return `¡GANASTE, ${playerName.toUpperCase()}!`;
    } else {
      return `PERDISTE, ${playerName.toUpperCase()}`;
    }
  }
  
  // Usar títulos originales del juego
  return isWin ? config.winTitle : config.loseTitle;
};

// Generar subtítulos personalizados
export const getPersonalizedSubtitle = (config, isWin, hasExistingNames, playerName, gameMode, isSinglePlayer) => {
  if (!hasExistingNames) {
    return isWin ? config.winSubtitle : config.loseSubtitle;
  }
  
  // Si hay nombres válidos existentes, usar subtítulos menos genéricos
  if ((gameMode === 'single' || gameMode === true || isSinglePlayer) && isValidPlayerName(playerName)) {
    if (isWin) {
      return "¡Gran batalla!";
    } else {
      return "¡Sigue entrenando!";
    }
  }
  
  return isWin ? config.winSubtitle : config.loseSubtitle;
};

// Función helper para manejar guardado de scores
export const createSaveScoreHandler = (onSaveScore, setPlayerSaved) => {
  return async (playerData) => {
    const { playerNum, name, score, gameType, gameMode, gameSpecificData, isWin } = playerData;
    
    if (name.trim() && onSaveScore) {
      await onSaveScore({
        playerNum,
        name: name.trim(),
        score,
        gameType,
        gameMode,
        gameSpecificData,
        isWin
      });
      
      setPlayerSaved(true);
    }
  };
};