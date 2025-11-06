import { useCallback, useRef } from 'react';

export const useTatetiSounds = (gameVolume = 1) => {
  // Refs para controlar el cooldown de cada sonido
  const soundCooldowns = useRef({
    mrSatan: false,
    tien: false,
    vegeta: false,
    scoreReset: false
  });

  // Función helper para manejar el cooldown
  const playSoundWithCooldown = useCallback((audio, soundKey, cooldownTime = 2000) => {
    if (soundCooldowns.current[soundKey]) return;
    
    soundCooldowns.current[soundKey] = true;
    audio.play().catch(() => {});
    
    setTimeout(() => {
      soundCooldowns.current[soundKey] = false;
    }, cooldownTime);
  }, []);
  const playWrongMoveSound = useCallback(() => {
    const audio = new Audio('/sounds/TatetiSounds/TatetiWrong.mp3');
    audio.volume = 0.3 * gameVolume;
    audio.play().catch(() => {});
  }, [gameVolume]);

  const playDrawSound = useCallback(() => {
    const audio = new Audio('/sounds/TatetiSounds/Draw.mp3');
    audio.volume = 0.4 * gameVolume;
    audio.play().catch(() => {});
  }, [gameVolume]);

  const playMachineWinsSound = useCallback(() => {
    const audio = new Audio('/sounds/TatetiSounds/MachineWins.mp3');
    audio.volume = 0.4 * gameVolume;
    audio.play().catch(() => {});
  }, [gameVolume]);

  const playPlayerWinsSound = useCallback(() => {
    const audio = new Audio('/sounds/TatetiSounds/PlayerWins.mp3');
    audio.volume = 0.4 * gameVolume;
    audio.play().catch(() => {});
  }, [gameVolume]);

  const playPlacePieceSound = useCallback(() => {
    const audio = new Audio('/sounds/TatetiSounds/TatetiFicha.mp3');
    audio.volume = 0.3 * gameVolume;
    audio.play().catch(() => {});
  }, [gameVolume]);

  const playResetBoardSound = useCallback(() => {
    const audio = new Audio('/sounds/TatetiSounds/TatetiReset.mp3');
    audio.volume = 0.4 * gameVolume;
    audio.play().catch(() => {});
  }, [gameVolume]);

  // Nuevos sonidos para selección de dificultad
  const playMrSatanChosenSound = useCallback(() => {
    const audio = new Audio('/sounds/TatetiSounds/MrSatanChosen.mp3');
    audio.volume = 0.4 * gameVolume;
    playSoundWithCooldown(audio, 'mrSatan');
  }, [gameVolume, playSoundWithCooldown]);

  const playTienChosenSound = useCallback(() => {
    const audio = new Audio('/sounds/TatetiSounds/TienChosen.mp3');
    audio.volume = 0.4 * gameVolume;
    playSoundWithCooldown(audio, 'tien');
  }, [gameVolume, playSoundWithCooldown]);

  const playVegetaChosenSound = useCallback(() => {
    const audio = new Audio('/sounds/TatetiSounds/VegetaChosen.mp3');
    audio.volume = 0.4 * gameVolume;
    playSoundWithCooldown(audio, 'vegeta');
  }, [gameVolume, playSoundWithCooldown]);

  const playScoreResetSound = useCallback(() => {
    const audio = new Audio('/sounds/TatetiSounds/ScoreReset.mp3');
    audio.volume = 0.4 * gameVolume;
    playSoundWithCooldown(audio, 'scoreReset');
  }, [gameVolume, playSoundWithCooldown]);

  return {
    playDrawSound,
    playMachineWinsSound,
    playPlayerWinsSound,
    playPlacePieceSound,
    playResetBoardSound,
    playWrongMoveSound,
    playMrSatanChosenSound,
    playTienChosenSound,
    playVegetaChosenSound,
    playScoreResetSound
  };
};