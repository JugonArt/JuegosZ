import globby from 'globby';
import { mkdir } from 'fs/promises';
import { join, relative, dirname } from 'path';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath);

const INPUT_GLOB = ['src/assets/**/*.{wav,mp3,ogg,m4a,aac}'];
const OUT_DIR = 'src/assets';

const ensureDir = async (filePath) => {
  await mkdir(dirname(filePath), { recursive: true });
};

const convertToOpusWebm = (inPath, outPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inPath)
      .outputOptions(['-c:a libopus', '-b:a 64k'])
      .output(outPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};

const convertToMp3 = (inPath, outPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inPath)
      .outputOptions(['-c:a libmp3lame', '-b:a 96k'])
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
      const webmOut = join(OUT_DIR, `${base}.webm`); // opus in webm container
      const mp3Out = join(OUT_DIR, `${base}.mp3`);

      await ensureDir(webmOut);

      console.log(`🔁 Convirtiendo audio a Opus(WebM): ${rel}`);
      await convertToOpusWebm(file, webmOut);
      console.log(`✔ Opus(WebM) creado: ${webmOut}`);

      console.log(`🔁 Creando fallback MP3: ${rel}`);
      await convertToMp3(file, mp3Out);
      console.log(`✔ MP3 creado: ${mp3Out}`);
    } catch (err) {
      console.warn(`⚠ Error al convertir audio ${file}: ${err.message}`);
    }
  }
};

run();
