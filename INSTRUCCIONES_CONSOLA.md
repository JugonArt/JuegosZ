# 🎮 Instrucciones para Migración desde la Consola del Navegador

## ✅ Paso a Paso Simplificado

### 1️⃣ Hacer Backup (OBLIGATORIO)

1. Abre tu aplicación en el navegador
2. Abre la consola del navegador (presiona **F12**)
3. Ejecuta el siguiente comando:

```javascript
backupDatabase()
```

4. Se descargará automáticamente un archivo JSON con todos tus datos
5. **Guarda este archivo en un lugar seguro**

---

### 2️⃣ Migrar a Firebase

Una vez que hayas hecho el backup, ejecuta:

```javascript
migrateToFirebase()
```

Verás el progreso en la consola:
```
🔄 Iniciando migración de IndexedDB a Firebase...
📊 Datos encontrados en IndexedDB:
  - Space Invaders: X registros
  - Simon Dice: Y registros
🚀 Migrando Space Invaders...
  ✅ Migrado: Goku (15000 pts)
  ✅ Migrado: Vegeta (12000 pts)
🚀 Migrando Simon Dice...
  ✅ Migrado: Goku (Nivel 3, Ronda 8)

✅ MIGRACIÓN COMPLETADA
📊 Resumen:
  - Registros migrados: 10
  - Errores: 0
  - Total procesado: 10
```

---

### 3️⃣ Verificar en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto "juegos-z"
3. Ve a "Firestore Database"
4. Verifica que existan las colecciones:
   - `spaceInvaders`
   - `simonDice`
5. Confirma que los documentos tengan los datos correctos

---

### 4️⃣ Activar Firebase en el Código

Una vez verificado que todo está correcto en Firebase:

**OPCIÓN A: Desde PowerShell/Terminal (RECOMENDADO)**
```bash
# Ir a la carpeta del proyecto
cd C:\Users\Jero\Downloads\juegos-z

# Renombrar archivo actual como backup
mv src/utils/scoreDatabase.js src/utils/scoreDatabase.indexeddb.js

# Activar versión de Firebase
mv src/utils/scoreDatabase.firebase.js src/utils/scoreDatabase.js
```

**OPCIÓN B: Manualmente**
1. Renombrar `src/utils/scoreDatabase.js` → `src/utils/scoreDatabase.indexeddb.js`
2. Renombrar `src/utils/scoreDatabase.firebase.js` → `src/utils/scoreDatabase.js`

---

### 5️⃣ Probar la Aplicación

1. Recarga la página (F5)
2. Ve a "Puntajes"
3. Verifica que veas todos los puntajes
4. Juega una partida y guarda un puntaje
5. Confirma en Firebase Console que aparezca el nuevo registro

---

## 🆘 Solución de Problemas

### ❌ Error: "backupDatabase is not a function"
**Solución:** Recarga la página (F5) y vuelve a intentar

### ❌ Error: "Firebase is not initialized"
**Solución:** Verifica que `src/config/firebase.js` tenga tu configuración correcta

### ❌ Error: "Missing or insufficient permissions"
**Solución:** Configura las reglas de Firestore en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
    }
    
    match /spaceInvaders/{scoreId} {
      allow create, update: if true;
      allow delete: if false;
    }
    
    match /simonDice/{scoreId} {
      allow create, update: if true;
      allow delete: if false;
    }
  }
}
```

### ❌ Los puntajes no aparecen después de migrar
1. Verifica que renombraste los archivos correctamente
2. Recarga la página (F5)
3. Revisa la consola del navegador por errores
4. Confirma en Firebase Console que los datos existan

---

## 📝 Notas Importantes

- ✅ Las funciones `backupDatabase()` y `migrateToFirebase()` están disponibles automáticamente
- ✅ No necesitas importar nada, solo ejecutarlas en la consola
- ✅ Puedes ejecutar `backupDatabase()` las veces que quieras
- ⚠️ Solo ejecuta `migrateToFirebase()` **UNA SOLA VEZ** para evitar duplicados
- 🔒 Tus datos en IndexedDB **NO se borran**, siguen ahí como respaldo

---

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación estará usando Firebase y estará lista para ser convertida en APK con base de datos compartida en la nube.
