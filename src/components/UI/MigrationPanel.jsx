import React, { useState } from 'react';
import { migrateToFirebase } from '../../utils/migrateToFirebase';

/**
 * Panel de migración de base de datos
 * Solo debe usarse UNA VEZ para migrar de IndexedDB a Firebase
 * 
 * Para usar: Agregar este componente temporalmente en algún lugar accesible
 * o importarlo desde la consola del navegador
 */
const MigrationPanel = () => {
  const [status, setStatus] = useState('idle'); // idle, running, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleMigrate = async () => {
    if (!window.confirm(
      '⚠️ ADVERTENCIA:\n\n' +
      '¿Ya hiciste el backup de la base de datos actual?\n' +
      '¿Configuraste Firebase correctamente?\n\n' +
      'Esta acción copiará todos los datos a Firebase.\n\n' +
      'Presiona OK para continuar.'
    )) {
      return;
    }

    setStatus('running');
    setError(null);

    try {
      const migrationResult = await migrateToFirebase();
      setResult(migrationResult);
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const handleBackup = () => {
    // Código del backup inline
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
                
                resolve(backup);
              }
            };
            
            getAllRequest.onerror = () => reject(getAllRequest.error);
          });
        };
      });
    };

    backupIndexedDB()
      .then(data => {
        alert(
          '✅ Backup completado!\n\n' +
          `Space Invaders: ${data.stores.spaceInvaders?.length || 0} registros\n` +
          `Simon Dice: ${data.stores.simonDice?.length || 0} registros\n\n` +
          'Archivo descargado automáticamente.'
        );
      })
      .catch(err => {
        alert('❌ Error al hacer backup: ' + err.message);
      });
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#1a1a1a',
      border: '2px solid #ffd700',
      borderRadius: '10px',
      padding: '20px',
      maxWidth: '500px',
      zIndex: 9999,
      color: '#fff',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#ffd700' }}>
        🔥 Migración a Firebase
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', color: '#ffd700' }}>Paso 1: Backup</h3>
        <p style={{ fontSize: '12px', margin: '5px 0' }}>
          Haz una copia de seguridad de tus datos actuales
        </p>
        <button
          onClick={handleBackup}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            border: 'none',
            borderRadius: '5px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%'
          }}
        >
          📥 Descargar Backup
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', color: '#ffd700' }}>Paso 2: Migrar</h3>
        <p style={{ fontSize: '12px', margin: '5px 0' }}>
          Copia todos los datos a Firebase
        </p>
        <button
          onClick={handleMigrate}
          disabled={status === 'running'}
          style={{
            padding: '10px 20px',
            background: status === 'running' ? '#666' : '#ff9800',
            border: 'none',
            borderRadius: '5px',
            color: 'white',
            cursor: status === 'running' ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            width: '100%'
          }}
        >
          {status === 'running' ? '⏳ Migrando...' : '🚀 Migrar a Firebase'}
        </button>
      </div>

      {status === 'success' && result && (
        <div style={{
          padding: '10px',
          background: '#4CAF50',
          borderRadius: '5px',
          marginTop: '10px'
        }}>
          <strong>✅ Migración completada!</strong>
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            <div>Migrados: {result.migratedCount}</div>
            <div>Errores: {result.errorCount}</div>
            <div>Total: {result.total}</div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          padding: '10px',
          background: '#f44336',
          borderRadius: '5px',
          marginTop: '10px'
        }}>
          <strong>❌ Error en migración</strong>
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            {error}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '10px',
        background: '#333',
        borderRadius: '5px',
        fontSize: '11px'
      }}>
        <strong>⚠️ Importante:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Haz el backup ANTES de migrar</li>
          <li>Ejecuta la migración SOLO UNA VEZ</li>
          <li>Verifica en Firebase Console que los datos estén correctos</li>
        </ul>
      </div>
    </div>
  );
};

export default MigrationPanel;

// Para usar desde la consola:
// 1. Importar: import MigrationPanel from './components/UI/MigrationPanel';
// 2. Renderizar temporalmente en cualquier componente
// 3. O ejecutar directamente desde consola las funciones
