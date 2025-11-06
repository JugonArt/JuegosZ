// Script para hacer backup de IndexedDB antes de migrar a Firebase
// Ejecutar desde la consola del navegador mientras estás en la app

const backupIndexedDB = async () => {
  const DB_NAME = 'JuegosZScores';
  const DB_VERSION = 1;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
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
            
            console.log('✅ Backup completado:', backup);
            resolve(backup);
          }
        };
        
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
    };
  });
};

// Ejecutar backup
console.log('🔄 Iniciando backup de la base de datos...');
backupIndexedDB()
  .then(data => {
    console.log('✅ BACKUP COMPLETADO EXITOSAMENTE');
    console.log('📊 Datos guardados:');
    console.log('- Space Invaders:', data.stores.spaceInvaders?.length || 0, 'registros');
    console.log('- Simon Dice:', data.stores.simonDice?.length || 0, 'registros');
    console.log('📁 Archivo descargado automáticamente');
  })
  .catch(err => {
    console.error('❌ Error durante el backup:', err);
  });
