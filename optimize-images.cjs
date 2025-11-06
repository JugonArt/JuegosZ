const { globby } = require('globby');
const { readFile, writeFile, mkdir } = require('fs/promises');
const { dirname, join, relative } = require('path');
const sharp = require('sharp');

// Convierte imágenes encontradas en `src/assets` a WebP y AVIF y escribe en `src/assets`.
// Conserva la estructura de carpetas y también escribe una versión optimizada en el mismo formato.

const WEBP_QUALITY = 80;
const AVIF_QUALITY = 40; // AVIF suele lograr tamaños menores con menor calidad numérica
const JPEG_QUALITY = 82;

const run = async () => {
  const files = await globby(['src/assets/**/*.{jpg,jpeg,png,webp}']);

  for (const file of files) {
    try {
      const buffer = await readFile(file);
      const relPath = relative('src/assets', file);
      const baseName = relPath.replace(/\.[^.]+$/, '');
  const destDir = join('src/assets', dirname(relPath));
      await mkdir(destDir, { recursive: true });

      // Generar WebP
      try {
        const webpBuf = await sharp(buffer).webp({ quality: WEBP_QUALITY }).toBuffer();
  await writeFile(join('src/assets', `${baseName}.webp`), webpBuf);
      } catch (err) {
        console.warn(`⚠ No se pudo crear WebP para ${relPath}: ${err.message}`);
      }

      // Generar AVIF
      try {
        const avifBuf = await sharp(buffer).avif({ quality: AVIF_QUALITY }).toBuffer();
  await writeFile(join('src/assets', `${baseName}.avif`), avifBuf);
      } catch (err) {
        console.warn(`⚠ No se pudo crear AVIF para ${relPath}: ${err.message}`);
      }

      // Escribir una versión optimizada en su formato original (jpg/png)
      const lower = file.toLowerCase();
      try {
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
          const jpg = await sharp(buffer).jpeg({ quality: JPEG_QUALITY }).toBuffer();
          await writeFile(join('src/assets', `${baseName}.jpg`), jpg);
        } else if (lower.endsWith('.png')) {
          // pngquant-like: convertir a PNG optimizado (sharp no tiene pngquant, pero optimiza)
          const png = await sharp(buffer).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
          await writeFile(join('src/assets', `${baseName}.png`), png);
        } else if (lower.endsWith('.webp')) {
          const webp = await sharp(buffer).webp({ quality: WEBP_QUALITY }).toBuffer();
          await writeFile(join('src/assets', `${baseName}.webp`), webp);
        }
      } catch (err) {
        console.warn(`⚠ Error al escribir versión optimizada para ${relPath}: ${err.message}`);
      }

      console.log(`✔ Procesada: ${relPath}`);
    } catch (err) {
      console.warn(`⚠ Error procesando ${file}: ${err.message}`);
    }
  }
};

run();
