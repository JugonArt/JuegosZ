// Helper para exponer funciones de migración globalmente
// Importar este archivo en index.js para tener acceso desde la consola

import { db } from '../config/firebase.js';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

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

// Función de backup accesible globalmente
window.backupDatabase = async () => {
  try {
    console.log('🔄 Iniciando backup de la base de datos...');
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const backup = {
          timestamp: new Date().toISOString(),
          version: DB_VERSION,
          stores: {}
        };
        
        const storeNames = Array.from(db.objectStoreNames);
        let completed = 0;
        
        storeNames.forEach(storeName => {
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            backup.stores[storeName] = getAllRequest.result;
            completed++;
            
            if (completed === storeNames.length) {
              // Crear archivo JSON para descargar
              const dataStr = JSON.stringify(backup, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `juegos-z-backup-${Date.now()}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              
              console.log('✅ BACKUP COMPLETADO EXITOSAMENTE');
              console.log('📊 Datos guardados:');
              console.log('- Space Invaders:', backup.stores.spaceInvaders?.length || 0, 'registros');
              console.log('- Simon Dice:', backup.stores.simonDice?.length || 0, 'registros');
              console.log('📁 Archivo descargado automáticamente');
              
              resolve(backup);
            }
          };
          
          getAllRequest.onerror = () => reject(getAllRequest.error);
        });
      };
    });
  } catch (error) {
    console.error('❌ Error durante el backup:', error);
    throw error;
  }
};

// Función de migración a Firebase accesible globalmente
window.migrateToFirebase = async () => {
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

// Helpers para inspeccionar y corregir 'nivel' en Firestore
window.checkSpaceInvadersLevels = async () => {
  try {
    console.log('🔎 Comprobando documentos de Space Invaders en Firestore para campos "nivel"...');
    const q = query(collection(db, SPACE_INVADERS_COLLECTION));
    const snapshot = await getDocs(q);
    const total = snapshot.size;
    const missing = [];
    snapshot.forEach(snap => {
      const data = snap.data();
      if (data.nivel === undefined || data.nivel === null) {
        missing.push({ id: snap.id, ...data });
      }
    });

    console.log(`📊 Total encontrados: ${total}`);
    console.log(`⚠️ Documentos sin 'nivel': ${missing.length}`);
    if (missing.length) {
      console.log('📋 Mostrando hasta 20 documentos sin nivel:');
      console.table(missing.slice(0, 20));
    }
    return { total, missingCount: missing.length, samples: missing.slice(0, 20) };
  } catch (error) {
    console.error('❌ Error comprobando niveles en Firestore:', error);
    throw error;
  }
};

// Fija los documentos sin 'nivel' a un valor por defecto (por ejemplo 1)
window.fixMissingSpaceInvadersLevels = async (defaultLevel = 1) => {
  try {
    if (!window.confirm(`¿Estás seguro? Esto actualizará todos los documentos sin campo 'nivel' a ${defaultLevel}.`)) {
      console.log('🔕 Operación cancelada por el usuario');
      return { fixed: 0 };
    }

    console.log('🔧 Buscando documentos sin nivel...');
    const q = query(collection(db, SPACE_INVADERS_COLLECTION));
    const snapshot = await getDocs(q);
    const toFix = [];
    snapshot.forEach(snap => {
      const data = snap.data();
      if (data.nivel === undefined || data.nivel === null) {
        toFix.push({ id: snap.id, data });
      }
    });

    console.log(`🛠️ Documentos a actualizar: ${toFix.length}`);
    let fixed = 0;
    for (const item of toFix) {
      try {
        await updateDoc(doc(db, SPACE_INVADERS_COLLECTION, item.id), { nivel: defaultLevel });
        fixed++;
        console.log(`  ✅ Actualizado: ${item.id} -> nivel=${defaultLevel}`);
      } catch (err) {
        console.error(`  ❌ Error actualizando ${item.id}:`, err.message || err);
      }
    }

    console.log(`\n✅ Operación completada. Documentos actualizados: ${fixed}`);
    return { fixed };
  } catch (error) {
    console.error('❌ Error al corregir niveles en Firestore:', error);
    throw error;
  }
};

// Mostrar mensaje en consola cuando se carga
console.log('🔥 Firebase Migration Helper cargado!');
console.log('📝 Funciones disponibles:');
console.log('  - backupDatabase() - Hacer backup de IndexedDB');
console.log('  - migrateToFirebase() - Migrar datos a Firebase');
console.log('  - checkSpaceInvadersLevels() - Comprobar docs sin campo "nivel" en Firestore');
console.log('  - fixMissingSpaceInvadersLevels(defaultLevel = 1) - Corregir docs sin "nivel" (pide confirmación)');
console.log('');
console.log('💡 Uso:');
console.log('  1. Ejecuta: backupDatabase()');
console.log('  2. Ejecuta: migrateToFirebase()');
console.log('  3. Ejecuta: checkSpaceInvadersLevels()');
console.log('  4. Ejecuta: fixMissingSpaceInvadersLevels(1) // opcional, con confirmación');
