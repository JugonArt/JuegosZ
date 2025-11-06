import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import styles from '../styles/Puntajes.module.css';
import { getSpaceInvadersScores, getSimonDiceScores } from '../../utils/scoreDatabase';

const Puntajes = ({ animate }) => {
  // State for database scores (initially empty)
  const [spaceRows, setSpaceRows] = useState([]);
  const [simonRows, setSimonRows] = useState([]);

  const [open, setOpen] = useState({ space: false, simon: false });

  // Audio refs for open/close sounds
  const openAudioRef = useRef(null);
  const closeAudioRef = useRef(null);

  // Refs for measured-height accordion control
  const spaceBodyRef = useRef(null);
  const spaceContentRef = useRef(null);
  const simonBodyRef = useRef(null);
  const simonContentRef = useRef(null);
  const spaceObserverRef = useRef(null);
  const simonObserverRef = useRef(null);

  useEffect(() => {
    try {
      openAudioRef.current = new Audio('/sounds/LobbySounds/PauseMenuOpen1.mp3');
      closeAudioRef.current = new Audio('/sounds/LobbySounds/NameSelectorClose.mp3');
      openAudioRef.current.volume = 0.6;
      closeAudioRef.current.volume = 0.6;
    } catch (e) {
      // ignore
    }
  }, []);

  // Load scores from database on mount
  useEffect(() => {
    const loadScores = async () => {
      try {
        const [spaceScores, simonScores] = await Promise.all([
          getSpaceInvadersScores(),
          getSimonDiceScores()
        ]);
        setSpaceRows(spaceScores);
        setSimonRows(simonScores);
      } catch (error) {
        console.error('[Puntajes] Error loading scores:', error);
      }
    };
    loadScores();

    // Listen for score updates
    const handleScoreUpdate = (event) => {
      const { game } = event.detail || {};
      if (game === 'spaceinvaders') {
        getSpaceInvadersScores().then(setSpaceRows).catch(console.error);
      } else if (game === 'simondice') {
        getSimonDiceScores().then(setSimonRows).catch(console.error);
      }
    };

    window.addEventListener('scoreUpdated', handleScoreUpdate);
    return () => window.removeEventListener('scoreUpdated', handleScoreUpdate);
  }, []);

  // helper to play sound safely
  const playSound = (audio) => {
    try {
      if (audio && typeof audio.play === 'function') {
        const p = audio.play();
        if (p && typeof p.then === 'function') p.catch(() => {});
      }
    } catch (e) {}
  };

  // Compute sorted SpaceInvaders rows with ranking and the field that determined their position
  const sortedSpace = React.useMemo(() => {
    const rows = Array.isArray(spaceRows) ? [...spaceRows] : [];
    if (rows.length === 0) return [];

    // Calcular score compuesto: puntuación ponderada + nivel ponderado
    // El nivel tiene un peso importante pero la puntuación sigue siendo relevante
    rows.forEach(r => {
      const puntuacion = r.puntuacion ?? 0;
      const nivel = r.nivel ?? 0;
      
      // Fórmula: Score compuesto = puntuación + (nivel * multiplicador)
      // El multiplicador hace que cada nivel adicional valga mucho
      // Por ejemplo: nivel 2 suma 5000 puntos, nivel 3 suma 10000, etc.
      const levelMultiplier = 5000;
      r.scoreCompuesto = puntuacion + (nivel * levelMultiplier);
    });

    // Ordenar por score compuesto DESC, luego nombre ASC como desempate final
    rows.sort((a, b) => {
      const diffCompuesto = (b.scoreCompuesto ?? 0) - (a.scoreCompuesto ?? 0);
      if (diffCompuesto !== 0) return diffCompuesto;
      const an = (a.nombre || '').toString().toLowerCase();
      const bn = (b.nombre || '').toString().toLowerCase();
      return an.localeCompare(bn);
    });

    // Determinar qué campo es más importante para el resaltado visual
    // Si dos jugadores tienen score compuesto similar, ver qué los diferencia más
    return rows.map((r, idx) => {
      // Comparar con el siguiente jugador para determinar el campo importante
      const next = rows[idx + 1];
      let importantField = 'puntuacion'; // por defecto
      
      if (next) {
        const scoreDiff = Math.abs((r.puntuacion ?? 0) - (next.puntuacion ?? 0));
        const levelDiff = Math.abs((r.nivel ?? 0) - (next.nivel ?? 0));
        
        // Si la diferencia de nivel es significativa, resaltar nivel
        // De lo contrario, resaltar puntuación
        if (levelDiff > 0 && scoreDiff < 1000) {
          importantField = 'nivel';
        }
      }
      
      return { ...r, puesto: idx + 1, importantField };
    });
  }, [spaceRows]);

  // Compute sorted SimonDice rows similarly: ronda DESC, nivel DESC, nombre ASC
  const sortedSimon = React.useMemo(() => {
    const rows = Array.isArray(simonRows) ? [...simonRows] : [];
    if (rows.length === 0) return [];

    // Ordenar: nivel DESC (más importante), ronda DESC, nombre ASC
    rows.sort((a, b) => {
      const diffNivel = (b.nivel ?? 0) - (a.nivel ?? 0);
      if (diffNivel !== 0) return diffNivel;
      const diffRonda = (b.ronda ?? 0) - (a.ronda ?? 0);
      if (diffRonda !== 0) return diffRonda;
      const an = (a.nombre || '').toString().toLowerCase();
      const bn = (b.nombre || '').toString().toLowerCase();
      return an.localeCompare(bn);
    });

    // Maps for ties by nivel (cambiar de ronda a nivel)
    const countByNivel = new Map();
    const rondaSetByNivel = new Map();
    for (const r of rows) {
      const niv = r.nivel ?? 0;
      countByNivel.set(niv, (countByNivel.get(niv) || 0) + 1);
      const set = rondaSetByNivel.get(niv) || new Set();
      set.add(r.ronda ?? 0);
      rondaSetByNivel.set(niv, set);
    }

    return rows.map((r, idx) => {
      const nivelCount = countByNivel.get(r.nivel ?? 0) || 0;
      const rondaSet = rondaSetByNivel.get(r.nivel ?? 0) || new Set([r.ronda ?? 0]);
      const rondaVaries = rondaSet.size > 1;
      const importantField = nivelCount > 1 && rondaVaries ? 'ronda' : 'nivel';
      return { ...r, puesto: idx + 1, importantField };
    });
  }, [simonRows]);

  // Helpers to control max-height with JS for smooth, jump-free transitions
  const setOpenHeight = (bodyEl, contentEl) => {
    if (!bodyEl || !contentEl) return;
    const h = contentEl.scrollHeight;
    bodyEl.style.maxHeight = h + 'px';
  };

  const setCloseHeight = (bodyEl) => {
    if (!bodyEl) return;
    // Capture current computed max-height to avoid jumps when closing mid-transition
    const comp = window.getComputedStyle(bodyEl);
    const current = parseFloat(comp.maxHeight);
    if (!Number.isNaN(current)) {
      bodyEl.style.maxHeight = current + 'px';
      // force reflow so the following change transitions
      // eslint-disable-next-line no-unused-expressions
      bodyEl.offsetHeight;
    }
    bodyEl.style.maxHeight = '0px';
  };

  // Sync heights when toggling Space accordion
  useLayoutEffect(() => {
    const body = spaceBodyRef.current;
    const content = spaceContentRef.current;
    if (!body || !content) return;

    if (open.space) {
      setOpenHeight(body, content);
      // Observe content size changes while open
      if (!spaceObserverRef.current && 'ResizeObserver' in window) {
        spaceObserverRef.current = new ResizeObserver(() => setOpenHeight(body, content));
        spaceObserverRef.current.observe(content);
      }
    } else {
      // Stop observing and animate close
      if (spaceObserverRef.current) {
        spaceObserverRef.current.disconnect();
        spaceObserverRef.current = null;
      }
      setCloseHeight(body);
    }
  }, [open.space]);

  // Sync heights when toggling SimonDice accordion
  useLayoutEffect(() => {
    const body = simonBodyRef.current;
    const content = simonContentRef.current;
    if (!body || !content) return;

    if (open.simon) {
      setOpenHeight(body, content);
      if (!simonObserverRef.current && 'ResizeObserver' in window) {
        simonObserverRef.current = new ResizeObserver(() => setOpenHeight(body, content));
        simonObserverRef.current.observe(content);
      }
    } else {
      if (simonObserverRef.current) {
        simonObserverRef.current.disconnect();
        simonObserverRef.current = null;
      }
      setCloseHeight(body);
    }
  }, [open.simon]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (spaceObserverRef.current) spaceObserverRef.current.disconnect();
    if (simonObserverRef.current) simonObserverRef.current.disconnect();
  }, []);

  return (
    <div className={styles.scoresContainer}>
      <div className={`${styles.scoresPanel} ${animate ? styles.entry : ''}`}>
        <h1 className={styles.title}>PUNTAJES</h1>
        <div className={styles.porunga} />
        <div className={styles.container}>
          <div className={styles.accordionWrap}>
            <div className={`${styles.accordionItem} ${open.space ? styles.opened : styles.closed}`}>
              <button
                className={styles.accordionHeader}
                onClick={() => {
                  // toggle space: only one open at a time
                  if (open.space) {
                    // closing
                    setOpen({ space: false, simon: false });
                    playSound(closeAudioRef.current);
                  } else {
                    // opening space; if simon open, close it first
                    if (open.simon) playSound(closeAudioRef.current);
                    setOpen({ space: true, simon: false });
                    playSound(openAudioRef.current);
                  }
                }}
                aria-expanded={open.space}
              >
                <span>SpaceInvaders</span>
                <span className={`${styles.accordionCaret} ${open.space ? styles.rotated : ''}`}>+</span>
              </button>

              <div
                ref={spaceBodyRef}
                className={`${styles.accordionBody} ${open.space ? styles.open : styles.closed}`}
              >
                <div className={styles.shenlong}/>
                <div ref={spaceContentRef} className={styles.accordionContent}>
                  <table className={styles.scoreTable}>
                    <thead className={styles.scoreTableHead}>
                      <tr>
                        <th>Puesto</th>
                        <th>Nombre</th>
                        <th>Nivel</th>
                        <th>Puntuación</th>
                      </tr>
                    </thead>
                    {sortedSpace && sortedSpace.length > 0 && (
                      <tbody>
                        {sortedSpace.map((r, idx) => {
                          const topClass = r.puesto <= 5 ? styles['top' + r.puesto] : '';
                          const nivelClass = r.importantField === 'nivel' ? styles.importante : '';
                          const puntClass = r.importantField === 'puntuacion' ? styles.importante : '';
                          return (
                            <tr key={idx} className={topClass}>
                              <td>{r.puesto}</td>
                              <td>{r.nombre}</td>
                              <td className={nivelClass}>{r.nivel}</td>
                              <td className={`${puntClass} ${styles.pointCell}`}>
                                <div className={styles.scoreCell}>
                                  <span>{r.puntuacion}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    )}
                  </table>
                  {(!sortedSpace || sortedSpace.length === 0) && (
                    <div className={styles.emptyMessage}>No hay puntajes guardados</div>
                  )}
                </div>
              </div>
            </div>

            <div className={`${styles.accordionItem} ${open.simon ? styles.opened : styles.closed}`}>
              <button
                className={styles.accordionHeader}
                onClick={() => {
                  if (open.simon) {
                    setOpen({ space: false, simon: false });
                    playSound(closeAudioRef.current);
                  } else {
                    if (open.space) playSound(closeAudioRef.current);
                    setOpen({ space: false, simon: true });
                    playSound(openAudioRef.current);
                  }
                }}
                aria-expanded={open.simon}
              >
                <span>SimonDice</span>
                <span className={`${styles.accordionCaret} ${open.simon ? styles.rotated : ''}`}>+</span>
              </button>

              <div
                ref={simonBodyRef}
                className={`${styles.accordionBody} ${open.simon ? styles.open : styles.closed}`}
              >
                <div className={styles.shenlong}/>
                <div ref={simonContentRef} className={styles.accordionContent}>
                  <table className={styles.scoreTable}>
                    <thead className={styles.scoreTableHead}>
                      <tr>
                        <th>Puesto</th>
                        <th>Nombre</th>
                        <th>Nivel</th>
                        <th>Ronda</th>
                      </tr>
                    </thead>
                    {sortedSimon && sortedSimon.length > 0 && (
                      <tbody>
                        {sortedSimon.map((r, idx) => {
                          const topClass = r.puesto <= 5 ? styles['top' + r.puesto] : '';
                          const nivelClass = r.importantField === 'nivel' ? styles.importante : '';
                          const rondaClass = r.importantField === 'ronda' ? styles.importante : '';
                          return (
                            <tr key={idx} className={topClass}>
                              <td>{r.puesto}</td>
                              <td>{r.nombre}</td>
                              <td className={nivelClass}>{r.nivel}</td>
                              <td className={`${rondaClass} ${styles.pointCell}`}>
                                <div className={styles.scoreCell}>
                                  <span>{r.ronda}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    )}
                  </table>
                  {(!sortedSimon || sortedSimon.length === 0) && (
                    <div className={styles.emptyMessage}>No hay puntajes guardados</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Puntajes;