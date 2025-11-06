import React, { useState, useEffect, useRef, useCallback } from 'react';
import bgm from '../../../utils/backgroundMusic.js';
import { ArrowLeft, Home } from 'lucide-react';
import GameForm from '../../UI/formularioradar.jsx';
import GameBoard from '../simondice/gameboard.jsx';
import ScoreTable from '../simondice/scoretable.jsx';
import AdminPanel from '../simondice/adminpanel.jsx';
import PauseMenu from '../../UI/MenuPausa.jsx';
import SinglePlayerGameOver from '../../UI/SinglePlayerGameOver.jsx';
import '../../styles/UI.css';
import styles from '../../styles/simondice/simon.module.css';
import Nube from '../../UI/nube.jsx';
import { saveSimonDiceScore } from '../../../utils/scoreDatabase.js';
import useMobileDetection from '../../../hooks1942/useMobileDetection';

const SimonDice = ({ onBack }) => {
  const tryPlayAudio = (ref, { clone = false } = {}) => {
    try {
      if (!ref?.current || !audioContextRef.current || !masterGainRef.current) return;
      if (clone) {
        const originalAudio = ref.current;
        const clonedAudio = new Audio();
        clonedAudio.src = originalAudio.src;
        const source = audioContextRef.current.createMediaElementSource(clonedAudio);
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = audioSourcesRef.current.get(originalAudio)?.gain.value || 1;
        source.connect(gainNode);
        gainNode.connect(masterGainRef.current);
        clonedAudio.play().catch(() => {});
      } else {
        ref.current.currentTime = 0;
        ref.current.play().catch(() => {});
      }
    } catch (e) {
      console.warn('Error reproduciendo audio:', e);
    }
  };
  const [gameState, setGameState] = useState('form'); // 'form', 'playing', 'gameOver', 'victory', 'levelCompleted', 'transitioning', 'ready'
  const [playerName, setPlayerName] = useState('');
  const [currentLevel, setCurrentLevel] = useState(1); // Nivel actual (1-3)
  const [currentRound, setCurrentRound] = useState(1); // Ronda actual dentro del nivel
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [gameOverData, setGameOverData] = useState(null); // Datos para UniversalGameOver
  const [spheresTransitioning, setSpheresTransitioning] = useState(false);
  const [illuminatedSphereId, setIlluminatedSphereId] = useState(null);
  const [showReadyScreen, setShowReadyScreen] = useState(false);
  const [showVideoTransition, setShowVideoTransition] = useState(false);
  const [videoPhase, setVideoPhase] = useState('blackScreen');
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [floatMode, setFloatMode] = useState('flotar'); // NUEVO ESTADO
  
  // Estados para animaciones de indicadores
  const [levelAnimating, setLevelAnimating] = useState(false);
  const [roundAnimating, setRoundAnimating] = useState(false);
  
  const audioRef = useRef(null);
  const secretCodeRef = useRef([]);
  
  // Refs para manejar timeouts pausables
  const pendingSequenceTimeoutRef = useRef(null);
  const sequenceStartTimeRef = useRef(null);
  const remainingTimeRef = useRef(null);
  const videoTransitionTimeoutRef = useRef(null); // Timeout de seguridad para transiciones de video
  
  // VOLUMEN y SFX específicos de Simon
  const [volume, setVolume] = useState(0.3);
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const playButtonRef = useRef(null);
  const movingObjectRef = useRef(null);
  const correctPatternRef = useRef(null);
  const esferaRef = useRef(null);
  const continueGameRef = useRef(null);
  const audioSourcesRef = useRef(new Map()); // Mapeo de fuentes de audio
  const [musicMuted, setMusicMuted] = useState(false);
  const { isDesktop } = useMobileDetection();

  // Sistema de niveles y rondas
  const levelConfig = {
    1: { maxRounds: 5, name: "Tierra" },
    2: { maxRounds: 8, name: "Namekusein" },
    3: { maxRounds: 10, name: "Espacio" }
  };
  
  const maxLevels = 3;

  // Función para calcular el patrón total basado en nivel y ronda
  const calculateTotalPatterns = useCallback((level, round) => {
    let totalPatterns = 0;
    
    // Sumar patrones de niveles anteriores
    for (let l = 1; l < level; l++) {
      totalPatterns += levelConfig[l].maxRounds;
    }
    
    // Sumar rondas del nivel actual
    totalPatterns += round;
    
    return totalPatterns;
  }, [levelConfig]);

  // Función para manejar el menú de pausa
  const togglePauseMenu = useCallback(() => {
    setShowPauseMenu(prev => {
      const newPauseState = !prev;
      
      // Si se está despausando y hay un callback pendiente, ejecutarlo
      if (!newPauseState && pendingSequenceTimeoutRef.callback) {
        const remainingTime = remainingTimeRef.current || 0;
        
        // Limpiar el timeout anterior si existe
        if (pendingSequenceTimeoutRef.current) {
          clearTimeout(pendingSequenceTimeoutRef.current);
        }
        
        // Programar la ejecución con el tiempo restante
        pendingSequenceTimeoutRef.current = setTimeout(() => {
          const callback = pendingSequenceTimeoutRef.callback;
          if (callback) {
            callback();
          }
          pendingSequenceTimeoutRef.current = null;
          pendingSequenceTimeoutRef.callback = null;
          sequenceStartTimeRef.current = null;
          remainingTimeRef.current = null;
        }, remainingTime);
      }
      
      return newPauseState;
    });
  }, []);
  
  // Función genérica para programar timeouts que respetan la pausa
  const schedulePausableTimeout = useCallback((callback, delay) => {
    // Guardar el timestamp de inicio
    sequenceStartTimeRef.current = Date.now();
    remainingTimeRef.current = delay;
    
    // Guardar el callback para ejecutarlo después
    pendingSequenceTimeoutRef.callback = callback;
    
    pendingSequenceTimeoutRef.current = setTimeout(() => {
      // Solo ejecutar si no está pausado
      if (!showPauseMenu) {
        callback();
        pendingSequenceTimeoutRef.current = null;
        pendingSequenceTimeoutRef.callback = null;
        sequenceStartTimeRef.current = null;
        remainingTimeRef.current = null;
      }
      // Si está pausado, el timeout se mantendrá guardado y se ejecutará al despausar
    }, delay);
  }, [showPauseMenu]);

  // Función para programar una secuencia que respeta la pausa
  const scheduleSequence = useCallback((sequenceToShow, delay) => {
    schedulePausableTimeout(() => showSequence(sequenceToShow), delay);
  }, [schedulePausableTimeout]);
  
  // Effect para detectar cuando se pausa durante un timeout pendiente
  useEffect(() => {
    if (showPauseMenu && pendingSequenceTimeoutRef.current) {
      // Calcular tiempo restante
      const elapsed = Date.now() - (sequenceStartTimeRef.current || Date.now());
      const remaining = Math.max(0, (remainingTimeRef.current || 0) - elapsed);
      
      // Actualizar tiempo restante
      remainingTimeRef.current = remaining;
      
      // Cancelar el timeout actual
      clearTimeout(pendingSequenceTimeoutRef.current);
      pendingSequenceTimeoutRef.current = null;
    }
  }, [showPauseMenu]);

  // Definición de esferas
  const spheres = [
    { id: 'esfera1', value: 'uno', name: 'Esfera 1' },
    { id: 'esfera2', value: 'dos', name: 'Esfera 2' },
    { id: 'esfera3', value: 'tres', name: 'Esfera 3' },
    { id: 'esfera4', value: 'cuatro', name: 'Esfera 4' },
    { id: 'esfera5', value: 'cinco', name: 'Esfera 5' },
    { id: 'esfera6', value: 'seis', name: 'Esfera 6' },
    { id: 'esfera7', value: 'siete', name: 'Esfera 7' }
  ];

  // Función para iniciar una nueva ronda
  const startNewRound = useCallback((delayBeforeSequence = 1000) => {
    const randomSphere = spheres[Math.floor(Math.random() * spheres.length)];
    const newSequence = [...sequence, randomSphere];

    setSequence(newSequence);
    setPlayerSequence([]);

    setFloatMode('flotar-stop');
    
    // Usar timeout pausable para el delay antes de mostrar la secuencia
    schedulePausableTimeout(() => {
      setFloatMode('');
      scheduleSequence(newSequence, 0);
    }, delayBeforeSequence);
  }, [sequence, scheduleSequence, schedulePausableTimeout, spheres]);

  // Control de ciclo de vida de la música: solo iniciar/reanudar cuando la partida está en 'playing'.
  useEffect(() => {
    if (gameState === 'playing') {
      try {
        bgm.init();
        bgm.setVolume(volume);
        bgm.play();
      } catch (e) {
        console.warn('[BGM] init/play error:', e);
      }
    } else {
      try { bgm.stop(); } catch (e) {}
    }
    return () => {
      try { bgm.stop(); } catch (e) {}
    };
  }, [gameState]);

  // SFX específicos de Simon
// Helper to initialize audio with gain node
function initAudioWithGain(path, baseVolume = 1) {
  const audio = new Audio(path);
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';
  const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
  if (!audioContextRef.current) audioContextRef.current = ctx;
  const gainNode = ctx.createGain();
  gainNode.gain.value = baseVolume;
  const source = ctx.createMediaElementSource(audio);
  source.connect(gainNode);
  gainNode.connect(masterGainRef.current || ctx.destination);
  return { audio, gainNode };
}
  useEffect(() => {
    const initSFX = (ref, path, baseVolume = 1) => {
      const { audio, gainNode } = initAudioWithGain(path, baseVolume);
      ref.current = audio;
      audioSourcesRef.current.set(audio, gainNode);
    };
    try {
      // Ensure there's a central AudioContext and master gain for the SFX graph
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (!masterGainRef.current) {
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.gain.value = volume;
        masterGainRef.current.connect(audioContextRef.current.destination);
      }

      initSFX(playButtonRef, '/sounds/SimonDiceSounds/PlayButtonSimon.mp3');
      initSFX(movingObjectRef, '/sounds/SimonDiceSounds/MovingObject.mp3');
      initSFX(correctPatternRef, '/sounds/SimonDiceSounds/CorrectPattern.mp3');
      initSFX(esferaRef, '/sounds/SimonDiceSounds/EsferasBrillan.mp3');
      initSFX(continueGameRef, '/sounds/PPTSounds/ContinueGame.mp3');
    } catch (error) {
      // Keep warning only for actual failures
      console.warn("Error al crear el elemento de audio:", error);
    }
    return () => {
      // Cleanup de SFX audio elements (background music managed centrally)
      try {
        if (playButtonRef.current) { playButtonRef.current.pause(); playButtonRef.current.src = ''; }
        if (movingObjectRef.current) { movingObjectRef.current.pause(); movingObjectRef.current.src = ''; }
        if (correctPatternRef.current) { correctPatternRef.current.pause(); correctPatternRef.current.src = ''; }
        if (esferaRef.current) { esferaRef.current.pause(); esferaRef.current.src = ''; }
      } catch (e) {
        // ignore
      }
      playButtonRef.current = null;
      movingObjectRef.current = null;
      correctPatternRef.current = null;
      esferaRef.current = null;
      continueGameRef.current = null;
    };
  }, []);
// ...existing code...

  // Actualizar volumen master cuando cambia el slider
  useEffect(() => {
    try {
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = volume;
      }
      
      // El video aún necesita control directo de volumen
      const videoElement = document.getElementById('transition-video');
      if (videoElement) {
        videoElement.volume = volume;
      }
    } catch (e) {}
  }, [volume]);

  // Código secreto para admin - Sistema robusto
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!event.key) return; // seguridad

      const key = event.key.toLowerCase();
      const adminCode = "ginyurana";

      // Agregar la tecla al buffer
      secretCodeRef.current.push(key);

      // Mantener solo los últimos 50 caracteres para evitar memory leaks
      if (secretCodeRef.current.length > 50) {
        secretCodeRef.current = secretCodeRef.current.slice(-50);
      }

      // Convertir el buffer a string y buscar el código
      const currentString = secretCodeRef.current.join("");
      
      // Buscar el código dentro de la cadena (permite teclas antes y después)
      if (currentString.includes(adminCode)) {
        console.log("¡Código de administrador activado!");
        setShowAdmin((prev) => !prev);
        // Limpiar el buffer después de activar
        secretCodeRef.current = [];
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sincronizar volume global con bgm (solo setea volumen, no reinicia música)
  useEffect(() => {
    try {
      bgm.setVolume(volume);
    } catch (e) {}
  }, [volume]);

  // Handler usado por PauseMenu para controlar música
  const handleToggleMusic = useCallback(() => {
    setMusicMuted((prev) => {
      const newMuted = !prev;
      try {
        if (newMuted) {
          bgm.pause();
        } else {
          bgm.resume();
        }
      } catch (e) {
        console.warn('[BGM] toggle music failed:', e);
      }
      return newMuted;
    });
  }, [bgm]);

  // Reaccionar a cambios de estado del juego para controlar la música
  const prevShouldPlayRef = useRef(null);
  // El menú de pausa solo alterna la UI, no manipula la música


  const startGame = useCallback((name) => {
    setPlayerName(name);
    setGameState('playing');
    setCurrentLevel(1);
    setCurrentRound(1);
    setSequence([]);
    setPlayerSequence([]);
    setIsPlaying(false);
    setAdminMode(false);
    setShowScores(false);
    setSpheresTransitioning(false);
    startNewRound(1000); // Usar delay interno pausable
  }, [startNewRound]);

  // Función para calcular la velocidad según el total de patrones
  const calculateTimings = useCallback((level, round) => {
    const totalPatterns = calculateTotalPatterns(level, round);
    
    // Tiempos base ultra-optimizados para intervalos súper cortos
    let baseIlluminationTime = 1400; // Tiempo base para iluminación (mantener visibilidad)
    let baseIntervalTime = 300;      // Tiempo base SÚPER CORTO para intervalos
    
    // Calculado para que en 22 patrones llegue exactamente a 200ms
    // 1400 * (0.91^21) = ~200ms
    const speedMultiplier = Math.pow(0.91, totalPatterns - 1);
    
    // Sin multiplicadores extra - progresión pura y lógica
    let difficultyMultiplier = 1;
    
    // Aplicar la fórmula con límites ultra-optimizados
    const illuminationTime = Math.max(baseIlluminationTime * speedMultiplier * difficultyMultiplier, 200); // Mínimo 0.2s
    const intervalTime = Math.max(baseIntervalTime * speedMultiplier * difficultyMultiplier, 50);          // Mínimo 0.05s (SÚPER CORTO)
    
    // (debug logs removed for production / quieter console)
    
    const timings = {
      illumination: Math.round(illuminationTime),
      interval: Math.round(intervalTime),
      total: Math.round(illuminationTime + intervalTime)
    };
    
    // Actualizar CSS variables para sincronizar animaciones
    updateCSSTimings(timings);
    
    return timings;
  }, [calculateTotalPatterns]);

  // Función para actualizar las CSS variables dinámicamente
  const updateCSSTimings = useCallback((timings) => {
    const root = document.documentElement;
    root.style.setProperty('--simon-illumination-duration', `${timings.illumination}ms`);
    root.style.setProperty('--simon-interval-duration', `${timings.interval}ms`);
    
  // CSS variables updated for animation timings (no debug log)
  }, []);

  // useEffect para actualizar timings cuando cambien nivel/ronda
  // useEffect para actualizar timings cuando cambien nivel/ronda o secuencia (para forzar el timing correcto incluso si se salta a un nivel/ronda menor)
  useEffect(() => {
    if (currentLevel && currentRound) {
      const timings = calculateTimings(currentLevel, currentRound);
    // Level/round/sequence changed — timings updated (quiet)
    }
  }, [currentLevel, currentRound, sequence.length, calculateTimings]);

  // Función de compatibilidad para el admin panel
  const calculateSpeed = useCallback((level, round) => {
    const timings = calculateTimings(level, round);
    return timings.total; // Retorna el tiempo total por patrón
  }, [calculateTimings]);

  // Función para calcular el puntaje final
  const calculateFinalScore = useCallback((level, round) => {
    const baseScore = level * 1000; // 1000 puntos por nivel completado
    const roundBonus = round * 100; // 100 puntos por ronda completada
    return baseScore + roundBonus;
  }, []);

  const showSequence = useCallback((sequenceToShow) => {
    setIsPlaying(false);
    setIsShowingSequence(true);
    setIlluminatedSphereId(null);
    
    const timings = calculateTimings(currentLevel, currentRound);
    let currentTime = 200; // Delay inicial mínimo
    
  // Starting sequence (debug logs removed)
    
    sequenceToShow.forEach((sphere, index) => {
      // Programar la iluminación de cada esfera
      setTimeout(() => {
        setIlluminatedSphereId(sphere.id);
  // Reproducir sonido de esfera iluminada aunque estén deshabilitadas
  tryPlayAudio(esferaRef, { clone: true });
        
        // Apagar la iluminación usando el timing exacto
        setTimeout(() => {
          setIlluminatedSphereId(null);
        }, timings.illumination);
        
      }, currentTime);
      
      // ULTRA OPTIMIZADO: Intervalos naturalmente cortos
      currentTime += timings.illumination + timings.interval;
    });
    
    // El tiempo total con intervalos naturalmente cortos
    const totalSequenceDuration = 200 + 
                                 (sequenceToShow.length - 1) * (timings.illumination + timings.interval) + 
                                 timings.illumination + 100; // Buffer mínimo
    
      setTimeout(() => {
      setIsPlaying(true);
      setIsShowingSequence(false);
      setIlluminatedSphereId(null);
    }, totalSequenceDuration);
  }, [calculateTimings, currentLevel, currentRound]);

  // Cuando termina de mostrar el patrón, volver a flotar
  useEffect(() => {
    if (!isShowingSequence && isPlaying) {
      setTimeout(() => setFloatMode('flotar'), 300); // Pequeño delay para suavidad
    }
  }, [isShowingSequence, isPlaying]);

  const startAdminGame = useCallback((name, level, round, testType = null) => {
    // Cerrar el panel de administrador
    setShowAdmin(false);

    setPlayerName(name);
    setAdminMode(true);
    setShowScores(false);
    setSpheresTransitioning(false);
    setFloatMode(''); // QUITAR ANIMACIÓN DE FLOTAR AL USAR PANEL ADMIN

    // Helper para apilar patrones hasta cierto nivel/ronda
    function buildSequenceForLevelRound(targetLevel, targetRound) {
      let seq = [];
      for (let lvl = 1; lvl <= targetLevel; lvl++) {
        const rounds = lvl === targetLevel ? targetRound : levelConfig[lvl].maxRounds;
        for (let r = 0; r < rounds; r++) {
          const randomSphere = spheres[Math.floor(Math.random() * spheres.length)];
          seq.push(randomSphere);
        }
      }
      // Si necesitas reproducir SFX aquí, usa tryPlayAudio(ref, {clone})
    }
    if (testType === 'win') {
      setCurrentLevel(maxLevels);
      setCurrentRound(levelConfig[maxLevels].maxRounds);
      setSequence(buildSequenceForLevelRound(maxLevels, levelConfig[maxLevels].maxRounds));
      setPlayerSequence([]);
      setGameState('victory');
      return;
    }

    // Si es testType 'lose', ir directo a derrota
    if (testType === 'lose') {
      setCurrentLevel(level);
      setCurrentRound(round);
      setSequence(buildSequenceForLevelRound(level, round));
      setPlayerSequence([]);
      setGameState('gameOver');
      setGameOverReason('wrong');
      return;
    }

    // Para selección manual de nivel/ronda: apilar patrones y mostrar el patrón correspondiente
    setCurrentLevel(level);
    setCurrentRound(round);
    const seq = buildSequenceForLevelRound(level, round);
    setSequence(seq);
    setPlayerSequence([]);
    setGameState('playing');
    setTimeout(() => {
      // Simular animación forwards y mostrar el patrón
      setFloatMode('flotar-stop');
      setTimeout(() => {
        setFloatMode('');
        showSequence(seq);
      }, 3500);
    }, 100);
  }, [levelConfig, maxLevels, spheres, showSequence]);

  const handleSphereClick = useCallback((sphere) => {
    if (!isPlaying || isShowingSequence) return;
    
    // Reproducir sonido de esfera al ser clickeada (solo cuando está habilitada)
    tryPlayAudio(esferaRef, { clone: true });

    const newPlayerSequence = [...playerSequence, sphere];
    setPlayerSequence(newPlayerSequence);
    
    const currentIndex = newPlayerSequence.length - 1;
    
    // Verificar si la elección es correcta
    if (newPlayerSequence[currentIndex].id !== sequence[currentIndex].id) {
      // Error - fin del juego
      setIsPlaying(false);
      setGameState('gameOver');
      setGameOverReason('wrong');
      // No guardar automáticamente - el usuario decide desde el GameOver
      return;
    }
    
    // Si completó la secuencia actual (ronda completada)
if (newPlayerSequence.length === sequence.length) {
      setIsPlaying(false);

      // Sonido de patrón correcto
      tryPlayAudio(correctPatternRef, { clone: false });
      
      const maxRounds = levelConfig[currentLevel].maxRounds;
      
      if (currentRound >= maxRounds) {
        // Completó todas las rondas del nivel actual
        if (currentLevel >= maxLevels) {
          // ¡Completó todos los niveles! Victoria total
          setGameState('victory');
          // No guardar automáticamente - el usuario decide desde el GameOver
        } else {
          // Completó el nivel, pasar al siguiente
          setGameState('levelCompleted');
          setTimeout(() => transitionToNextLevel(), 2000);
        }
} else {
        setCurrentRound(prev => prev + 1);
        setRoundAnimating(true);
        setTimeout(() => setRoundAnimating(false), 1000);
        startNewRound(1000); // startNewRound maneja internamente el delay pausable
      }
    }
  }, [isPlaying, isShowingSequence, playerSequence, sequence, currentLevel, currentRound, levelConfig, maxLevels, playerName, calculateFinalScore, startNewRound]);

  // Función para la transición al siguiente nivel con video
  const transitionToNextLevel = useCallback(() => {
    setSpheresTransitioning(true);
    setGameState('transitioning');
    
    // Limpiar cualquier timeout previo de transición de video
    if (videoTransitionTimeoutRef.current) {
      clearTimeout(videoTransitionTimeoutRef.current);
      videoTransitionTimeoutRef.current = null;
    }
    
    // Mostrar video para todas las transiciones
    if (currentLevel === 1 || currentLevel === 2) {
      setShowVideoTransition(true);
      setVideoPhase('blackScreen');
      
      // TIMEOUT DE SEGURIDAD: Forzar continuación después de 15 segundos máximo
      videoTransitionTimeoutRef.current = setTimeout(() => {
        console.warn('⚠️ Timeout de seguridad activado - forzando continuación de la transición');
        // Simular finalización del video
        setShowVideoTransition(false);
        setVideoPhase('blackScreen');
        setTimeout(() => {
          setCurrentLevel(prev => prev + 1);
          setCurrentRound(1);
          setLevelAnimating(true);
          setTimeout(() => setLevelAnimating(false), 1000);
          setSequence(prevSeq => {
            const spheresArr = spheres;
            const newSphere = spheresArr[Math.floor(Math.random() * spheresArr.length)];
            return [...prevSeq, newSphere];
          });
          setPlayerSequence([]);
          setSpheresTransitioning(false);
          setShowReadyScreen(true);
          setGameState('ready');
        }, 1000);
      }, 15000); // 15 segundos máximo
      
      // Secuencia cinematográfica de la transición
      // Fase 1: Pantallazo negro inicial (0.8s)
      setTimeout(() => {
        // Mientras el pantallazo está negro, colocar y preparar el video
        setVideoPhase('video'); // Video se coloca detrás del pantallazo negro
      }, 400); // A la mitad del fade-in del pantallazo, preparar video
      
      // El resto de la secuencia se maneja en el componente de video
    } else if (currentLevel === 3) {
      // Victoria final - usar video de Super Shenlong
      setShowVideoTransition(true);
      setVideoPhase('blackScreen');
      
      // TIMEOUT DE SEGURIDAD: Forzar continuación después de 15 segundos máximo
      videoTransitionTimeoutRef.current = setTimeout(() => {
        console.warn('⚠️ Timeout de seguridad activado - forzando victoria final');
        // Simular finalización del video y mostrar pantalla de victoria
        setShowVideoTransition(false);
        setVideoPhase('blackScreen');
        setTimeout(() => {
          setGameState('victory');
        }, 1000);
      }, 15000); // 15 segundos máximo
      
      // Secuencia para victoria final
      setTimeout(() => {
        setVideoPhase('video');
      }, 400);
      
      // El resto se maneja en el componente de video pero será victoria final
    } else {
      // Transición normal para otros niveles
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
        setCurrentRound(1);
        setLevelAnimating(true);
        setTimeout(() => setLevelAnimating(false), 1000);
        // Nueva lógica: conservar la secuencia anterior y agregar uno nuevo
        setSequence(prevSeq => {
          const spheresArr = spheres;
          const newSphere = spheresArr[Math.floor(Math.random() * spheresArr.length)];
          return [...prevSeq, newSphere];
        });
        setPlayerSequence([]);
        setSpheresTransitioning(false);
        setShowReadyScreen(true);
        setGameState('ready');
      }, 3000);
    }
  }, [currentLevel]);

  // Función para manejar la transición con video
  const handleVideoTransition = useCallback(() => {
    const videoElement = document.getElementById('transition-video');
    
    if (videoPhase === 'video' && videoElement) {
      // Determinar qué video y duración usar según el nivel
      let videoInfo = {};
      if (currentLevel === 1) {
        videoInfo = { name: 'Shenlong', duration: 12.25, file: 'ShenlongAppear.webm' };
      } else if (currentLevel === 2) {
        videoInfo = { name: 'Porunga', duration: 11.0, file: 'PorungaAppear.webm' }; // 11 segundos exactos
      } else if (currentLevel === 3) {
        videoInfo = { name: 'Super Shenlong', duration: 10.0, file: 'SuperShenlongAppear.webm' }; // 10 segundos exactos
      }
      
      console.log(`🎬 Iniciando transición de video ${videoInfo.name}`);
      console.log('📹 Estado del video:', videoElement.readyState);
      console.log('📹 Video src:', videoElement.src);
      
      // Forzar carga del video
      videoElement.load();
      
      const playVideo = async () => {
        try {
          console.log('▶️ Intentando reproducir video...');
          videoElement.volume = volume; // Establecer volumen inicial
          
          // Timeout adicional: si el video no empieza en 3 segundos, forzar error
          const playTimeout = setTimeout(() => {
            console.warn('⚠️ Video no comenzó a reproducirse en 3 segundos');
            if (videoElement.paused) {
              console.log('🔄 Forzando evento de error por timeout de reproducción');
              videoElement.dispatchEvent(new Event('error'));
            }
          }, 3000);
          
          await videoElement.play();
          clearTimeout(playTimeout);
          console.log('✅ Video reproduciéndose correctamente');
        } catch (error) {
          console.error('❌ Error reproduciendo video:', error);
          // Si falla la reproducción, simular que terminó con la duración del video actual
          setTimeout(() => {
            console.log('🔄 Simulando final de video debido a error');
            videoElement.dispatchEvent(new Event('ended'));
          }, (videoInfo.duration + 1) * 1000); // Usar duración específica del video
        }
      };
      
      videoElement.oncanplay = () => {
        console.log('✅ Video listo para reproducir');
        playVideo();
      };
      
      // Handler adicional por si oncanplay no se dispara
      videoElement.onloadeddata = () => {
        console.log('✅ Video cargado (loadeddata)');
        // Intentar reproducir si aún no ha comenzado
        if (videoElement.paused && videoElement.readyState >= 2) {
          console.log('🔄 Intentando reproducir desde onloadeddata...');
          playVideo();
        }
      };
      
      videoElement.onplay = () => {
        console.log('🎬 Video comenzó a reproducirse - duración:', videoElement.duration);
        
        // El video ya está reproduciéndose detrás del pantallazo
        // Ahora desvanecemos el pantallazo para revelar el video
        setTimeout(() => {
          console.log('🎭 Desvaneciendo pantallazo para revelar video');
          setVideoPhase('videoPlaying'); // Nueva fase: video visible reproduciéndose
        }, 400); // Pequeño delay para que empiece a reproducirse
        
        // Crear un timeout de seguridad basado en la duración real del video
        const videoDuration = videoElement.duration || videoInfo.duration; // Usar duración específica como fallback
        const safetyTimeout = (videoDuration + 0.5) * 1000; // Añadir 0.5s de margen
        
        console.log(`⏱️ Configurando timeout de seguridad de ${safetyTimeout}ms para ${videoInfo.name}`);
        
        // Iniciar pantallazo negro 1 segundo antes de que termine el video
        const startBlackScreenTime = Math.max((videoDuration - 1) * 1000, 1000);
        setTimeout(() => {
          if (videoPhase === 'videoPlaying' || videoPhase === 'video') {
            console.log('� Iniciando pantallazo de cierre ANTES de que termine el video');
            setVideoPhase('closingBlackScreen');
            
            // Mientras el pantallazo aparece (0.8s), preparar contenido según el nivel
            setTimeout(() => {
              if (currentLevel === 3) {
                console.log('🏆 Preparando pantalla de victoria final');
                // Para victoria final, no preparar cartel de listo
              } else {
                console.log(`🎯 Preparando cartel "¿Listo?" para nivel ${currentLevel + 1}`);
                setCurrentLevel(currentLevel + 1);
                setCurrentRound(1);
                // Activar animación de nivel
                setLevelAnimating(true);
                setTimeout(() => setLevelAnimating(false), 1000);
                setSequence(prevSeq => {
                  const spheresArr = spheres;
                  const newSphere = spheresArr[Math.floor(Math.random() * spheresArr.length)];
                  return [...prevSeq, newSphere];
                });
                setPlayerSequence([]);
                setSpheresTransitioning(false);
                setShowReadyScreen(true);
                setGameState('ready');
              }
              // NO quitar el video aún, sigue reproduciéndose detrás del pantallazo
            }, 800); // Cuando el pantallazo ya cubrió completamente
          }
        }, startBlackScreenTime);
        
        setTimeout(() => {
          // Solo ejecutar si el video aún está en fase de reproducción
          if (videoPhase === 'videoPlaying' || videoPhase === 'video') {
            console.log('🛡️ Timeout de seguridad activado - finalizando video');
            videoElement.dispatchEvent(new Event('ended'));
          }
        }, safetyTimeout);
      };
      
      videoElement.onended = () => {
        console.log('📹 Video terminado naturalmente');
        console.log('📹 Tiempo actual:', videoElement.currentTime);
        console.log('📹 Duración total:', videoElement.duration);
        
        // Limpiar timeout de seguridad
        if (videoTransitionTimeoutRef.current) {
          clearTimeout(videoTransitionTimeoutRef.current);
          videoTransitionTimeoutRef.current = null;
        }
        
        // Validar que el video realmente haya terminado completamente
        const isVideoComplete = videoElement.currentTime >= (videoElement.duration - 0.5);
        console.log('📹 Video completo:', isVideoComplete);
        
        if (!isVideoComplete) {
          console.log('⚠️ Video terminó prematuramente, esperando...');
          // Si no está completo, no hacer nada y dejar que termine naturalmente
          return;
        }
        
        // El video terminó NATURALMENTE - manejar según el nivel
        console.log(`📹 Video de ${videoInfo.name} terminó naturalmente`);
        
        // Quitar video
        setShowVideoTransition(false);
        setVideoPhase('blackScreen'); // Resetear fase de video
        
        if (currentLevel === 3) {
          // Victoria final - mostrar pantalla de victoria
          setTimeout(() => {
            console.log('🏆 Mostrando pantalla de victoria final');
            setGameState('victory');
            // No guardar automáticamente - el usuario decide desde el GameOver
          }, 100);
        } else {
          // Transición a siguiente nivel - mostrar cartel "¿Listo?"
          setTimeout(() => {
            console.log(`🎯 Mostrando cartel "¿Listo?" para nivel ${currentLevel + 1}`);
            // El cartel ya debe estar preparado del timeout anterior
          }, 100);
        }
      };
      
      videoElement.onerror = (e) => {
        console.error('❌ Error cargando video:', e);
        console.log('🔄 Ejecutando fallback...');
        
        // Limpiar timeout de seguridad
        if (videoTransitionTimeoutRef.current) {
          clearTimeout(videoTransitionTimeoutRef.current);
          videoTransitionTimeoutRef.current = null;
        }
        
        // Fallback: continuar sin video
        setTimeout(() => {
          setShowVideoTransition(false);
          if (currentLevel === 3) {
            // Victoria final
            setGameState('victory');
            // No guardar automáticamente - el usuario decide desde el GameOver
          } else {
            // Transición a siguiente nivel
            setCurrentLevel(currentLevel + 1);
            setCurrentRound(1);
            // Activar animación de nivel
            setLevelAnimating(true);
            setTimeout(() => setLevelAnimating(false), 1000);
            setSequence(prevSeq => {
              const spheresArr = spheres;
              const newSphere = spheresArr[Math.floor(Math.random() * spheresArr.length)];
              return [...prevSeq, newSphere];
            });
            setPlayerSequence([]);
            setSpheresTransitioning(false);
            setShowReadyScreen(true);
            setGameState('ready');
          }
        }, 1000);
      };
      
      // Agregar timeout de emergencia por si el video se cuelga
      setTimeout(() => {
        if (videoPhase === 'video') {
          console.log('⏰ Timeout de emergencia activado');
          videoElement.dispatchEvent(new Event('ended'));
        }
      }, (videoInfo.duration + 2) * 1000); // Usar duración específica + 2s de margen
    }
  }, [videoPhase, currentLevel, calculateFinalScore, levelConfig, playerName]);

  // useEffect para manejar la transición de video
  useEffect(() => {
    if (showVideoTransition && videoPhase === 'video') {
      // Pequeño delay para asegurar que el elemento esté en el DOM
      setTimeout(() => {
        handleVideoTransition();
      }, 100);
    }
  }, [showVideoTransition, videoPhase, handleVideoTransition]);

  // Función para continuar después de la pantalla "¿Listo?"
  const handleReadyContinue = useCallback(() => {
    // Reproducir sonido de continuar
    tryPlayAudio(continueGameRef, { clone: false });
    
    setShowReadyScreen(false);
    setGameState('playing');
    startNewRound(1500); // Usar delay interno pausable
  }, [startNewRound]);

  // useEffect para detectar cualquier tecla o clic
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (showReadyScreen) {
        handleReadyContinue();
      }
    };

    const handleClick = () => {
      if (showReadyScreen) {
        handleReadyContinue();
      }
    };

    if (showReadyScreen) {
      window.addEventListener('keydown', handleKeyPress);
      window.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
    };
  }, [showReadyScreen, handleReadyContinue]);



  const resetGame = () => {
    // Reset game state
    setGameState('form');
    setPlayerName('');
    
    // Reset level and round
    setCurrentLevel(1);
    setCurrentRound(1);
    
    // Reset sequences
    setSequence([]);
    setPlayerSequence([]);
    
    // Reset playing states
    setIsPlaying(false);
    setIsShowingSequence(false);
    
    // Reset UI states
    setAdminMode(false);
    setShowScores(false);
    setSpheresTransitioning(false);
    setIlluminatedSphereId(null);
    
    // Reset transition states
    setShowReadyScreen(false);
    setShowVideoTransition(false);
    setVideoPhase('blackScreen');
    
    // Reset animation states
    setLevelAnimating(false);
    setRoundAnimating(false);
    
    // Reset game over data
    setGameOverReason('');
    setGameOverData(null);
    
    // Stop background music
    try { bgm.stop(); } catch (e) {}
  };

  const handleBackToLobby = () => {
    try { bgm.stop(); } catch (e) {}
    onBack();
  };

  // Función para obtener la clase del nivel
  const getLevelClass = () => {
    switch(currentLevel) {
      case 2: return styles.secondlevel;
      case 3: return styles.thirdlevel;
      default: return '';
    }
  };

  return (
    <div className={`${styles.simonContainer} ${getLevelClass()}`}>
            <Nube />      
    {/* Botón de back solo visible durante el formulario inicial */}
    {gameState === 'form' && (
      <button
        onClick={onBack}
        className="backBtn"
        title="Volver al lobby"
      >
      </button>
    )}

      {gameState === 'form' && (
        <GameForm 
          onStartGame={startGame}
          onPlayButtonSound={() => {
            // Reproducir SFX al hacer click en los botones del form
            tryPlayAudio(playButtonRef, { clone: false });
            tryPlayAudio(movingObjectRef, { clone: false });
          }}
        />
      )}

      {showAdmin && (
        <AdminPanel
          onStartAdminGame={startAdminGame}
          onClose={() => setShowAdmin(false)}
          playerName={playerName || 'Admin'}
          calculateTotalPatterns={calculateTotalPatterns}
          calculateSpeed={calculateSpeed}
          calculateTimings={calculateTimings}
        />
      )}

      {(gameState === 'playing' || gameState === 'transitioning') && (
        <>
          <div className={styles.gameIndicators}>
            <div className={styles.levelIndicator}>
              <h4>Nivel: <span className={levelAnimating ? styles.levelIncrement : styles.levelNumber}>{currentLevel}/{maxLevels}</span></h4>
            </div>
            <div className={styles.roundIndicator}>
              <h4>Ronda: <span className={roundAnimating ? styles.roundIncrement : styles.roundNumber}>{currentRound}/{levelConfig[currentLevel].maxRounds}</span></h4>
            </div>
          </div>
          <GameBoard
            spheres={spheres}
            onSphereClick={handleSphereClick}
            isPlaying={isPlaying}
            isShowingSequence={isShowingSequence}
            sequence={sequence}
            playerSequence={playerSequence}
            currentLevel={currentLevel}
            currentRound={currentRound}
            speedMs={calculateSpeed(currentLevel, currentRound)}
            isTransitioning={spheresTransitioning}
            illuminatedSphereId={illuminatedSphereId}
            floatMode={floatMode} // PASO EL MODO
          />
        </>
      )}

      {gameState === 'levelCompleted' && (
      <div className={styles.levelCompletedScreen}>
          <div className={styles.levelCompletedContent}>
            <h1>¡Nivel {currentLevel} Completado!</h1>
              <p className={styles.transitionText}>
                {`Pasando al nivel ${currentLevel + 1}`}
              </p>
          </div>
        </div>
      )}

      {/* Transición con video */}
      {showVideoTransition && (
        <div className={styles.videoTransitionContainer}>
          {/* Video de transición - visible durante reproducción Y durante pantallazo de cierre */}
          <div className={`${styles.videoContainer} ${(videoPhase === 'video' || videoPhase === 'videoPlaying' || videoPhase === 'closingBlackScreen') ? styles.visible : ''}`}>
            <video
              id="transition-video" 
              className={styles.transitionVideo}
              playsInline
            >
              {currentLevel === 1 && <source src="/videos/ShenlongAppear.webm" type="video/webm" />}
              {currentLevel === 2 && <source src="/videos/PorungaAppear.webm" type="video/webm" />}
              {currentLevel === 3 && <source src="/videos/SuperShenlongAppear.webm" type="video/webm" />}
            </video>
          </div>
          
          {/* Pantalla negra - actúa como cortina cinematográfica */}
          <div className={`${styles.blackScreen} ${
            (videoPhase === 'blackScreen' || videoPhase === 'closingBlackScreen') ? styles.visible : ''
          }`}></div>
        </div>
      )}

      {gameState === 'ready' && (
        <div className={styles.readyScreen}>
          <div className={styles.readyContent}>
            <h1 className={styles.readyTitle}>¿Listo?</h1>
            <p className={styles.readyLevel}>Nivel {currentLevel} - {levelConfig[currentLevel]?.name}</p>
            <p className={styles.readySubtext}>{isDesktop ? 'Presiona cualquier botón para continuar' : 'Presiona para continuar'}</p>
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <SinglePlayerGameOver
          gameType="simondice"
          isWin={false}
          score={calculateFinalScore(currentLevel, currentRound)}
          playerName={playerName}
          gameSpecificData={{
            level: currentLevel,
            round: currentRound,
            patterns: calculateTotalPatterns(currentLevel, currentRound)
          }}
          onSaveScore={async (data) => {
            // Call database directly to allow errors to propagate to UI
            await saveSimonDiceScore({
              nombre: data.name,
              nivel: currentLevel,
              ronda: currentRound
            });
          }}
          onRestart={() => {
            resetGame();
            setGameState('form');
          }}
          onBackToMenu={() => {
            onBack();
          }}
        />
      )}

      {gameState === 'victory' && (
        <div className={styles.victoryScreen}>
          <div className={styles.victoryContent}>
            <h1>¡Felicidades {playerName}!</h1>
            <p>¡Has completado todos los niveles!</p>
            <p className={styles.masterScore}>Puntos totales: {calculateFinalScore(currentLevel, currentRound)}</p>
            <p className={styles.masterPatterns}>¡Dominaste {calculateTotalPatterns(currentLevel, currentRound)} patrones!</p>
            <p className={styles.masterTitle}>¡Eres un Maestro de las Esferas del Dragón!</p>
            <button onClick={resetGame} className={styles.playAgainButton}>
              Jugar de nuevo
            </button>
          </div>
        </div>
      )}

      {showScores && gameState === 'form' && (
        <ScoreTable 
          isGameOver={false}
          onClose={() => setShowScores(false)}
        />
      )}

      {/* Menú de pausa */}
      <PauseMenu
        gameType="simondice"
        showPauseButton={gameState === 'playing' && !isShowingSequence}
        showPauseMenu={showPauseMenu}
        onTogglePause={togglePauseMenu}
        onBackToMenu={() => onBack()}
        onResetGame={() => {
          resetGame();
          setShowPauseMenu(false);
        }}
        enableEsc={(gameState === 'playing' && !isShowingSequence) || showPauseMenu} // Solo habilitado durante juego activo (no en transiciones)
        volume={volume}
        onVolumeChange={(newVolume) => {
          setVolume(newVolume);
        }}
        musicMuted={musicMuted}
        onToggleMusic={handleToggleMusic}
      />
    </div>
  );
}

export default SimonDice;