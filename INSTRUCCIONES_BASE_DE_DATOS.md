# Instrucciones para Administrar la Base de Datos de Puntajes

## 🗑️ Cómo Borrar Todos los Datos de la Base de Datos

Tienes **3 opciones** para borrar completamente los datos de puntajes:

### **Opción 1: Desde la Consola del Navegador (MÁS FÁCIL)**

1. Abre tu aplicación en el navegador
2. Presiona `F12` para abrir las DevTools
3. Ve a la pestaña **Console**
4. Pega este código y presiona Enter:

```javascript
// Borrar toda la base de datos
indexedDB.deleteDatabase('JuegosZScores');
console.log('✅ Base de datos eliminada. Recarga la página.');
```

5. Recarga la página (`F5` o `Ctrl+R`)
6. ¡Listo! La base de datos se creará de nuevo vacía cuando guardes el próximo puntaje.

---

### **Opción 2: Usando la Función del Código**

Ya tienes una función en tu código para borrar todos los puntajes. Puedes llamarla desde la consola:

1. Abre tu aplicación en el navegador
2. Presiona `F12` para abrir las DevTools
3. Ve a la pestaña **Console**
4. Pega este código:

```javascript
// Importa y ejecuta la función de limpieza
import('http://localhost:3000/static/js/bundle.js').then(async () => {
  const { clearAllScores } = await import('./utils/scoreDatabase.js');
  await clearAllScores();
  console.log('✅ Todos los puntajes eliminados. Recarga la página.');
});
```

**NOTA:** Esta opción puede no funcionar en todos los navegadores debido a restricciones de módulos. Si no funciona, usa la Opción 1 o 3.

---

### **Opción 3: Desde las DevTools (VISUAL)**

1. Abre tu aplicación en el navegador
2. Presiona `F12` para abrir las DevTools
3. Ve a la pestaña **Application** (Chrome/Edge) o **Storage** (Firefox)
4. En el panel izquierdo, expande **IndexedDB**
5. Verás `JuegosZScores` → haz clic derecho → **Delete Database**
6. Recarga la página (`F5`)

---

## 🔍 Cómo Ver los Datos Guardados

Para inspeccionar qué datos tienes guardados:

1. Abre DevTools (`F12`)
2. Ve a **Application** → **IndexedDB** → **JuegosZScores**
3. Verás dos "stores":
   - **spaceInvaders**: Puntajes de Space Invaders
   - **simonDice**: Puntajes de Simon Dice
4. Haz clic en cada uno para ver los registros guardados

---

## 📝 Estructura de los Datos

### Space Invaders
```javascript
{
  id: 1,                    // Auto-generado
  nombre: "Pedro",          // Nombre del jugador
  nivel: 5,                 // Nivel alcanzado
  puntuacion: 12500,        // Puntuación final
  timestamp: 1730678400000  // Fecha/hora en milisegundos
}
```

### Simon Dice
```javascript
{
  id: 1,                    // Auto-generado
  nombre: "María",          // Nombre del jugador
  nivel: 3,                 // Nivel alcanzado
  ronda: 15,                // Ronda alcanzada
  timestamp: 1730678400000  // Fecha/hora en milisegundos
}
```

---

## 🛠️ Comandos Útiles en la Consola

### Ver todos los puntajes de Space Invaders:
```javascript
const request = indexedDB.open('JuegosZScores', 1);
request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('spaceInvaders', 'readonly');
  const store = tx.objectStore('spaceInvaders');
  const getAll = store.getAll();
  getAll.onsuccess = () => {
    console.table(getAll.result);
  };
};
```

### Ver todos los puntajes de Simon Dice:
```javascript
const request = indexedDB.open('JuegosZScores', 1);
request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('simonDice', 'readonly');
  const store = tx.objectStore('simonDice');
  const getAll = store.getAll();
  getAll.onsuccess = () => {
    console.table(getAll.result);
  };
};
```

### Borrar un registro específico (por ID):
```javascript
const request = indexedDB.open('JuegosZScores', 1);
request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('spaceInvaders', 'readwrite'); // o 'simonDice'
  const store = tx.objectStore('spaceInvaders');
  const deleteReq = store.delete(1); // Cambia el ID
  deleteReq.onsuccess = () => {
    console.log('✅ Registro eliminado');
  };
};
```

---

## ⚠️ Notas Importantes

1. **La base de datos es local**: Cada navegador y cada usuario tiene su propia base de datos. Si abres la app en otro navegador o en modo incógnito, no verás los mismos datos.

2. **Desarrollo vs Producción**: 
   - En desarrollo (localhost): Los datos se guardan en el navegador de desarrollo
   - En producción: Los datos se guardan en el navegador de cada usuario

3. **Backup**: IndexedDB no tiene backup automático. Si borras la base de datos, **se pierden todos los datos permanentemente**.

4. **Sobreescritura**: Recuerda que los usuarios solo pueden sobreescribir sus puntajes si el nuevo es **mayor** que el anterior.

---

## 🚀 Resetear Todo para Testing

Si quieres empezar completamente de cero para testing:

```javascript
// En la consola del navegador:
indexedDB.deleteDatabase('JuegosZScores');
localStorage.clear(); // Por si tienes datos legacy
sessionStorage.clear();
location.reload();
```

---

**¡Listo!** Ahora puedes administrar tu base de datos fácilmente 🎮
