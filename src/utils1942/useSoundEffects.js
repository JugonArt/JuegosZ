// src/utils/useSoundEffects.js

import { useEffect, useRef } from 'react';

const useSoundEffects = () => {
  // Usamos un useRef para almacenar los sonidos.
  // Esto evita problemas de sincronización de estado.
  const soundsRef = useRef({});

  useEffect(() => {
    const soundFiles = {
      playerShot: {
        url: "/1942extras/sound/kiblast1.ogg",
        volume: 0.1,
      },
      powerUp: {
        url: "/1942extras/sound/grab.ogg",
        volume: 0.5,
      },
      powerUpWingman: {
        url: "/1942extras/sound/powerup.ogg",
        volume: 0.6,
      },
      playerHit: {
        url: "/1942extras/sound/hit.ogg",
        volume: 0.7,
      },
      playerLoop: {
        url: "/1942extras/sound/loop.ogg",
        volume: 1,
      },
      wingmanlaugh: {
        url: "/1942extras/sound/Krillinjaja.ogg",
        volume: 1,
      },
      wingman: {
        url: "/1942extras/sound/Krillin.ogg",
        volume: 1,
      },
      explosion: {
        url: "/1942extras/sound/explosion.ogg",
        volume: 0.4,
      },
      intro: {
        url: "/1942extras/sound/BackgroundMusic.mp3",
        volume: 0.6,
      },
    };

    for (const key in soundFiles) {
      const audio = new Audio(soundFiles[key].url);
      // Asignamos el volumen antes de cargar el audio
      audio.volume = soundFiles[key].volume;
      audio.load();
      // Guardamos la configuración completa en el ref
      soundsRef.current[key] = { audio, volume: soundFiles[key].volume };
    }

    return () => {
      // Función de limpieza para detener los sonidos
      for (const key in soundsRef.current) {
        soundsRef.current[key].audio.pause();
        soundsRef.current[key].audio.currentTime = 0;
      }
    };
  }, []);

  const playSound = (soundName) => {
    const soundData = soundsRef.current[soundName];
    if (soundData) {
      const { audio, volume } = soundData;
      const clonedSound = audio.cloneNode();
      clonedSound.volume = volume;
      clonedSound.play().catch((e) => console.error("Error playing sound:", e));
    }
  };

  return { playSound };
};

export default useSoundEffects;