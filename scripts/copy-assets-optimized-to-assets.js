import { stat, mkdir, copyFile, readdir } from 'fs/promises';
import { join } from 'path';

const SRC = 'src/assets-optimized';
const DEST = 'src/assets';

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function copyRecursive(srcDir, destDir) {
  await ensureDir(destDir);
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      try {
        // If dest exists and same size, skip to be faster
        let doCopy = true;
        try {
          const [sStat, dStat] = await Promise.all([stat(srcPath), stat(destPath)]);
          if (sStat.size === dStat.size) doCopy = false;
        } catch (e) {
          // dest doesn't exist or error -> copy
          doCopy = true;
        }

        if (doCopy) {
          await copyFile(srcPath, destPath);
          console.log(`✔ Copiado: ${srcPath} -> ${destPath}`);
        } else {
          console.log(`· Ya existe (skip): ${destPath}`);
        }
      } catch (err) {
        console.warn(`⚠ Error copiando ${srcPath}: ${err.message}`);
      }
    }
  }
}

(async () => {
  try {
    console.log(`Iniciando copia: ${SRC} -> ${DEST}`);
    await copyRecursive(SRC, DEST);
    console.log('Copia completada. Revisa `src/assets` para verificar.');
  } catch (err) {
    console.error('Error en copia:', err);
    process.exitCode = 1;
  }
})();
