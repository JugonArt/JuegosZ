# 🚀 Guía Rápida de Migración a Firebase

## ✅ Checklist de Migración

### Antes de empezar:
- [ ] Crear proyecto en Firebase Console
- [ ] Habilitar Firestore Database
- [ ] Copiar configuración de Firebase
- [ ] Configurar reglas de seguridad

### Pasos de migración:

#### 1️⃣ Configurar Firebase
Edita `src/config/firebase.js` con tus credenciales de Firebase

#### 2️⃣ Hacer Backup (OBLIGATORIO)
```bash
# Opción A: Desde la consola del navegador
# Abrir DevTools (F12) y pegar el contenido de:
scripts/backup-database.js

# Opción B: Usar el panel de migración
# Importar MigrationPanel en algún componente y usar el botón de backup
```

#### 3️⃣ Ejecutar Migración
```bash
# Desde la consola del navegador:
import('./utils/migrateToFirebase.js').then(m => m.migrateToFirebase());
```

#### 4️⃣ Verificar en Firebase Console
- Ir a Firestore Database
- Verificar que existan las colecciones `spaceInvaders` y `simonDice`
- Confirmar que los documentos tengan los campos correctos

#### 5️⃣ Activar Firebase en producción

**OPCIÓN RECOMENDADA** - Reemplazar archivo:
```bash
# Renombrar archivo actual como backup
mv src/utils/scoreDatabase.js src/utils/scoreDatabase.indexeddb.js

# Activar versión de Firebase
mv src/utils/scoreDatabase.firebase.js src/utils/scoreDatabase.js
```

#### 6️⃣ Probar la aplicación
- [ ] Abrir la app
- [ ] Ir a "Puntajes"
- [ ] Verificar que se vean todos los puntajes
- [ ] Jugar una partida y guardar puntaje
- [ ] Confirmar en Firebase Console que se guardó

---

## 🔧 Reglas de Firestore

Copiar y pegar en Firebase Console > Firestore Database > Rules:

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

---

## 📁 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `src/config/firebase.js` | Configuración de Firebase |
| `src/utils/scoreDatabase.firebase.js` | Nueva implementación con Firebase |
| `src/utils/scoreDatabase.js` | Implementación actual (IndexedDB) |
| `src/utils/migrateToFirebase.js` | Script de migración |
| `scripts/backup-database.js` | Script de backup |
| `src/components/UI/MigrationPanel.jsx` | Panel UI de migración |

---

## ⚠️ IMPORTANTE

1. **NO BORRES** el archivo `scoreDatabase.js` original hasta verificar que Firebase funcione
2. **HAZ BACKUP** antes de migrar
3. **EJECUTA LA MIGRACIÓN SOLO UNA VEZ** para evitar duplicados
4. Los datos en IndexedDB **NO se borran** automáticamente, siguen ahí como respaldo

---

## 🆘 Problemas Comunes

### Error: "Firebase not configured"
→ Verifica `src/config/firebase.js` con tus credenciales

### Error: "Permission denied"
→ Verifica las reglas de Firestore en Firebase Console

### Los puntajes no aparecen
→ Verifica la consola del navegador por errores
→ Confirma en Firebase Console que los datos existan

### Quiero volver a IndexedDB
→ Restaura el archivo `scoreDatabase.indexeddb.js` como `scoreDatabase.js`

---

## 📱 Beneficios para la APK

✅ Sincronización en tiempo real entre dispositivos
✅ No se pierden datos al desinstalar la app
✅ Múltiples jugadores pueden competir simultáneamente
✅ Backup automático en la nube
✅ Escalabilidad ilimitada
