import globby from 'globby';
import { mkdir, stat } from 'fs/promises';
import { dirname, join, relative } from 'path';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath);

// Convierte videos a WebM (VP9 + Opus) y MP4 (H.264 + AAC) como fallback.

const INPUT_GLOB = ['src/assets/**/*.{mp4,mov,avi,mkv,webm}'];
const OUT_DIR = 'src/assets';

const ensureDir = async (filePath) => {
  await mkdir(dirname(filePath), { recursive: true });
};

const convertToWebm = (inPath, outPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inPath)
      .outputOptions([
        '-c:v libvpx-vp9',
        '-crf 30',
        '-b:v 0',
        '-c:a libopus',
        '-b:a 64k',
        '-row-mt 1'
      ])
      .output(outPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};

const convertToMp4 = (inPath, outPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inPath)
      .outputOptions([
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k'
      ])
      .output(outPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};

const run = async () => {
  const files = await globby(INPUT_GLOB);

  for (const file of files) {
    try {
      const rel = relative('src/assets', file);
      const base = rel.replace(/\.[^.]+$/, '');
      const webmOut = join(OUT_DIR, `${base}.webm`);
      const mp4Out = join(OUT_DIR, `${base}.mp4`);

      await ensureDir(webmOut);

      console.log(`🔁 Convirtiendo a WebM: ${rel}`);
      await convertToWebm(file, webmOut);
      console.log(`✔ WebM creado: ${webmOut}`);

      console.log(`🔁 Creando fallback MP4: ${rel}`);
      await convertToMp4(file, mp4Out);
      console.log(`✔ MP4 creado: ${mp4Out}`);
    } catch (err) {
      console.warn(`⚠ Error al convertir video ${file}: ${err.message}`);
    }
  }
};

run();
