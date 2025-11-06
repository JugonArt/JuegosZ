import { useCallback, useRef } from 'react';

export const usePPTSounds = (gameVolume = 1) => {
  // cooldowns and timeout refs
  const soundCooldowns = useRef({ choice: false });
  const gestureTimeouts = useRef([]);
  const resultTimeouts = useRef([]);

  const playSoundWithCooldown = useCallback((src, soundKey, cooldownTime = 500, volume = 2) => {
    if (soundCooldowns.current[soundKey]) return;
    soundCooldowns.current[soundKey] = true;
    const audio = new Audio(src);
    audio.volume = Math.min(1, volume * gameVolume);
    audio.preload = 'auto';
    audio.play().catch(() => {});
    setTimeout(() => { soundCooldowns.current[soundKey] = false; }, cooldownTime);
  }, [gameVolume]);

  const playChoiceChosenSound = useCallback(() => {
    // Play immediately for either player, but prevent spam with a short cooldown
  playSoundWithCooldown('/sounds/PPTSounds/ChoiceChosen.mp3', 'choice', 500, 2);
  }, [playSoundWithCooldown]);

  const playHandGestureSounds = useCallback(() => {
    // clear previous gesture timeouts
    gestureTimeouts.current.forEach(t => clearTimeout(t));
    gestureTimeouts.current = [];

    const play = () => {
      const a = new Audio('/sounds/PPTSounds/HandGesture.mp3');
      a.preload = 'auto';
      a.volume = Math.min(1, 2 * gameVolume);
      a.play().catch(() => {});
    };

    // play at 0ms and ~half animation (500ms)
    play();
    const t = setTimeout(() => play(), 500);
    gestureTimeouts.current.push(t);
  }, [gameVolume]);

  // winner: 'draw' | 'winner'
  const playResultSounds = useCallback((winner, isPlayer1) => {
    // clear previous result timeouts
    resultTimeouts.current.forEach(t => clearTimeout(t));
    resultTimeouts.current = [];
    // Keep a placeholder timeout to align with animations; actual per-character
    // sounds (win/lose) and life lost sounds are triggered by class/state
    // changes in the components to avoid duplication and ensure sync.
    const t = setTimeout(() => {}, 1000);
    resultTimeouts.current.push(t);
  }, [gameVolume]);

  // Per-sound helpers tied to class/DOM changes
  const playGokuWins = useCallback(() => {
    const a = new Audio('/sounds/PPTSounds/GokuWins.mp3');
    a.preload = 'auto';
    a.volume = Math.min(1, 2 * gameVolume);
    a.play().catch(() => {});
  }, [gameVolume]);

  const playGokuLoose = useCallback(() => {
    const a = new Audio('/sounds/PPTSounds/GokuLoose.mp3');
    a.preload = 'auto';
    a.volume = Math.min(1, 2 * gameVolume);
    a.play().catch(() => {});
  }, [gameVolume]);

  const playVegetaWins = useCallback(() => {
    const a = new Audio('/sounds/PPTSounds/VegetaWins.mp3');
    a.preload = 'auto';
    a.volume = Math.min(1, 2 * gameVolume);
    a.play().catch(() => {});
  }, [gameVolume]);

  const playVegetaLoose = useCallback(() => {
    // file in repo is named Vegetaloose.mp3 (lowercase L), match exact filename
    const a = new Audio('/sounds/PPTSounds/Vegetaloose.mp3');
    a.preload = 'auto';
    a.volume = Math.min(1, 2 * gameVolume);
    a.play().catch(() => {});
  }, [gameVolume]);

  const playAndroid16Loose = useCallback(() => {
    const a = new Audio('/sounds/PPTSounds/Android16Loose.mp3');
    a.preload = 'auto';
    a.volume = Math.min(1, 2 * gameVolume);
    a.play().catch(() => {});
  }, [gameVolume]);

  const playPPTLoose = useCallback(() => {
    const a = new Audio('/sounds/PPTSounds/PPTLoose.mp3');
    a.preload = 'auto';
    a.volume = Math.min(1, 2 * gameVolume);
    a.play().catch(() => {});
  }, [gameVolume]);

  const playPPTDraw = useCallback(() => {
    const a = new Audio('/sounds/PPTSounds/PPTDraw.mp3');
    a.preload = 'auto';
    a.volume = Math.min(1, 2 * gameVolume);
    a.play().catch(() => {});
  }, [gameVolume]);

  const playContinueGame = useCallback(() => {
    const a = new Audio('/sounds/PPTSounds/ContinueGame.mp3');
    a.preload = 'auto';
    a.volume = Math.min(1, 2 * gameVolume);
    a.play().catch(() => {});
  }, [gameVolume]);

  const cleanup = useCallback(() => {
    gestureTimeouts.current.forEach(t => clearTimeout(t));
    gestureTimeouts.current = [];
    resultTimeouts.current.forEach(t => clearTimeout(t));
    resultTimeouts.current = [];
  }, []);
  return {
    playChoiceChosenSound,
    playHandGestureSounds,
    playResultSounds,
    playPPTDraw,
    playContinueGame,
    playGokuWins,
    playGokuLoose,
    playVegetaWins,
    playVegetaLoose,
    playAndroid16Loose,
    playPPTLoose,
    cleanup,
  };
};