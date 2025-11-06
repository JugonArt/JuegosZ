import { useState, useEffect } from 'react';

const useKeyboard = (gameState, setGameState, onTogglePause = null) => {
  const [keys, setKeys] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Evitar bloquear inputs o textareas
      const t = e.target;
      const isEditable =
        (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) ||
        (t && t.isContentEditable);
    
      if (isEditable) return; // <-- no hacemos nada si está escribiendo
    
      // Solo manejar teclas de juego, ESC lo maneja MenuPausa.jsx
      setKeys((prev) => ({ ...prev, [e.code]: true }));
      e.preventDefault(); // <-- solo si no estaba en input
    };
    
    const handleKeyUp = (e) => {
      // Evitar bloquear inputs o textareas
      const t = e.target;
      const isEditable =
        (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) ||
        (t && t.isContentEditable);
    
      if (isEditable) return;
    
      setKeys((prev) => ({ ...prev, [e.code]: false }));
      e.preventDefault();
    };

    // Manejar pausa automática al cambiar de pestaña o perder foco
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === "playing") {
        setGameState("paused");
      }
    };

    const handleBlur = () => {
      if (gameState === "playing") {
        setGameState("paused");
      }
    };

    // Event listeners para teclado
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Event listeners para pausa automática
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [gameState, setGameState, onTogglePause]);

  return keys;
};

export default useKeyboard;
