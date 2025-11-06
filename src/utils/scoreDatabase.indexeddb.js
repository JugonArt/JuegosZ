// scoreDatabase.js - IndexedDB wrapper for persistent scores storage

const DB_NAME = 'JuegosZScores';
const DB_VERSION = 1;
const SPACE_INVADERS_STORE = 'spaceInvaders';
const SIMON_DICE_STORE = 'simonDice';

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create SpaceInvaders store if it doesn't exist
      if (!db.objectStoreNames.contains(SPACE_INVADERS_STORE)) {
        const spaceStore = db.createObjectStore(SPACE_INVADERS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        spaceStore.createIndex('puntuacion', 'puntuacion', { unique: false });
        spaceStore.createIndex('nivel', 'nivel', { unique: false });
        spaceStore.createIndex('nombre', 'nombre', { unique: false });
        spaceStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create SimonDice store if it doesn't exist
      if (!db.objectStoreNames.contains(SIMON_DICE_STORE)) {
        const simonStore = db.createObjectStore(SIMON_DICE_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        simonStore.createIndex('ronda', 'ronda', { unique: false });
        simonStore.createIndex('nivel', 'nivel', { unique: false });
        simonStore.createIndex('nombre', 'nombre', { unique: false });
        simonStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Save SpaceInvaders score
export const saveSpaceInvadersScore = async ({ nombre, nivel, puntuacion }) => {
  try {
    const db = await initDB();
    
    // Check for existing record with same name (case-insensitive)
    const existingScores = await getSpaceInvadersScores();
    const existing = existingScores.find(
      score => score.nombre.toLowerCase() === nombre.trim().toLowerCase()
    );

    const transaction = db.transaction([SPACE_INVADERS_STORE], 'readwrite');
    const store = transaction.objectStore(SPACE_INVADERS_STORE);

    const now = Date.now();

    // Overwrite only if new score is strictly greater than the existing one
    if (existing) {
      if ((puntuacion || 0) > (existing.puntuacion || 0)) {
        const updated = {
          ...existing,
          nombre: nombre.trim(),
          nivel: nivel || existing.nivel || 1,
          puntuacion: puntuacion || 0,
          timestamp: now,
        };
        return new Promise((resolve, reject) => {
          const request = store.put(updated);
          request.onsuccess = () => {
            window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { game: 'spaceinvaders' } }));
            resolve(request.result);
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        throw new Error('Este nombre está registrado con una puntuación mayor');
      }
    }

    // No existing record → add new
    const score = {
      nombre: nombre.trim(),
      nivel: nivel || 1,
      puntuacion: puntuacion || 0,
      timestamp: now,
    };

    return new Promise((resolve, reject) => {
      const request = store.add(score);
      request.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { game: 'spaceinvaders' } }));
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ScoreDB] Error saving SpaceInvaders score:', error);
    throw error;
  }
};

// Get all SpaceInvaders scores (sorted will be done in component)
export const getSpaceInvadersScores = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([SPACE_INVADERS_STORE], 'readonly');
    const store = transaction.objectStore(SPACE_INVADERS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ScoreDB] Error fetching SpaceInvaders scores:', error);
    return [];
  }
};

// Save SimonDice score
export const saveSimonDiceScore = async ({ nombre, nivel, ronda }) => {
  try {
    const db = await initDB();
    
    // Check for existing record with same name (case-insensitive)
    const existingScores = await getSimonDiceScores();
    const existing = existingScores.find(
      score => score.nombre.toLowerCase() === nombre.trim().toLowerCase()
    );

    const transaction = db.transaction([SIMON_DICE_STORE], 'readwrite');
    const store = transaction.objectStore(SIMON_DICE_STORE);

    const now = Date.now();

    // Overwrite only if new round is strictly greater than the existing one
    if (existing) {
      if ((ronda || 1) > (existing.ronda || 1)) {
        const updated = {
          ...existing,
          nombre: nombre.trim(),
          nivel: nivel || existing.nivel || 1,
          ronda: ronda || 1,
          timestamp: now,
        };
        return new Promise((resolve, reject) => {
          const request = store.put(updated);
          request.onsuccess = () => {
            window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { game: 'simondice' } }));
            resolve(request.result);
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        throw new Error('Este nombre está registrado con una ronda mayor');
      }
    }

    // No existing record → add new
    const score = {
      nombre: nombre.trim(),
      nivel: nivel || 1,
      ronda: ronda || 1,
      timestamp: now,
    };

    return new Promise((resolve, reject) => {
      const request = store.add(score);
      request.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { game: 'simondice' } }));
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ScoreDB] Error saving SimonDice score:', error);
    throw error;
  }
};

// Get all SimonDice scores (sorted will be done in component)
export const getSimonDiceScores = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([SIMON_DICE_STORE], 'readonly');
    const store = transaction.objectStore(SIMON_DICE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ScoreDB] Error fetching SimonDice scores:', error);
    return [];
  }
};

// Optional: Clear all scores (for testing/reset)
export const clearAllScores = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction(
      [SPACE_INVADERS_STORE, SIMON_DICE_STORE],
      'readwrite'
    );
    transaction.objectStore(SPACE_INVADERS_STORE).clear();
    transaction.objectStore(SIMON_DICE_STORE).clear();
    console.log('[ScoreDB] All scores cleared');
  } catch (error) {
    console.error('[ScoreDB] Error clearing scores:', error);
  }
};

// Helpers: get existing score by name (case-insensitive)
export const getSpaceInvadersScoreByName = async (nombre) => {
  try {
    const all = await getSpaceInvadersScores();
    const found = all.find(s => s.nombre.toLowerCase() === nombre.trim().toLowerCase());
    return found || null;
  } catch (_) {
    return null;
  }
};

export const getSimonDiceScoreByName = async (nombre) => {
  try {
    const all = await getSimonDiceScores();
    const found = all.find(s => s.nombre.toLowerCase() === nombre.trim().toLowerCase());
    return found || null;
  } catch (_) {
    return null;
  }
};

// Get player ranking position after saving
export const getSpaceInvadersRanking = async (nombre) => {
  try {
    const scores = await getSpaceInvadersScores();
    // Sort by puntuacion DESC
    const sorted = [...scores].sort((a, b) => (b.puntuacion || 0) - (a.puntuacion || 0));
    const position = sorted.findIndex(s => s.nombre.toLowerCase() === nombre.trim().toLowerCase());
    return position >= 0 ? position + 1 : null; // 1-based position
  } catch (_) {
    return null;
  }
};

export const getSimonDiceRanking = async (nombre) => {
  try {
    const scores = await getSimonDiceScores();
    // Sort by nivel DESC, then ronda DESC
    const sorted = [...scores].sort((a, b) => {
      if ((b.nivel || 0) !== (a.nivel || 0)) {
        return (b.nivel || 0) - (a.nivel || 0);
      }
      return (b.ronda || 0) - (a.ronda || 0);
    });
    const position = sorted.findIndex(s => s.nombre.toLowerCase() === nombre.trim().toLowerCase());
    return position >= 0 ? position + 1 : null; // 1-based position
  } catch (_) {
    return null;
  }
};
