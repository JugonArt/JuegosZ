// Script de migración de IndexedDB a Firebase
// Este script copia todos los datos de la base de datos local a Firebase
// IMPORTANTE: Ejecutar SOLO UNA VEZ después de configurar Firebase

import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const DB_NAME = 'JuegosZScores';
const DB_VERSION = 1;
const SPACE_INVADERS_STORE = 'spaceInvaders';
const SIMON_DICE_STORE = 'simonDice';

const SPACE_INVADERS_COLLECTION = 'spaceInvaders';
const SIMON_DICE_COLLECTION = 'simonDice';

// Función para obtener todos los datos de IndexedDB
const getIndexedDBData = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const indexedDB = request.result;
      const data = {
        spaceInvaders: [],
        simonDice: []
      };
      
      let completed = 0;
      const totalStores = 2;
      
      // Obtener datos de Space Invaders
      const spaceTransaction = indexedDB.transaction([SPACE_INVADERS_STORE], 'readonly');
      const spaceStore = spaceTransaction.objectStore(SPACE_INVADERS_STORE);
      const spaceRequest = spaceStore.getAll();
      
      spaceRequest.onsuccess = () => {
        data.spaceInvaders = spaceRequest.result;
        completed++;
        if (completed === totalStores) resolve(data);
      };
      
      spaceRequest.onerror = () => reject(spaceRequest.error);
      
      // Obtener datos de Simon Dice
      const simonTransaction = indexedDB.transaction([SIMON_DICE_STORE], 'readonly');
      const simonStore = simonTransaction.objectStore(SIMON_DICE_STORE);
      const simonRequest = simonStore.getAll();
      
      simonRequest.onsuccess = () => {
        data.simonDice = simonRequest.result;
        completed++;
        if (completed === totalStores) resolve(data);
      };
      
      simonRequest.onerror = () => reject(simonRequest.error);
    };
  });
};

// Función para migrar datos a Firebase
export const migrateToFirebase = async () => {
  try {
    console.log('🔄 Iniciando migración de IndexedDB a Firebase...');
    
    // 1. Obtener datos de IndexedDB
    const localData = await getIndexedDBData();
    
    console.log('📊 Datos encontrados en IndexedDB:');
    console.log(`  - Space Invaders: ${localData.spaceInvaders.length} registros`);
    console.log(`  - Simon Dice: ${localData.simonDice.length} registros`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // 2. Migrar Space Invaders
    console.log('🚀 Migrando Space Invaders...');
    for (const score of localData.spaceInvaders) {
      try {
        // Remover el id de IndexedDB y agregar nombreNormalizado
        const { id, ...scoreData } = score;
        const firebaseScore = {
          ...scoreData,
          nombreNormalizado: scoreData.nombre.toLowerCase().trim(),
          // Asegurar que todos los campos existan
          puntuacion: scoreData.puntuacion || 0,
          nivel: scoreData.nivel || 1,
          timestamp: scoreData.timestamp || Date.now()
        };
        
        await addDoc(collection(db, SPACE_INVADERS_COLLECTION), firebaseScore);
        migratedCount++;
        console.log(`  ✅ Migrado: ${scoreData.nombre} (${scoreData.puntuacion} pts)`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error migrando ${score.nombre}:`, error.message);
      }
    }
    
    // 3. Migrar Simon Dice
    console.log('🚀 Migrando Simon Dice...');
    for (const score of localData.simonDice) {
      try {
        // Remover el id de IndexedDB y agregar nombreNormalizado
        const { id, ...scoreData } = score;
        const firebaseScore = {
          ...scoreData,
          nombreNormalizado: scoreData.nombre.toLowerCase().trim(),
          // Asegurar que todos los campos existan
          nivel: scoreData.nivel || 1,
          ronda: scoreData.ronda || 1,
          timestamp: scoreData.timestamp || Date.now()
        };
        
        await addDoc(collection(db, SIMON_DICE_COLLECTION), firebaseScore);
        migratedCount++;
        console.log(`  ✅ Migrado: ${scoreData.nombre} (Nivel ${scoreData.nivel}, Ronda ${scoreData.ronda})`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error migrando ${score.nombre}:`, error.message);
      }
    }
    
    console.log('\n✅ MIGRACIÓN COMPLETADA');
    console.log(`📊 Resumen:`);
    console.log(`  - Registros migrados: ${migratedCount}`);
    console.log(`  - Errores: ${errorCount}`);
    console.log(`  - Total procesado: ${localData.spaceInvaders.length + localData.simonDice.length}`);
    
    return {
      success: true,
      migratedCount,
      errorCount,
      total: localData.spaceInvaders.length + localData.simonDice.length
    };
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
};

// Para ejecutar desde la consola del navegador:
// import { migrateToFirebase } from './utils/migrateToFirebase';
// migrateToFirebase();
