import { useEffect, useRef, useCallback } from 'react';

// Hook ligero y robusto para los sonidos del lobby.
// - src: string (ruta al recurso de audio)
// - opts: { volume }
// Devuelve una función `play()` que intenta reproducir clonando el elemento
// interno para permitir solapamiento y captura errores sin lanzar.
export default function useLobbySound(src, opts = {}) {
  const audioRef = useRef(null);
  const readyRef = useRef(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!src) return undefined;

    let mounted = true;
    attemptsRef.current = 0;

    const create = (candidate) => {
      try {
        const a = new Audio();
        a.preload = 'auto';
        a.src = candidate;
        if (typeof opts.volume === 'number') a.volume = opts.volume;

        const onCan = () => {
          readyRef.current = true;
        };
        const onErr = () => {
          readyRef.current = false;
        };

        a.addEventListener('canplaythrough', onCan, { once: true });
        a.addEventListener('error', onErr, { once: true });
        // trigger load
        try { a.load(); } catch (e) {}
        return a;
      } catch (e) {
        return null;
      }
    };

    // Accept either string or array of candidates
    const candidates = Array.isArray(src) ? src : [src];

    const tryLoad = () => {
      if (!mounted) return;
      const c = candidates[Math.min(attemptsRef.current, candidates.length - 1)];
      const a = create(c);
      audioRef.current = a;

      // If after a short timeout it's not ready, mark not ready but keep the element
      const t = setTimeout(() => {
        if (!readyRef.current) readyRef.current = false;
      }, 3000);

      return () => clearTimeout(t);
    };

    const cleanupTimer = tryLoad();

    return () => {
      mounted = false;
      if (cleanupTimer) cleanupTimer();
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }
      } catch (e) {}
    };
  }, [src, opts.volume]);

  // play function clones the preloaded audio element so multiple plays can overlap.
  const play = useCallback((playOpts = {}) => {
    try {
      const base = audioRef.current;
      if (!base) return;

      // If not ready, still try to play using a fresh element to avoid 'no supported source'
      const node = base.cloneNode(true);
      if (typeof playOpts.volume === 'number') node.volume = playOpts.volume;

      const p = node.play();
      if (p && typeof p.then === 'function') {
        p.catch((err) => {
          // swallow errors to avoid unhandled promise rejections
          // but increment attempts so future loads can retry or fallback
          attemptsRef.current += 1;
          // best-effort: if we fail repeatedly we silently ignore
          // console.debug('useLobbySound: play error', err);
        });
      }
      // detach source when ended to free memory
      node.addEventListener('ended', () => {
        try { node.src = ''; } catch (e) {}
      }, { once: true });
    } catch (e) {
      // swallow
    }
  }, []);

  return play;
}
