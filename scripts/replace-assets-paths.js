import { readFile, writeFile } from 'fs/promises';
import globby from 'globby';

// Reemplaza todas las ocurrencias de 'assets-optimized' por 'assets' en archivos seleccionados.
// Usa con cuidado: hace backup de cada archivo como <file>.bak antes de sobrescribir.

const GLOBS = ['src/**/*.{js,jsx,css,scss,ts,tsx,html}', 'public/**/*.*', 'build/**/*.*'];

(async () => {
  const files = await globby(GLOBS, { dot: true });
  if (files.length === 0) {
    console.log('No se encontraron archivos a procesar.');
    return;
  }

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf8');
      if (!content.includes('assets-optimized')) continue;
      const bak = file + '.bak';
      await writeFile(bak, content, 'utf8');
      const replaced = content.split('assets-optimized').join('assets');
      await writeFile(file, replaced, 'utf8');
      console.log(`✔ Reemplazado en: ${file} (backup: ${bak})`);
    } catch (err) {
      console.warn(`⚠ Error procesando ${file}: ${err.message}`);
    }
  }
  console.log('Reemplazos completados. Revisa backups con extensión .bak si necesitas revertir.');
})();
