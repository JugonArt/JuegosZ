import { useEffect, useRef } from 'react';

export const useNameSelectorSounds = () => {
  const openSound = useRef(null);
  const closeSound = useRef(null);
  const selectedSound = useRef(null);

  useEffect(() => {
    openSound.current = new Audio('/sounds/LobbySounds/NameSelectorOpen.mp3');
    closeSound.current = new Audio('/sounds/LobbySounds/NameSelectorClose.mp3');
    selectedSound.current = new Audio('/sounds/LobbySounds/NameSelectorSelected.mp3');

    openSound.current.volume = 0.6;
    closeSound.current.volume = 0.6;
    selectedSound.current.volume = 0.3;

    return () => {
      openSound.current = null;
      closeSound.current = null;
      selectedSound.current = null;
    };
  }, []);

  const playOpenSound = () => {
    if (openSound.current) {
      openSound.current.currentTime = 0;
      openSound.current.play();
    }
  };

  const playCloseSound = () => {
    if (closeSound.current) {
      closeSound.current.currentTime = 0;
      closeSound.current.play();
    }
  };

  const playSelectedSound = () => {
    if (selectedSound.current) {
      selectedSound.current.currentTime = 0;
      selectedSound.current.play();
    }
  };

  return {
    playOpenSound,
    playCloseSound,
    playSelectedSound
  };
};