import React, { useState, useEffect, useCallback } from 'react';
import "../../styles/1942/MobileControls.module.css";

// Añadir onTogglePause a las props
const MobileControls = ({ onControlPress, onControlRelease, gameState, onTogglePause }) => {
  const [activeControls, setActiveControls] = useState(new Set());

  const handleTouchStart = useCallback((control) => {
    setActiveControls(prev => new Set([...prev, control]));
    onControlPress(control);
  }, [onControlPress]);

  const handleTouchEnd = useCallback((control) => {
    setActiveControls(prev => {
      const newSet = new Set(prev);
      newSet.delete(control);
      return newSet;
    });
    onControlRelease(control);
  }, [onControlRelease]);

  useEffect(() => {
    const preventDefaultTouch = (e) => {
      if (e.target.closest('.mobile-controls')) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    document.addEventListener('touchend', preventDefaultTouch, { passive: false });
    return () => {
      document.removeEventListener('touchstart', preventDefaultTouch);
      document.removeEventListener('touchmove', preventDefaultTouch);
      document.removeEventListener('touchend', preventDefaultTouch);
    };
  }, []);

  if (gameState !== 'playing') return null;

  return (
    <div className="mobile-controls">
      {/* Controles de movimiento - lado izquierdo */}
      <div className="movement-controls">
        <div className="d-pad">
          {/* ... (código de los botones de dirección sin cambios) ... */}
           <button
            className={`d-pad-btn up ${activeControls.has('up') ? 'active' : ''}`}
            onTouchStart={() => handleTouchStart('up')}
            onTouchEnd={() => handleTouchEnd('up')}
          >↑</button>
          <div className="d-pad-middle">
            <button
              className={`d-pad-btn left ${activeControls.has('left') ? 'active' : ''}`}
              onTouchStart={() => handleTouchStart('left')}
              onTouchEnd={() => handleTouchEnd('left')}
            >←</button>
            <div className="d-pad-center"></div>
            <button
              className={`d-pad-btn right ${activeControls.has('right') ? 'active' : ''}`}
              onTouchStart={() => handleTouchStart('right')}
              onTouchEnd={() => handleTouchEnd('right')}
            >→</button>
          </div>
          <button
            className={`d-pad-btn down ${activeControls.has('down') ? 'active' : ''}`}
            onTouchStart={() => handleTouchStart('down')}
            onTouchEnd={() => handleTouchEnd('down')}
          >↓</button>
        </div>
      </div>

      {/* Controles de acción - lado derecho */}
      <div className="action-controls">
        <button
          className={`action-btn loop-btn ${activeControls.has('loop') ? 'active' : ''}`}
          onTouchStart={() => handleTouchStart('loop')}
          onTouchEnd={() => handleTouchEnd('loop')}
        >
          <div className="btn-icon">🔄</div>
          <div className="btn-label">LOOP</div>
        </button>
        
        <button
          className={`action-btn shoot-btn ${activeControls.has('shoot') ? 'active' : ''}`}
          onTouchStart={() => handleTouchStart('shoot')}
          onTouchEnd={() => handleTouchEnd('shoot')}
        >
          <div className="btn-icon">🔫</div>
          <div className="btn-label">DISPARAR</div>
        </button>
      </div>

      {/* Botón de pausa flotante con evento onClick */}
      <button 
        className="mobile-pause-btn"
        onClick={onTogglePause} // Conectar la función de pausa
      >
        ⏸️
      </button>
    </div>
  );
};

export default MobileControls;