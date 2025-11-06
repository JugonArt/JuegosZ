# 🔥 Plantilla de Configuración de Firebase

## Cómo obtener tu configuración:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Click en el ícono de configuración ⚙️ (Project Settings)
4. Scroll down hasta "Your apps"
5. Click en el ícono `</>` para web app
6. Copia la configuración que aparece

## Ejemplo de configuración:

```javascript
// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "juegos-z-12345.firebaseapp.com",
  projectId: "juegos-z-12345",
  storageBucket: "juegos-z-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
```

## ⚠️ IMPORTANTE:

- Reemplaza TODOS los valores con los de TU proyecto
- La `apiKey` puede ser pública en aplicaciones web/móviles
- La seguridad se maneja con las reglas de Firestore
- NO compartas el archivo de configuración en repositorios públicos si tu proyecto tiene datos sensibles

## 🔐 Reglas de Seguridad Recomendadas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura a todos (para ver puntajes)
    match /{document=**} {
      allow read: if true;
    }
    
    // Permitir escritura en Space Invaders
    match /spaceInvaders/{scoreId} {
      allow create: if true;
      allow update: if request.resource.data.puntuacion > resource.data.puntuacion;
      allow delete: if false;
    }
    
    // Permitir escritura en Simon Dice
    match /simonDice/{scoreId} {
      allow create: if true;
      allow update: if request.resource.data.ronda > resource.data.ronda;
      allow delete: if false;
    }
  }
}
```

### Explicación de las reglas:

- **Lectura**: Todos pueden leer (ver puntajes)
- **Creación**: Todos pueden crear nuevos puntajes
- **Actualización**: Solo si el nuevo puntaje es mayor que el anterior
- **Eliminación**: Nadie puede borrar (protección de datos)

## 📊 Estructura de Datos:

### Colección `spaceInvaders`:
```json
{
  "nombre": "Goku",
  "nombreNormalizado": "goku",
  "puntuacion": 15000,
  "nivel": 5,
  "timestamp": 1699999999999
}
```

### Colección `simonDice`:
```json
{
  "nombre": "Vegeta",
  "nombreNormalizado": "vegeta",
  "nivel": 3,
  "ronda": 8,
  "timestamp": 1699999999999
}
```

## 🚀 Próximos Pasos:

1. Copia tu configuración en `src/config/firebase.js`
2. Configura las reglas de seguridad en Firebase Console
3. Ejecuta el backup de tu base de datos actual
4. Ejecuta la migración
5. Verifica que todo funcione correctamente
6. ¡Listo para convertir a APK! 📱
