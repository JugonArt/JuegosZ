import React, { useEffect, useState, useCallback } from 'react';
import useMobileDetection from '../../hooks1942/useMobileDetection';
import './OrientationLock.css';

const OrientationLock = () => {
  const { isMobile, isTablet, orientation } = useMobileDetection();
  const isMobileOrTablet = isMobile || isTablet;
  const [showOverlay, setShowOverlay] = useState(false);
  const [triedLock, setTriedLock] = useState(false);

  const updateOverlay = useCallback(() => {
    // Show overlay when device is mobile/tablet and currently in landscape
    setShowOverlay(isMobileOrTablet && orientation === 'landscape');
  }, [isMobileOrTablet, orientation]);

  useEffect(() => {
    updateOverlay();
  }, [updateOverlay]);

  useEffect(() => {
    if (!isMobileOrTablet) return; // only apply on phones/tablets

    const tryLock = async () => {
      if (triedLock) return;
      setTriedLock(true);
      const screenOrientation = (window.screen && window.screen.orientation) || window.screen;
      try {
        if (screenOrientation && typeof screenOrientation.lock === 'function') {
          await screenOrientation.lock('portrait-primary');
          // If lock succeeds, overlay shouldn't be necessary, but we'll still respect orientation updates
          updateOverlay();
        }
      } catch (err) {
        // Lock failed (common on iOS or without user gesture). We'll rely on the overlay fallback.
        // No-op: overlay will be used to block landscape interactions.
        // console.debug('Orientation lock not available or failed:', err);
      }
    };

    // Try to lock immediately and also on first user interaction (some browsers require a gesture)
    tryLock();

    const onFirstTouch = () => {
      tryLock();
      window.removeEventListener('touchstart', onFirstTouch);
      window.removeEventListener('click', onFirstTouch);
    };

    window.addEventListener('touchstart', onFirstTouch);
    window.addEventListener('click', onFirstTouch);

    // Keep overlay state in sync with orientation changes
    const onOrient = () => {
      setTimeout(updateOverlay, 120);
    };
    window.addEventListener('orientationchange', onOrient);
    window.addEventListener('resize', onOrient);

    return () => {
      window.removeEventListener('touchstart', onFirstTouch);
      window.removeEventListener('click', onFirstTouch);
      window.removeEventListener('orientationchange', onOrient);
      window.removeEventListener('resize', onOrient);
    };
  }, [isMobileOrTablet, triedLock, updateOverlay]);

  if (!isMobileOrTablet) return null; // do nothing on desktop

  return (
    <>
      {showOverlay && (
        <div className="orientation-lock-overlay" role="dialog" aria-modal="true">
          <div className="orientation-lock-content">
            <div className="rotate-icon" aria-hidden="true">↻</div>
            <h2>Gira tu dispositivo</h2>
            <p>Este juego se juega en vertical. Por favor, gira el teléfono para continuar.</p>
            <button className="orientation-lock-button" onClick={() => window.location.reload()}>
              Volver a comprobar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OrientationLock;
