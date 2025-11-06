# 🔥 Migración a Firebase - Guía Completa

Esta guía te ayudará a migrar la base de datos local (IndexedDB) a Firebase Firestore de forma segura.

## 📋 Pasos previos

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita Firestore Database:
   - Ve a "Build" > "Firestore Database"
   - Click en "Create database"
   - Selecciona "Start in production mode" (configuraremos las reglas después)
   - Elige la ubicación más cercana (ej: `southamerica-east1` para Buenos Aires)

### 2. Obtener configuración de Firebase

1. En Firebase Console, ve a "Project Settings" (⚙️)
2. En la sección "Your apps", click en el ícono web `</>`
3. Registra tu app con un nombre (ej: "Juegos-Z")
4. Copia la configuración que aparece

### 3. Configurar Firebase en el proyecto

Edita el archivo `src/config/firebase.js` y reemplaza los valores con tu configuración:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",              // Tu API Key
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 4. Configurar reglas de seguridad de Firestore

En Firebase Console > Firestore Database > Rules, usa estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura a todos
    match /{document=**} {
      allow read: if true;
    }
    
    // Permitir escritura solo en colecciones de scores
    match /spaceInvaders/{scoreId} {
      allow create: if true;
      allow update: if true;
      allow delete: if false; // No permitir borrado
    }
    
    match /simonDice/{scoreId} {
      allow create: if true;
      allow update: if true;
      allow delete: if false; // No permitir borrado
    }
  }
}
```

## 🔒 Paso 1: Hacer backup de la base de datos actual

**⚠️ MUY IMPORTANTE: HAZ ESTO ANTES DE MIGRAR**

1. Abre la aplicación en el navegador
2. Abre la consola del navegador (F12)
3. Pega y ejecuta el siguiente código:

```javascript
// Copiar todo el contenido de scripts/backup-database.js
// y pegarlo en la consola
```

4. Se descargará automáticamente un archivo JSON con todos tus datos
5. **GUARDA ESTE ARCHIVO EN UN LUGAR SEGURO**

## 🚀 Paso 2: Ejecutar la migración

Una vez que hayas configurado Firebase y hecho el backup:

1. Abre la consola del navegador (F12)
2. Ejecuta:

```javascript
// Importar y ejecutar migración
import('./utils/migrateToFirebase.js').then(module => {
  module.migrateToFirebase()
    .then(result => {
      console.log('✅ Migración completada:', result);
    })
    .catch(error => {
      console.error('❌ Error en migración:', error);
    });
});
```

3. Espera a que termine (verás el progreso en la consola)
4. Verifica en Firebase Console que los datos se hayan migrado correctamente

## 🔄 Paso 3: Cambiar a Firebase en producción

Una vez verificado que la migración fue exitosa, cambia las importaciones:

### Opción A: Reemplazar el archivo original (RECOMENDADO)

```bash
# Renombrar el archivo actual como backup
mv src/utils/scoreDatabase.js src/utils/scoreDatabase.indexeddb.backup.js

# Renombrar el nuevo archivo Firebase como el principal
mv src/utils/scoreDatabase.firebase.js src/utils/scoreDatabase.js
```

### Opción B: Mantener ambos y cambiar imports manualmente

En cada archivo que importe `scoreDatabase.js`, cambiar:

```javascript
// De:
import { ... } from '../../utils/scoreDatabase.js';

// A:
import { ... } from '../../utils/scoreDatabase.firebase.js';
```

Archivos a modificar:
- `src/components/lobby/simondice/simon.jsx`
- `src/components/lobby/spaceinvaders/SpaceInvaders.js`
- `src/components/lobby/Puntajes.jsx`
- `src/components/UI/MultiplayerGameOver.jsx`
- `src/components/UI/SinglePlayerGameOver.jsx`

## ✅ Paso 4: Verificación

1. Abre la aplicación
2. Ve a "Puntajes"
3. Verifica que veas todos los puntajes migrados
4. Prueba guardar un nuevo puntaje
5. Verifica en Firebase Console que aparezca el nuevo registro

## 🔧 Estructura de datos en Firebase

### Colección `spaceInvaders`:
```javascript
{
  nombre: "Goku",
  nombreNormalizado: "goku", // Para búsquedas case-insensitive
  puntuacion: 15000,
  nivel: 5,
  timestamp: 1699999999999
}
```

### Colección `simonDice`:
```javascript
{
  nombre: "Vegeta",
  nombreNormalizado: "vegeta",
  nivel: 3,
  ronda: 8,
  timestamp: 1699999999999
}
```

## 🆘 Solución de problemas

### Error: "Firebase is not configured"
- Verifica que hayas copiado correctamente la configuración en `src/config/firebase.js`

### Error: "Missing or insufficient permissions"
- Verifica las reglas de seguridad en Firebase Console
- Asegúrate de haber publicado las reglas correctamente

### Los puntajes no aparecen
- Verifica en Firebase Console > Firestore Database que los documentos existan
- Verifica la consola del navegador por errores

### Quiero volver a IndexedDB
- Restaura el archivo `scoreDatabase.indexeddb.backup.js` como `scoreDatabase.js`
- Los datos locales siguen en IndexedDB, no se borran

## 📱 Preparación para APK

Una vez que Firebase esté funcionando:

1. Todos los dispositivos compartirán la misma base de datos
2. Los puntajes se sincronizan automáticamente
3. No se perderán datos al desinstalar la app
4. Múltiples jugadores pueden jugar simultáneamente

## 🔐 Seguridad

- La configuración de Firebase (`apiKey`, etc.) puede ser pública en una app web/móvil
- La seguridad se maneja con las reglas de Firestore
- Las reglas actuales permiten lectura a todos y escritura solo en colecciones específicas
- Para mayor seguridad, considera implementar Firebase Authentication

## 📚 Recursos adicionales

- [Documentación oficial de Firebase](https://firebase.google.com/docs)
- [Guía de Firestore](https://firebase.google.com/docs/firestore)
- [Reglas de seguridad](https://firebase.google.com/docs/firestore/security/get-started)
