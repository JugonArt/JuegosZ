// explosionUtils.js - Utilidades para crear y gestionar explosiones

/**
 * Crea una nueva explosión
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {string} enemyType - Tipo de enemigo para determinar el tipo de explosión
 * @param {Object} enemy - Objeto enemigo completo (opcional)
 * @returns {Object} Objeto explosión
 */
export const createExplosion = (x, y, enemyType = 'normal', enemy = null) => {
  let explosionType = 'normal';
  let duration = 1000;

  // Determinar tipo de explosión basado en el enemigo
  if (enemy) {
    if (enemy.isBomberSquadron) {
      explosionType = 'large';
      duration = 1200;
    } else if (enemy.isRedFormation) {
      explosionType = 'medium';
      duration = 1000;
    } else if (enemy.isSpecialPatrol) {
      explosionType = 'medium';
      duration = 1000;
    } else if (enemy.maxHealth > 3) {
      explosionType = 'large';
      duration = 1200;
    } else if (enemy.maxHealth > 1) {
      explosionType = 'medium';
      duration = 1000;
    }
  } else {
    // Lógica alternativa basada en string
    switch(enemyType) {
      case 'bomber':
      case 'boss':
        explosionType = 'large';
        duration = 1200;
        break;
      case 'heavy':
      case 'special':
        explosionType = 'medium';
        duration = 1000;
        break;
      case 'small':
        explosionType = 'small';
        duration = 800;
        break;
      case 'huge':
        explosionType = 'huge';
        duration = 1500;
        break;
      default:
        explosionType = 'normal';
        duration = 1000;
    }
  }

  return {
    id: `explosion_${Date.now()}_${Math.random()}`,
    x: x,
    y: y,
    type: explosionType,
    duration: duration,
    createdAt: Date.now()
  };
};

/**
 * Hook personalizado para gestionar explosiones
 * @returns {Object} Objeto con explosions, addExplosion y cleanupExplosions
 */
export const useExplosions = () => {
  const [explosions, setExplosions] = React.useState([]);

  const addExplosion = React.useCallback((x, y, enemyType = 'normal', enemy = null) => {
    const newExplosion = createExplosion(x, y, enemyType, enemy);
    
    setExplosions(currentExplosions => [...currentExplosions, newExplosion]);

    // Limpiar la explosión después de su duración
    setTimeout(() => {
      setExplosions(currentExplosions => 
        currentExplosions.filter(explosion => explosion.id !== newExplosion.id)
      );
    }, newExplosion.duration);

    return newExplosion.id;
  }, []);

  const cleanupExplosions = React.useCallback(() => {
    const now = Date.now();
    setExplosions(currentExplosions => 
      currentExplosions.filter(explosion => 
        (now - explosion.createdAt) < explosion.duration
      )
    );
  }, []);

  // Limpiar explosiones expiradas cada segundo
  React.useEffect(() => {
    const interval = setInterval(cleanupExplosions, 1000);
    return () => clearInterval(interval);
  }, [cleanupExplosions]);

  return {
    explosions,
    addExplosion,
    cleanupExplosions
  };
};

/**
 * Ejemplo de cómo usar en tu componente de juego
 */
/*
// En tu componente principal del juego:
import { useExplosions } from './explosionUtils.js';

const GameComponent = () => {
  const { explosions, addExplosion } = useExplosions();
  
  // Cuando un enemigo muere
  const handleEnemyDestroyed = (enemy) => {
    // Crear explosión en la posición del enemigo
    addExplosion(
      enemy.x + enemy.width / 2,  // Centro X del enemigo
      enemy.y + enemy.height / 2, // Centro Y del enemigo
      null, // no usar string type
      enemy // pasar el objeto enemigo completo
    );
    
    // Resto de la lógica de destrucción del enemigo
    // ...
  };

  // Agregar explosions a tu gameData
  const gameData = {
    // ... otros datos
    explosions: explosions
  };

  return (
    <GameArea 
      gameData={gameData}
      // ... otras props
    />
  );
};
*/

/**
 * Ejemplo de integración en un hook de juego existente
 */
/*
// Si ya tienes un hook useGame o similar:
export const useGame = () => {
  // ... estado existente
  const { explosions, addExplosion } = useExplosions();

  const checkCollisions = useCallback(() => {
    // Lógica de colisiones existente...
    
    // Cuando detectes que un enemigo murió:
    const destroyEnemy = (enemy) => {
      // Crear explosión
      addExplosion(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        null,
        enemy
      );
      
      // Remover enemigo
      setEnemies(currentEnemies => 
        currentEnemies.filter(e => e.id !== enemy.id)
      );
    };
  }, [addExplosion]);

  return {
    // ... otros valores de retorno
    gameData: {
      // ... otros datos del juego
      explosions: explosions
    }
  };
};
*/

/**
 * Configuraciones predefinidas para diferentes tipos de explosiones
 */
export const EXPLOSION_CONFIGS = {
  small: {
    size: 40,
    duration: 800,
    particles: 8,
    colors: ['#ff4444', '#ff8800', '#ffff00']
  },
  normal: {
    size: 50,
    duration: 1000,
    particles: 10,
    colors: ['#ff4444', '#ff8800', '#ffff00']
  },
  medium: {
    size: 60,
    duration: 1000,
    particles: 12,
    colors: ['#ff6b35', '#f7931e', '#ffcc02']
  },
  large: {
    size: 80,
    duration: 1200,
    particles: 16,
    colors: ['#ff6b35', '#f7931e', '#ffcc02', '#fff200']
  },
  huge: {
    size: 100,
    duration: 1500,
    particles: 20,
    colors: ['#ff1744', '#ff6b35', '#f7931e', '#ffcc02', '#fff200']
  }
};

/**
 * Crea múltiples explosiones en cadena para efectos dramáticos
 * @param {number} centerX - Centro X de las explosiones
 * @param {number} centerY - Centro Y de las explosiones
 * @param {number} count - Número de explosiones
 * @param {number} radius - Radio de dispersión
 * @param {Function} addExplosion - Función para agregar explosiones
 * @param {string} type - Tipo de explosiones
 */
export const createChainExplosions = (centerX, centerY, count = 3, radius = 30, addExplosion, type = 'normal') => {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const angle = (360 / count) * i;
      const offsetX = Math.cos(angle * Math.PI / 180) * (radius * Math.random());
      const offsetY = Math.sin(angle * Math.PI / 180) * (radius * Math.random());
      
      addExplosion(
        centerX + offsetX,
        centerY + offsetY,
        type
      );
    }, i * 150); // Delay entre explosiones
  }
};

/**
 * Función para reproducir sonido de explosión (si tienes sistema de audio)
 * @param {string} explosionType - Tipo de explosión
 */
export const playExplosionSound = (explosionType) => {
  // Ejemplo de implementación si tienes un sistema de audio
  if (typeof window !== 'undefined' && window.audioSystem) {
    const soundMap = {
      small: 'explosion_small.wav',
      normal: 'explosion_normal.wav',
      medium: 'explosion_medium.wav',
      large: 'explosion_large.wav',
      huge: 'explosion_huge.wav'
    };
    
    const soundFile = soundMap[explosionType] || soundMap.normal;
    window.audioSystem.play(soundFile);
  }
};

/**
 * Efecto de screen shake para explosiones grandes
 * @param {string} explosionType - Tipo de explosión
 * @param {Function} setScreenShake - Función para activar screen shake
 */
export const triggerScreenShake = (explosionType, setScreenShake) => {
  const shakeIntensity = {
    small: 0,
    normal: 2,
    medium: 4,
    large: 6,
    huge: 10
  };
  
  const intensity = shakeIntensity[explosionType] || 0;
  if (intensity > 0 && setScreenShake) {
    setScreenShake(intensity);
  }
};

/**
 * Hook completo para manejar explosiones con efectos adicionales
 */
export const useAdvancedExplosions = (options = {}) => {
  const [explosions, setExplosions] = React.useState([]);
  const { enableSound = false, enableScreenShake = false, onScreenShake } = options;

  const addExplosion = React.useCallback((x, y, enemyType = 'normal', enemy = null) => {
    const newExplosion = createExplosion(x, y, enemyType, enemy);
    
    setExplosions(currentExplosions => [...currentExplosions, newExplosion]);

    // Efectos adicionales
    if (enableSound) {
      playExplosionSound(newExplosion.type);
    }
    
    if (enableScreenShake && onScreenShake) {
      triggerScreenShake(newExplosion.type, onScreenShake);
    }

    // Limpiar la explosión después de su duración
    setTimeout(() => {
      setExplosions(currentExplosions => 
        currentExplosions.filter(explosion => explosion.id !== newExplosion.id)
      );
    }, newExplosion.duration);

    return newExplosion.id;
  }, [enableSound, enableScreenShake, onScreenShake]);

  const addChainExplosion = React.useCallback((x, y, count = 3, radius = 30, type = 'normal') => {
    createChainExplosions(x, y, count, radius, addExplosion, type);
  }, [addExplosion]);

  const clearAllExplosions = React.useCallback(() => {
    setExplosions([]);
  }, []);

  return {
    explosions,
    addExplosion,
    addChainExplosion,
    clearAllExplosions
  };
};