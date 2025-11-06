// scoreDatabase.firebase.js - Firebase Firestore wrapper for persistent scores storage
// Mantiene la misma interfaz que scoreDatabase.js pero usando Firebase en lugar de IndexedDB

import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  doc,
  orderBy,
  limit
} from 'firebase/firestore';

const SPACE_INVADERS_COLLECTION = 'spaceInvaders';
const SIMON_DICE_COLLECTION = 'simonDice';

// Helper: Normalizar nombre para búsqueda case-insensitive
const normalizeNameForSearch = (nombre) => nombre.trim().toLowerCase();

// Save SpaceInvaders score
export const saveSpaceInvadersScore = async ({ nombre, nivel, puntuacion }) => {
  try {
    const normalizedName = normalizeNameForSearch(nombre);
    
    // Buscar registro existente con el mismo nombre (case-insensitive)
    const q = query(
      collection(db, SPACE_INVADERS_COLLECTION),
      where('nombreNormalizado', '==', normalizedName)
    );
    const snapshot = await getDocs(q);
    
    const now = Date.now();
    
    if (!snapshot.empty) {
      // Ya existe un registro con este nombre
      const existingDoc = snapshot.docs[0];
      const existing = existingDoc.data();
      
      // Solo actualizar si la nueva puntuación es mayor
      if ((puntuacion || 0) > (existing.puntuacion || 0)) {
        await updateDoc(doc(db, SPACE_INVADERS_COLLECTION, existingDoc.id), {
          nombre: nombre.trim(),
          nivel: nivel || existing.nivel || 1,
          puntuacion: puntuacion || 0,
          timestamp: now
        });
        
        // Disparar evento de actualización
        window.dispatchEvent(new CustomEvent('scoreUpdated', { 
          detail: { game: 'spaceinvaders' } 
        }));
        
        return existingDoc.id;
      } else {
        throw new Error('Este nombre está registrado con una puntuación mayor');
      }
    }
    
    // No existe, crear nuevo registro
    const newScore = {
      nombre: nombre.trim(),
      nombreNormalizado: normalizedName, // Para búsquedas case-insensitive
      nivel: nivel || 1,
      puntuacion: puntuacion || 0,
      timestamp: now
    };
    
    const docRef = await addDoc(collection(db, SPACE_INVADERS_COLLECTION), newScore);
    
    // Disparar evento de actualización
    window.dispatchEvent(new CustomEvent('scoreUpdated', { 
      detail: { game: 'spaceinvaders' } 
    }));
    
    return docRef.id;
  } catch (error) {
    console.error('[Firebase ScoreDB] Error saving SpaceInvaders score:', error);
    throw error;
  }
};

// Get all SpaceInvaders scores
export const getSpaceInvadersScores = async () => {
  try {
    const q = query(collection(db, SPACE_INVADERS_COLLECTION));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[Firebase ScoreDB] Error fetching SpaceInvaders scores:', error);
    return [];
  }
};

// Save SimonDice score
export const saveSimonDiceScore = async ({ nombre, nivel, ronda }) => {
  try {
    const normalizedName = normalizeNameForSearch(nombre);
    
    // Buscar registro existente con el mismo nombre (case-insensitive)
    const q = query(
      collection(db, SIMON_DICE_COLLECTION),
      where('nombreNormalizado', '==', normalizedName)
    );
    const snapshot = await getDocs(q);
    
    const now = Date.now();
    
    if (!snapshot.empty) {
      // Ya existe un registro con este nombre
      const existingDoc = snapshot.docs[0];
      const existing = existingDoc.data();
      
      // Solo actualizar si la nueva ronda es mayor
      if ((ronda || 1) > (existing.ronda || 1)) {
        await updateDoc(doc(db, SIMON_DICE_COLLECTION, existingDoc.id), {
          nombre: nombre.trim(),
          nivel: nivel || existing.nivel || 1,
          ronda: ronda || 1,
          timestamp: now
        });
        
        // Disparar evento de actualización
        window.dispatchEvent(new CustomEvent('scoreUpdated', { 
          detail: { game: 'simondice' } 
        }));
        
        return existingDoc.id;
      } else {
        throw new Error('Este nombre está registrado con una ronda mayor');
      }
    }
    
    // No existe, crear nuevo registro
    const newScore = {
      nombre: nombre.trim(),
      nombreNormalizado: normalizedName, // Para búsquedas case-insensitive
      nivel: nivel || 1,
      ronda: ronda || 1,
      timestamp: now
    };
    
    const docRef = await addDoc(collection(db, SIMON_DICE_COLLECTION), newScore);
    
    // Disparar evento de actualización
    window.dispatchEvent(new CustomEvent('scoreUpdated', { 
      detail: { game: 'simondice' } 
    }));
    
    return docRef.id;
  } catch (error) {
    console.error('[Firebase ScoreDB] Error saving SimonDice score:', error);
    throw error;
  }
};

// Get all SimonDice scores
export const getSimonDiceScores = async () => {
  try {
    const q = query(collection(db, SIMON_DICE_COLLECTION));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[Firebase ScoreDB] Error fetching SimonDice scores:', error);
    return [];
  }
};

// Optional: Clear all scores (para testing/reset - ¡USAR CON CUIDADO!)
export const clearAllScores = async () => {
  try {
    console.warn('[Firebase ScoreDB] clearAllScores no implementado para Firebase por seguridad');
    console.warn('Para limpiar datos, usa la consola de Firebase directamente');
  } catch (error) {
    console.error('[Firebase ScoreDB] Error clearing scores:', error);
  }
};

// Helpers: get existing score by name (case-insensitive)
export const getSpaceInvadersScoreByName = async (nombre) => {
  try {
    const normalizedName = normalizeNameForSearch(nombre);
    const q = query(
      collection(db, SPACE_INVADERS_COLLECTION),
      where('nombreNormalizado', '==', normalizedName)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
  } catch (error) {
    console.error('[Firebase ScoreDB] Error fetching SpaceInvaders score by name:', error);
    return null;
  }
};

export const getSimonDiceScoreByName = async (nombre) => {
  try {
    const normalizedName = normalizeNameForSearch(nombre);
    const q = query(
      collection(db, SIMON_DICE_COLLECTION),
      where('nombreNormalizado', '==', normalizedName)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
  } catch (error) {
    console.error('[Firebase ScoreDB] Error fetching SimonDice score by name:', error);
    return null;
  }
};

// Get player ranking position after saving
export const getSpaceInvadersRanking = async (nombre) => {
  try {
    const scores = await getSpaceInvadersScores();
    // Sort by puntuacion DESC
    const sorted = [...scores].sort((a, b) => (b.puntuacion || 0) - (a.puntuacion || 0));
    const normalizedName = normalizeNameForSearch(nombre);
    const position = sorted.findIndex(s => 
      normalizeNameForSearch(s.nombre) === normalizedName
    );
    return position >= 0 ? position + 1 : null; // 1-based position
  } catch (error) {
    console.error('[Firebase ScoreDB] Error getting SpaceInvaders ranking:', error);
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
    const normalizedName = normalizeNameForSearch(nombre);
    const position = sorted.findIndex(s => 
      normalizeNameForSearch(s.nombre) === normalizedName
    );
    return position >= 0 ? position + 1 : null; // 1-based position
  } catch (error) {
    console.error('[Firebase ScoreDB] Error getting SimonDice ranking:', error);
    return null;
  }
};
