import { useState, useCallback, useRef, useEffect } from 'react';

const useMobileControls = (gameState) => {
  const [mobileKeys, setMobileKeys] = useState({});
  const activeControlsRef = useRef(new Set());

  // Mapeo de controles móviles a teclas del juego
  const controlKeyMap = {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    shoot: 'KeyQ',
    loop: 'ShiftLeft',
  };

  const handleControlPress = useCallback((control) => {
    const key = controlKeyMap[control];
    if (key && !activeControlsRef.current.has(control)) {
      activeControlsRef.current.add(control);
      setMobileKeys((prev) => ({
        ...prev,
        [key]: true,
      }));

      // Feedback háptico si está disponible
      if (navigator.vibrate) {
        switch (control) {
          case 'shoot':
            navigator.vibrate(50); // Vibración corta para disparo
            break;
          case 'loop':
            navigator.vibrate([50, 50, 50]); // Patrón para loop
            break;
          default:
            navigator.vibrate(30); // Vibración suave para movimiento
        }
      }
    }
  }, []);

  const handleControlRelease = useCallback((control) => {
    const key = controlKeyMap[control];
    if (key && activeControlsRef.current.has(control)) {
      activeControlsRef.current.delete(control);
      setMobileKeys((prev) => ({
        ...prev,
        [key]: false,
      }));
    }
  }, []);

  // Función para limpiar todos los controles activos
  const clearAllControls = useCallback(() => {
    if (activeControlsRef.current.size > 0) {
      activeControlsRef.current.clear();
      const clearedKeys = {};
      Object.values(controlKeyMap).forEach((key) => {
        clearedKeys[key] = false;
      });
      setMobileKeys(clearedKeys);
    }
  }, []);

  // Limpiar controles cuando el juego no esté activo
  useEffect(() => {
    if (gameState !== 'playing') {
      clearAllControls();
    }
  }, [gameState, clearAllControls]);

  return {
    mobileKeys,
    handleControlPress,
    handleControlRelease,
    clearAllControls,
    activeControls: activeControlsRef.current,
  };
};

export default useMobileControls;
