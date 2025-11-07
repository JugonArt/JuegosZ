
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import AdminPanel from './AdminPanel.js';
import '../../styles/UI.css';
import simonStyles from '../../styles/simondice/simon.module.css';
import Nube from '../../UI/nube.jsx';
import styles from '../../styles/spaceinvaders/juego.module.css';
import PauseMenu from '../../UI/MenuPausa.jsx'
import SinglePlayerGameOver from '../../UI/SinglePlayerGameOver.jsx'
import MultiplayerGameOver from '../../UI/MultiplayerGameOver.jsx'
import { useNameSelectorSounds } from '../../UI/useNameSelectorSounds.js';
import bgm from '../../../utils/backgroundMusic.js';
import { saveSpaceInvadersScore } from '../../../utils/scoreDatabase.js';



const SpaceInvaders = ({onSaveScoreSpaceInvaders = () => {}, getTopScores = () => {}, onBack}) => {
  // DEBUG: toggle visual hitboxes for debugging alignment issues
  // Set to false to disable hitbox overlays in production / normal play
  const SHOW_HITBOX = false
  // Estados del juego y música (deben ir antes de cualquier uso)
  const [player1Name, setPlayer1Name] = useState('Jugador 1');
  const [player2Name, setPlayer2Name] = useState('Jugador 2');
  const [selecting, setSelecting] = useState(null); // null | 'single' | 'multi'
  const [showSelectorContent, setShowSelectorContent] = useState(false);
  const [nameError, setNameError] = useState('');
  const [showSuperVideo, setShowSuperVideo] = useState(false)
  const [level, setLevel] = useState(1)
  const [showLevelCompleted, setShowLevelCompleted] = useState(false)
  const [levelCompletedInfo, setLevelCompletedInfo] = useState({ prev: 0, next: 0 })
  const [adminKeySequence, setAdminKeySequence] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [gamePhase, setGamePhase] = useState("intro")
  const [player1Results, setPlayer1Results] = useState(null)
  const [player2Results, setPlayer2Results] = useState(null)
  const [playerFinished, setPlayerFinished] = useState([false, false])
  const [showPauseMenu, setShowPauseMenu] = useState(false)
  const [hasLostInitialLife, setHasLostInitialLife] = useState([false, false])
  const [volume, setVolume] = useState(0.5)
  const [musicMuted, setMusicMuted] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [gameState, setGameState] = useState("intro")
  const [mountGame, setMountGame] = useState(true)
  const [remountKey, setRemountKey] = useState(0)
  const [players, setPlayers] = useState(1)
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [score, setScore] = useState([0, 0])
  const [lives, setLives] = useState([3, 3])
  const [superReady, setSuperReady] = useState([false, false])
  const [alienCounts, setAlienCounts] = useState({
    type1: 0,
    type2: 0,
    type3: 0,
  })
  const [totalAliens, setTotalAliens] = useState(0)
  const [showGameOverForm, setShowGameOverForm] = useState(false)
  const [gameOverData, setGameOverData] = useState(null)
  const [isWin, setIsWin] = useState(false)
  const [isStunned, setIsStunned] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [spaceKeyState, setSpaceKeyState] = useState('');

  // Multiplicador exponencial para velocidad base por nivel: 
  // nivel 1 x1, nivel 2 x2, nivel 3 x4, nivel 4 x8, nivel 5 x16
  const LEVEL_BASE_MULTIPLIER = 2.0
  // Tamaños (y velocidades si querés) de proyectiles según ancho
  const getProjectileProfile = (w) => {
    if (w <= 360) {        // móviles muy chicos
      return {
        player: { w: 12, h: 12, speed: 6 },
        enemy:  { w: 12, h: 12, speed: 3 },
        super:  { w: 26, h: 26, speed: 8 },
      };
    } else if (w <= 425) { // móviles chicos
      return {
        player: { w: 4, h: 11, speed: 6 },
        enemy:  { w: 4, h: 11, speed: 3 },
        super:  { w: 9,  h: 24, speed: 8 },
      };
    } else if (w <= 768) { // tablet
      return {
        player: { w: 3, h: 10, speed: 6 },
        enemy:  { w: 3, h: 10, speed: 3 },
        super:  { w: 9, h: 22, speed: 8 },
      };
    } else if (w <= 1024) { // laptop chica
      return {
        player: { w: 3, h: 9, speed: 6 },
        enemy:  { w: 3, h: 9, speed: 3 },
        super:  { w: 8, h: 20, speed: 8 },
      };
    }
    // desktop
    return {
      player: { w: 3, h: 8, speed: 6 },
      enemy:  { w: 3, h: 8, speed: 3 },
      super:  { w: 8, h: 20, speed: 8 },
    };
  };
  // Estados del juego
  const getShooterSpeed = (w) => {
    if (w <= 360)   return 2.0;
    if (w <= 425)   return 2.2;
    if (w <= 768)   return 2.6;
    if (w <= 1024)  return 3.2;
    return 3.6;
  };

  const getShooterMetrics = (w) => {
    // devolvemos w/h (hitbox) y escala visual para que coincidan
    if (w <= 360)   return { sw: 12, sh: 16, scale: 6 };
    if (w <= 425)   return { sw: 16, sh: 20, scale: 8 };
    if (w <= 768)   return { sw: 18, sh: 22, scale: 9 };
    if (w <= 1024)  return { sw: 20, sh: 24, scale: 10 };
    return { sw: 22, sh: 26, scale: 11 }; // Para desktop (>1024) mantener original
  };

  const getSpeedProfile = (w) => {
    // Las velocidades base se multiplicarán por LEVEL_BASE_MULTIPLIER en cada nivel:
    // nivel 1: x1, nivel 2: x2, nivel 3: x4, nivel 4: x8, nivel 5: x16
    if (w <= 360)   return { base: 0.35, drop: 16, edgeInc: 0.12, max: 20.0 };
    if (w <= 425)   return { base: 0.40, drop: 18, edgeInc: 0.15, max: 20.0 };
    if (w <= 768)   return { base: 0.55, drop: 20, edgeInc: 0.18, max: 20.0 };
    if (w <= 1024)  return { base: 0.70, drop: 22, edgeInc: 0.22, max: 20.0 };
    return { base: 0.90, drop: 25, edgeInc: 0.25, max: 20.0 }; // Desktop mantiene original
  };
  // Estados para nombres de jugadores
  
  // Estados para menú expandible

  // Música de fondo: controlar reproducción sin que abrir el menú de pausa
  // provoque detener/reiniciar la pista. Reproducimos solo cuando la partida
  // está en 'playing'. Si el menú de pausa se abre durante la partida, la
  // música debe mantenerse (no reiniciarse). No incluimos `volume` como
  // dependencia para evitar que mover el slider re-ejecute la lógica de
  // inicio/stop y provoque reinicios.
  const wasPlayingRef = useRef(false);
  const prevGameStateRef = useRef(gameState);
  const leftPlayingForSkipRef = useRef(false);
  useEffect(() => {
    try {
      bgm.init();
    } catch (e) {}

    const state = bgm.getCurrentState ? bgm.getCurrentState() : {};

    // Detect transitions playing -> (other) -> playing to trigger next track.
    // We only want this when the intermediate state is NOT the pause menu.
    try {
      const prev = prevGameStateRef.current;
      // If we left playing into a non-pause state, mark that we should skip
      if (prev === 'playing' && gameState !== 'playing' && !showPauseMenu) {
        leftPlayingForSkipRef.current = true;
        // store what we left to
        leftPlayingForSkipRef.current = true;
        // console.log debug
        console.log('[BGM] left playing ->', gameState, 'marked for skip on return');
      }
      // If we are returning to playing and we previously left for a skip-worthy state,
      // perform nextTrack (same as Skip button) and clear the flag. Do NOT do this
      // when returning from pause menu toggles.
      if (gameState === 'playing' && leftPlayingForSkipRef.current && !showPauseMenu) {
        try { bgm.nextTrack(); } catch (e) { console.warn('[BGM] nextTrack on resume failed', e); }
        leftPlayingForSkipRef.current = false;
      }
    } catch (e) {}
    // update prev state
    prevGameStateRef.current = gameState;

    if (gameState === 'playing') {
      // Mark that we are in a playing session so opening pause menu doesn't
      // start/stop the music flow.
      wasPlayingRef.current = true;
      // Respect explicit user mute/pause: if the user has muted music via
      // the pause menu, do not auto-resume or auto-play when returning to
      // the 'playing' state.
      if (!musicMuted) {
        if (state.isPlaying && state.isPaused) {
          try { bgm.resume(); } catch (e) {}
        } else if (!state.isPlaying) {
          try { bgm.play(); } catch (e) {}
        }
      }
    } else if (showPauseMenu && wasPlayingRef.current) {
      // Pause menu opened while game was playing: preserve current playback
      // state. Do not stop or restart music here.
    } else {
      // We're leaving 'playing' for a non-pause state. If this transition was
      // marked as a short transition that should trigger a skip on return
      // (eg. levelCompleted/countdown), do NOT stop the music now — allow
      // nextTrack() on resume to replace the song. Otherwise, stop music as
      // usual when leaving the match (eg: back to lobby).
      if (!leftPlayingForSkipRef.current) {
        try { bgm.stop(); } catch (e) {}
        wasPlayingRef.current = false;
      } else {
        // keep wasPlayingRef true so opening pause menu doesn't stop it
        console.log('[BGM] Leaving playing for a skip-worthy state; preserving playback to skip on return');
      }
    }
  }, [gameState, showPauseMenu, musicMuted]);

  // Sincronizar volumen (solo setea, no reinicia música)
  useEffect(() => {
    try {
      bgm.setVolume(volume);
    } catch (e) {}
  }, [volume]);

  // Handler para el slider de volumen - solo actualiza el estado
  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    // Solo actualizar master gain para efectos de sonido
    if (masterGainRef.current) {
      try { masterGainRef.current.gain.value = newVolume; } catch (e) {}
    }
  }, []);

  // Efecto separado para sincronizar el volumen con BGM
  useEffect(() => {
    // Sincronizar volumen global con bgm (solo setea volumen, no reinicia música)
    try {
      bgm.setVolume(volume);
    } catch (e) {}
  }, [volume]);

  // Handler para pausar/reanudar música
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

  // Sound effects hook
  const { playOpenSound, playCloseSound, playSelectedSound } = useNameSelectorSounds();

  // Mostrar pantalla de transición entre jugadores (multijugador)
  

  // Estados del juego

  // Referencias para el juego
  const shootAnimationRef = useRef(null) // Para el timeout
  const shootClassRef = useRef("") // Para guardar la clase de animación
  const shootCountRef = useRef(0) // <-- Nueva referencia para el contador
  const superAnimationRef = useRef(null) // Nuevo: referencia para el timeout del super
  const superClassRef = useRef("") // Nuevo: referencia para la clase del super
  const superVideoRef = useRef(null) // 2. Nueva referencia para el video
  const superVideoTimeoutRef = useRef(null) // Timeout de seguridad para el video del super
  const gameAreaRef = useRef(null)
  const gameLoopRef = useRef(null)
  const keysRef = useRef({})
  const suppressLevelCompletedRestoreRef = useRef(false)
  const levelTransitionRef = useRef(false)
  const lastFrameTime = useRef(0)
  // Helper to play audio safely (handles promise rejection and cloning for sound effects)
const tryPlayAudio = useCallback((audioRefOrNode, { clone = false, localVolume = null } = {}) => {
  if (!audioRefOrNode) return Promise.resolve()
  try {
    const baseNode = (audioRefOrNode && audioRefOrNode.current) ? audioRefOrNode.current : audioRefOrNode
    if (!baseNode || typeof baseNode.play !== 'function') return Promise.resolve()
    const node = (clone && typeof baseNode.cloneNode === 'function') ? baseNode.cloneNode() : baseNode

    // 🎧 Control de volumen: prioriza localVolume si se pasa
    try {
      if (audioContextRef.current && masterGainRef.current) {
        node.volume = localVolume !== null ? localVolume : 1
      } else {
        node.volume = localVolume !== null ? localVolume : volume
      }
    } catch (e) {
      node.volume = localVolume !== null ? localVolume : volume
    }

    const p = node.play()
    if (p && typeof p.then === 'function') {
      return p.catch((e) => console.warn('[AUDIO] play() rejected', e))
    }
    return Promise.resolve()
  } catch (e) {
    console.warn('[AUDIO] play() failed sync', e)
    return Promise.resolve()
  }
}, [volume])
  const lastShootTime = useRef(0) // Para controlar el cooldown de disparos
  const startSoundRef = useRef(null)
  const superSoundRef = useRef(null)
  const shootSoundRef = useRef(null)
  const senzuSoundRef = useRef(null)
  const playerDamageSoundRef = useRef(null)
  const playerHitSoundRef = useRef(null)
  const countdownSoundRef = useRef(null)
  const superChargedRef = useRef(null)
  const buttonErrorRef = useRef(null)
  const alienHitRef = useRef(null)
  const kiHitRef = useRef(null)
  const senzuEatenRef = useRef(null)
  const senzuEmptyRef = useRef(null)
  const buttonErrorCooldownRef = useRef(false)
  const prevSuperReadyRef = useRef([false, false])
  // WebAudio master gain for reliable global mute/volume
  const audioContextRef = useRef(null)
  const masterGainRef = useRef(null)
  const winVideo = "/videos/BardockWinFace.mp4"
  const loseVideo = "/videos/BardockLose.mp4"
const GoVideo = "/videos/GameOverOpening.mp4";
  const stunnedRef = useRef(false)
  const [showPlayerTransition, setShowPlayerTransition] = useState(false)
  // transitionCountdown removed: we use press-any-button transition instead of auto countdown
  // Estados del juego (posiciones, velocidades, etc.)
  const gameDataRef = useRef({
    shooterAnimationClass: "", // Agrega esto
    shooter: { x: 2000, y: 1000 },
    invaders: [],
    lasers: [],
    enemyLasers: [],
    shields: [],
    powerUps: [],
    superBeams: [],
    explosions: [],
    invaderDirection: 1,
    // baseInvaderSpeed: velocidad base persistente por nivel/admin
    baseInvaderSpeed: 0.5,
    // edgeSpeedBonus: incremento temporal acumulado cuando los invasores tocan el borde
    edgeSpeedBonus: 0,
    // invaderSpeed kept for compatibility but movement uses computed effective speed
    invaderSpeed: 25,
    invaderDropSpeed: 45,
    lastInvaderFire: 0,
    superCharge: [0, 0],
    lastSuperUse: [0, 0], // Track last super use time for each player
    superCooldown: 3000, // 3 second cooldown
    isPaused: false,
    gameAreaWidth: 1000,
    gameAreaHeight: 1000,
    shootCooldown: 500, // Cooldown de 200ms entre disparos
  })

  // Funciones de utilidad
// NOTE: score popup removed per request. No createScorePopup function is defined.

const createLifePopup = useCallback((x, y) => {
  const popup = document.createElement("div")
  popup.className = styles.lifePopup || "life-popup"  // CORREGIDO
  popup.textContent = "+1 VIDA"
  popup.style.left = x + "px"
  popup.style.top = y + "px"
  popup.style.color = "#ff69b4"
  popup.style.fontSize = "14px"
  popup.style.fontWeight = "bold"
  popup.style.textShadow = "0 0 10px #ff69b4"

  if (gameAreaRef.current) {
    gameAreaRef.current.appendChild(popup)
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup)
      }
    }, 2000)
  }
}, [])

  const updateAlienCounters = useCallback(() => {
    const counts = { type1: 0, type2: 0, type3: 0 }
    gameDataRef.current.invaders.forEach((invader) => {
      counts[invader.type]++
    })
    setAlienCounts(counts)
  }, [])

  const updateSuperDisplay = useCallback(() => {
    const currentScore = score[currentPlayer - 1]
    const now = Date.now()
    const lastUse = gameDataRef.current.lastSuperUse[currentPlayer - 1]
    const cooldownPassed = now - lastUse >= gameDataRef.current.superCooldown
    const ready = currentScore >= 2000 && cooldownPassed

    setSuperReady((prev) => {
      const newReady = [...prev]
      newReady[currentPlayer - 1] = ready
      return newReady
    })
  }, [currentPlayer, score])
  const getEnemyConfig = useCallback(() => {
  const width = window.innerWidth;
  
  // Configuraciones según el tamaño de pantalla
  if (width <= 320) {
    // Móvil muy pequeño - formación muy reducida
    return {
      rows: [
        { count: 4, type: 'type3', points: 500 }, // Solo 2 jefes
        { count: 5, type: 'type2', points: 200 }, // 3 soldados
        { count: 6, type: 'type1', points: 100 }, // 4 saibaimans
      ],
      spacing: 35,
      startX: 60,
    };
  } else if (width <= 425) {
    // Móvil pequeño - formación reducida
    return {
      rows: [
        { count: 4, type: 'type3', points: 500 }, // 3 jefes
        { count: 5, type: 'type2', points: 200 }, // 4 soldados en 1 fila
        { count: 6, type: 'type1', points: 100 }, // 5 saibaimans en 1 fila
        { count: 6, type: 'type1', points: 100 }, // Otra fila de 5 saibaimans
      ],
      spacing: 40,
      startX: 40
    };
  } else if (width <= 768) {
    // Tablet - formación media
    return {
      rows: [
        { count: 4, type: 'type3', points: 500 }, // 4 jefes
        { count: 6, type: 'type2', points: 200 }, // 6 soldados en 1 fila
        { count: 7, type: 'type1', points: 100 }, // 7 saibaimans
        { count: 7, type: 'type1', points: 100 }, // Otra fila de 7
        { count: 7, type: 'type1', points: 100 }, // Tercera fila de 7
      ],
      spacing: 42,
      startX: 30
    };
  } else if (width <= 1024) {
    // Desktop pequeño - formación casi completa
    return {
      rows: [
        { count: 5, type: 'type3', points: 500 }, // 5 jefes (formación original)
        { count: 8, type: 'type2', points: 200 }, // 8 soldados en 1 fila
        { count: 9, type: 'type1', points: 100 }, // 9 saibaimans
        { count: 9, type: 'type1', points: 100 }, // Otra fila de 9
        { count: 9, type: 'type1', points: 100 }, // Tercera fila de 9
      ],
      spacing: 44,
      startX: 25
    };
  } else {
    // Desktop grande - formación completa original
    return {
      rows: [
        { count: 5, type: 'type3', points: 500 }, // 5 jefes
        { count: 10, type: 'type2', points: 200 }, // 10 soldados en 1 fila
        { count: 10, type: 'type2', points: 200 }, // Otra fila de 10 soldados
        { count: 10, type: 'type1', points: 100 }, // 10 saibaimans
        { count: 10, type: 'type1', points: 100 }, // Otra fila de 10
        { count: 10, type: 'type1', points: 100 }, // Tercera fila de 10
      ],
      spacing: 45,
      startX: 50
    };
  }
}, []);
// Compute special enemy horizontal velocity based on invader effective speed and a phase multiplier
const computeSpecialVx = useCallback((direction = 1, phase = 'sweep') => {
  const base = (gameDataRef.current && (gameDataRef.current.baseInvaderSpeed || gameDataRef.current.invaderSpeed)) || 0.5
  const edge = (gameDataRef.current && gameDataRef.current.edgeSpeedBonus) || 0
  // Aumentar el límite máximo de velocidad para permitir el escalado por nivel
  const maxSpeed = Math.max(20, (gameDataRef.current && gameDataRef.current.maxInvaderSpeed) || 20)
  const eff = Math.min(base + edge, maxSpeed)
  // Multiplicadores de fase ajustados para mantener el comportamiento proporcional
  const phaseMults = {
    sweep: 2.2,    // Barrido inicial
    approach: 1.6, // Acercamiento para disparar
    depart: 2.6,   // Salida rápida
    default: 1.8,
  }
  // Nos aseguramos que los multiplicadores de fase no hagan que la velocidad supere maxSpeed
  const mult = phaseMults[phase] || phaseMults.default
  // compute magnitude, ensure a sensible minimum to keep behaviour lively on low speeds
  const magnitude = Math.max(0.6, eff * mult)
  return direction >= 0 ? magnitude : -magnitude
}, [])
  // Funciones de inicialización
const initializeInvaders = useCallback(() => {
  const config = getEnemyConfig();
  const invaders = [];
  let totalCount = 0;

  // Referencia de tamaño desde escudos (si existen)
  const shields = gameDataRef.current.shields || [];
  const avgW = shields.length ? Math.round(shields.reduce((a,s)=>a+s.width,0)/shields.length) : 120;
  const avgH = shields.length ? Math.round(shields.reduce((a,s)=>a+s.height,0)/shields.length) : 140;
  // Enemigos = 90% del ancho del escudo, alto en relación 0.8 (20x16 base)
  const invW = Math.max(30, Math.round(avgW * 0.90));
  const invH = Math.max(20, Math.round(invW * 0.80));

  config.rows.forEach((rowConfig, rowIndex) => {
    // Calcular el offset para centrar la fila
    const totalRowWidth = rowConfig.count * config.spacing;
    const gameWidth = gameDataRef.current.gameAreaWidth;
    const centerOffset = (gameWidth - totalRowWidth) / 2;

    for (let col = 0; col < rowConfig.count; col++) {
      invaders.push({
        x: centerOffset + col * config.spacing,
        y: rowIndex * 35 + 50,
        type: rowConfig.type,
        points: rowConfig.points,
        row: rowIndex,
        col: col,
        width: invW,
        height: invH,
      });
      totalCount++;
    }
  });

  gameDataRef.current.invaders = invaders;
  setTotalAliens(totalCount);
  gameDataRef.current.initialInvaderCount = totalCount;
  updateAlienCounters();
}, [getEnemyConfig, updateAlienCounters]);

const initializeShields = useCallback(() => {
  const shields = [];
  const gameHeight = gameDataRef.current.gameAreaHeight;
  const gameWidth  = gameDataRef.current.gameAreaWidth;

  // Breakpoints de cantidad y tamaño
  let count, w, h, baseY;
  if (gameWidth <= 360) {          // ~320–360 px
    count = 2;  w = 70;  h = 90;   baseY = gameHeight - 180;
  } else if (gameWidth <= 425) {   // ~375–425 px
    count = 2;  w = 80;  h = 100;  baseY = gameHeight - 190;
  } else if (gameWidth <= 768) {   // tablets
    count = 3;  w = 100; h = 120;  baseY = gameHeight - 210;
  } else if (gameWidth <= 1024) {  // laptops chicos
    count = 3;  w = 110; h = 130;  baseY = gameHeight - 220;
  } else {                         // desktop - mantener original
    count = 4;  w = 120; h = 140;  baseY = gameHeight - 230;
  }

  // Espaciado en función de la cantidad
  const spacing = gameWidth / (count + 1);

  for (let s = 0; s < count; s++) {
    const x = spacing * (s + 1) - w / 2;
    shields.push({
      x, y: baseY,
      width: w, height: h,
      shieldGroup: s,
      health: 8, maxHealth: 8,
    });
  }

  gameDataRef.current.shields = shields;
  // finished initializing shields
}, []);

  const resetGame = useCallback(
    (fullReset = false, levelOverride = null) => {
      console.log('[DEBUG] resetGame called, fullReset=', fullReset, 'levelOverride=', levelOverride)

      // Measure AFTER layout to ensure we get the real gameArea size.
      const measureAndInit = () => {
        // Use getBoundingClientRect for more reliable fractional sizes on mobile
        const gaEl = document.querySelector(`.${styles.gameArea}`)
        const rect = gaEl ? gaEl.getBoundingClientRect() : null
        const width = rect ? Math.round(rect.width) : Math.round((gaEl?.offsetWidth) || window.innerWidth * 0.8)
        const height = rect ? Math.round(rect.height) : Math.round((gaEl?.offsetHeight) || window.innerHeight * 0.9)

        const shooterMetrics = getShooterMetrics(width)
        const sp = getSpeedProfile(width)
        const pp = getProjectileProfile(width)
        const shSpd = getShooterSpeed(width)

        const useLevel = (typeof levelOverride === 'number' && levelOverride > 0) ? levelOverride : (fullReset ? 1 : level)
        const baseSeed = sp.base

        // Build the new game data object (deterministic)
        gameDataRef.current = {
          shooter: {
            x: Math.round(width / 2 - shooterMetrics.sw / 2),
            y: Math.round(height - 60),
            width: shooterMetrics.sw,
            height: shooterMetrics.sh
          },
          shooterSpeed: shSpd,
          projectiles: pp,
          invaders: [],
          lasers: [],
          enemyLasers: [],
          shields: [],
          powerUps: [],
          superBeams: [],
          explosions: [],
          invaderDirection: 1,
          baseInvaderSeed: baseSeed,
          baseInvaderSpeed: Math.max(0.01, baseSeed * Math.pow(LEVEL_BASE_MULTIPLIER, Math.max(0, useLevel - 1))),
          edgeSpeedBonus: 0,
          invaderSpeed: sp.base,
          invaderDropSpeed: sp.drop,
          specialEnemies: [],
          specialSpheres: [],
          specialSpawnTimer: 0,
          specialBaseProb: 0.02,
          specialSideToggle: 0,
          freezerActive: false,
          special: {
            sphereSpawnDuration: 600,
            preFireDuration: 2000,
            departDelayAfterFire: 1000,
          },
          invaderEdgeIncrement: sp.edgeInc,
          maxInvaderSpeed: sp.max,
          lastInvaderFire: 0,
          superCharge: [0, 0],
          lastSuperUse: [0, 0],
          superCooldown: 3000,
          isPaused: false,
          gameAreaWidth: width,
          gameAreaHeight: height,
          shootCooldown: 500,
        }

        // Apply CSS variables for shooter and invaders
        try {
          document.documentElement.style.setProperty('--shooter-w', `${shooterMetrics.sw}px`)
          document.documentElement.style.setProperty('--shooter-h', `${shooterMetrics.sh}px`)
          document.documentElement.style.setProperty('--shooter-scale', `${shooterMetrics.scale}`)
        } catch (e) {}

        // Reset persistent player state only on fullReset
        if (fullReset) {
          setScore([0, 0])
          setLives([3, 3])
          setSuperReady([false, false])
          setHasLostInitialLife([false, false])
        } else {
          updateSuperDisplay()
        }

        if (fullReset) {
          setPlayerFinished([false, false])
          setCurrentPlayer(1)
          setLevel(1)
        }

        lastShootTime.current = 0

        // Ensure init runs inside a RAF so DOM layout is stable and sizes are correct
        requestAnimationFrame(() => {
          try {
            initializeShields()
            // Align shooter visual scale with shields average
            const shieldsLocal = gameDataRef.current.shields || []
            if (shieldsLocal.length) {
              const avgH = Math.round(shieldsLocal.reduce((a, s) => a + s.height, 0) / shieldsLocal.length)
              const baseShooterH = gameDataRef.current.shooter.height
              const scale = Math.max(1, avgH / baseShooterH)
              try { document.documentElement.style.setProperty('--shooter-scale', `${scale}`) } catch (e) {}
            }

            // invaders depend on shields for sizing - compute after shields
            initializeInvaders()

            // Update invader CSS vars for large desktop
            const wcur = gameDataRef.current.gameAreaWidth
            if (wcur > 1024) {
              const invaderW1025 = Math.round(80 * 0.90)
              const invaderH1025 = Math.round(invaderW1025 * 0.80)
              document.documentElement.style.setProperty('--invader-w', `${invaderW1025}px`)
              document.documentElement.style.setProperty('--invader-h', `${invaderH1025}px`)
            } else {
              document.documentElement.style.removeProperty('--invader-w')
              document.documentElement.style.removeProperty('--invader-h')
            }

            // Diagnostics: log key values so we can compare first-run vs restart
            // Ensure one render cycle picks up new positions
            if (gameLoopRef.current == null && gameState === 'playing') {
              requestAnimationFrame(() => {})
            }
          } catch (e) {
            console.warn('[DEBUG] RAF init error', e)
          }
        })
      }

      // If the gameArea element exists now, run measurement immediately; else retry a few times
      const elNow = document.querySelector(`.${styles.gameArea}`)
      if (elNow) {
        // measure on next frame for stable layout
        requestAnimationFrame(measureAndInit)
      } else {
        // Retry loop: try a few times to allow mount/layout to complete
        let attempts = 0
        const retry = () => {
          attempts++
          const e = document.querySelector(`.${styles.gameArea}`)
          if (e || attempts >= 10) {
            requestAnimationFrame(measureAndInit)
          } else {
            setTimeout(retry, 120)
          }
        }
        setTimeout(retry, 120)
      }

      // Ensure bgm resets so it will be started after countdown
      try { bgm.stop(); } catch (e) {}
      console.log('[DEBUG] resetGame scheduled measurement/init')
    },
    [initializeInvaders, initializeShields, level, updateSuperDisplay],
  )

  // Effect: press-any-button to continue from player transition (multiplayer)
  useEffect(() => {
    if (showPlayerTransition && gameState === "playerTransition") {
      const handleTransition = (event) => {
        try { if (event && event.stopPropagation) event.stopPropagation(); } catch(e){}
        // Advance to player 2
        setShowPlayerTransition(false);
        setCurrentPlayer(2);
        // Asegurar que el segundo jugador empiece desde el nivel 1
        // para que su resultado (playerResult.level) refleje el nivel alcanzado
        // durante su propia partida y no herede el nivel del jugador 1.
  try { setLevel(1); } catch (e) { /* defensive */ }
  // Force level override when transitioning to player 2 so resetGame
  // uses level 1 immediately (setState is async and resetGame reads `level` from
  // closure). Passing levelOverride avoids inheriting previous player's level.
  try { resetGame(false, 1); } catch (e) { console.warn('[TRANSITION] resetGame failed', e) }
        setCountdown(3);
        setGameState('countdown');
      };

      window.addEventListener('keydown', handleTransition);
      window.addEventListener('pointerdown', handleTransition);

      // No automatic fallback - require user to press a key or tap to continue.
      return () => {
        window.removeEventListener('keydown', handleTransition);
        window.removeEventListener('pointerdown', handleTransition);
      };
    }
  }, [showPlayerTransition, gameState, resetGame]);

  // Subir de nivel: aumentar velocidad y reiniciar oleada manteniendo score/lives
  // `force` can be used by admin to bypass the gameState check when needed.
  const levelUp = useCallback((force = false) => {
    // Protección contra múltiples llamadas durante la transición
    if (levelTransitionRef.current) {
      console.log('[DEBUG] levelUp called but levelTransitionRef already true - ignoring')
      return;
    }
    
    // Asegurarse de que el juego esté en estado válido para transición
    if (!force && gameState !== 'playing') {
      console.log('[DEBUG] levelUp called but game not in playing state - ignoring')
      return;
    }

    levelTransitionRef.current = true
    // Pausar el juego durante la transición
    gameDataRef.current.isPaused = true

    console.log('[DEBUG] levelUp start - current level=', level)
    // El nivel actual es 'level', y queremos mostrar que completamos este nivel
    // y vamos al siguiente
    const currentLevel = level
    const nextLevel = currentLevel + 1

    // Mostrar pantalla de nivel completado. The transition effect below
    // will detect the playing->other->playing cycle and perform nextTrack()
    // when the game returns to 'playing' (so we keep skip behaviour centralized).
    setLevelCompletedInfo({ prev: currentLevel, next: nextLevel })
    setShowLevelCompleted(true)

    // Actualizar el nivel y preparar valores dependientes del nivel (no sobrescribir baseSeed aquí)
    setLevel(prevLevel => {
      // Protección adicional contra actualizaciones múltiples
      if (prevLevel !== currentLevel) return prevLevel;

      // Reset temporal bonuses; baseInvaderSpeed se recalculará desde resetGame usando el seed y LEVEL_BASE_MULTIPLIER
      gameDataRef.current.edgeSpeedBonus = 0
      gameDataRef.current.invaderDropSpeed = Math.max(10, Math.round((gameDataRef.current.invaderDropSpeed || 45) * Math.pow(1.4, nextLevel - 1)))

      return nextLevel
    })

    // Esperar un momento para mostrar el overlay estilo SimonDice
    const transitionTimeout = setTimeout(() => {
      console.log('[DEBUG] levelUp timeout - hiding overlay and preparing countdown for level', nextLevel)
      
      if (!levelTransitionRef.current) {
        console.log('[DEBUG] levelUp timeout - transition was cancelled, aborting')
        return;
      }

      // Asegurarse de que el juego esté limpio antes de la transición
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }

      // suppress the cleanup's automatic gameState restore while we transition to countdown
      suppressLevelCompletedRestoreRef.current = true
      setShowLevelCompleted(false)
      
      // Secuencia de reinicio controlada
      const startNextLevel = () => {
        console.log('[DEBUG] startNextLevel sequence beginning')
        // Preparar nueva oleada: reset de invasores y escudos, mantener score/lives
        // Advance to next track in the central playlist when moving to the next level
        try { bgm.nextTrack(); } catch (e) { console.warn('[BGM] nextTrack failed', e); }
        resetGame(false, nextLevel)
        // Forzar que las animaciones de entrada vuelvan a reproducirse
        setGameStarted(false)
        // Iniciar countdown
        setCountdown(3)
        setGameState('countdown')
        // Permitir futuras transiciones
        levelTransitionRef.current = false
        console.log('[DEBUG] startNextLevel sequence completed')
      }

      // Iniciar la secuencia después de un breve delay para asegurar que todo esté limpio
      setTimeout(startNextLevel, 100)
    }, 1800)

    // Cleanup function para el timeout
    return () => {
      clearTimeout(transitionTimeout)
      // Asegurarse de que no queden estados colgados si el componente se desmonta
      levelTransitionRef.current = false
      suppressLevelCompletedRestoreRef.current = false
    }
  }, [level, resetGame, showLevelCompleted])

  // Funciones de juego
  const shoot = useCallback(() => {
    if (gameState !== "playing" || gameDataRef.current.isPaused) return

    const now = Date.now()
    if (now - lastShootTime.current < gameDataRef.current.shootCooldown) return

const p = gameDataRef.current.projectiles.player;
const half = Math.round(gameDataRef.current.shooter.width / 2);

gameDataRef.current.lasers.push({
  x: gameDataRef.current.shooter.x + half - Math.round(p.w / 2),
  y: gameDataRef.current.shooter.y,
  speed: p.speed,
  width: p.w,
  height: p.h,
});
    lastShootTime.current = now

    // --- LÓGICA DE ANIMACIÓN CORREGIDA ---
    shootCountRef.current++ // Incrementa el contador NUMÉRICO
    const isRightArm = shootCountRef.current % 2 === 1
    const animationClass = isRightArm ? "der" : "izq"

    // 1. Actualiza la clase en la referencia
    shootClassRef.current = animationClass

    // 2. Si hay un timeout anterior, lo cancela
    if (shootAnimationRef.current) {
      clearTimeout(shootAnimationRef.current)
    }

    // 3. Establece un nuevo timeout para limpiar la clase después de un breve período
    shootAnimationRef.current = setTimeout(() => {
      shootClassRef.current = ""
      shootAnimationRef.current = null
    }, 150)

    if (shootSoundRef.current) {
      // use a cloned node so overlapping shots don't interrupt each other
      tryPlayAudio(shootSoundRef, { clone: true, localVolume: volume })
    }
  }, [gameState])

  const shootSuper = useCallback(() => {
    if (gameState !== "playing" || gameDataRef.current.isPaused) return
    if (!superReady[currentPlayer - 1]) return

    const now = Date.now()
    gameDataRef.current.lastSuperUse[currentPlayer - 1] = now

    // --- LÓGICA DE ANIMACIÓN SUPER ---
    // 1. Actualiza la clase para el super
    superClassRef.current = "der-super"

    // 2. Cancela el timeout anterior si existe
    if (superAnimationRef.current) {
      clearTimeout(superAnimationRef.current)
    }

    // 3. Establece un nuevo timeout para limpiar la clase (por ejemplo, 1 segundo)
    superAnimationRef.current = setTimeout(() => {
      superClassRef.current = ""
      superAnimationRef.current = null
    }, 5000) // Duración más larga para el súper

    // 3. Modificar para mostrar el video y pausar el juego
    setShowSuperVideo(true)
    gameDataRef.current.isPaused = true
    if (superVideoRef.current) {
      superVideoRef.current.currentTime = 0
      superVideoRef.current.play()
    }

    // TIMEOUT DE SEGURIDAD: fuerza el cierre del video después de 5 segundos
    // Esto previene que el video se quede congelado en niveles avanzados
    if (superVideoTimeoutRef.current) {
      clearTimeout(superVideoTimeoutRef.current)
    }
    superVideoTimeoutRef.current = setTimeout(() => {
      console.warn('[SUPER] Timeout de seguridad activado - forzando cierre del video')
      handleSuperVideoEnd()
      superVideoTimeoutRef.current = null
    }, 5000) // 5 segundos es más que suficiente para el video

    if (superSoundRef.current) {
      // play a cloned super sound so the original remains available
      tryPlayAudio(superSoundRef, { clone: true, localVolume: volume })
      setTimeout(() => {
        // no-op: cloned node will finish itself; keep original at 0
        if (superSoundRef.current) {
          try { superSoundRef.current.pause(); superSoundRef.current.currentTime = 0 } catch(e) {}
        }
      }, 3000)
    }

    setScore((prev) => {
      const newScore = [...prev]
      newScore[currentPlayer - 1] = Math.max(0, newScore[currentPlayer - 1] - 2000)
      return newScore
    })

const s = gameDataRef.current.projectiles.super;
const half = Math.round(gameDataRef.current.shooter.width / 2);

gameDataRef.current.superBeams.push({
  x: gameDataRef.current.shooter.x + half - Math.round(s.w / 2),
  y: gameDataRef.current.shooter.y,
  speed: s.speed,
  width: s.w,
  height: s.h,
});

    gameDataRef.current.superCharge[currentPlayer - 1] = 0
    updateSuperDisplay()
  }, [gameState, superReady, currentPlayer, updateSuperDisplay])

  const handleSuperVideoEnd = useCallback(() => {
    // Limpiar el timeout de seguridad si existe
    if (superVideoTimeoutRef.current) {
      clearTimeout(superVideoTimeoutRef.current)
      superVideoTimeoutRef.current = null
    }
    
    // Ocultar el video y reanudar el juego
    setShowSuperVideo(false)
    gameDataRef.current.isPaused = false
    
    // Reanudar la música de fondo
    try {
      try { bgm.setVolume(volume); } catch (e) {}
      // Resume existing track instead of calling play() which may pick a new random song.
      try { bgm.resume(); } catch (e) {}
    } catch (e) {
      console.warn('[SUPER] Error resuming background music:', e)
    }
  }, [volume])

  // Función para resetear el juego desde el menú de pausa
  const resetCurrentGame = () => {
    // Resetear por completo y volver al countdown para que el jugador se prepare
    resetGame(true) // Reset completo incluyendo playerFinished
    setShowPauseMenu(false) // Oculta el menú de pausa si estaba abierto
    setCountdown(3)
    // Hide and unmount game area during countdown so animations replay on remount
    setMountGame(false)
    setGameState("countdown")

    // Reiniciar música de fondo para que se inicie después del countdown
    try { bgm.stop(); } catch (e) {}
  }

  const moveShooter = useCallback(
    (direction) => {
      if (gameState !== "playing" || gameDataRef.current.isPaused || isStunned) {
        return
      }

const speed = gameDataRef.current.shooterSpeed || 4;
      const shooter = gameDataRef.current.shooter

      if (direction === "left" && shooter.x > 0) {
        shooter.x = Math.max(0, shooter.x - speed)
      } else if (direction === "right" && shooter.x < gameDataRef.current.gameAreaWidth - shooter.width) {
        shooter.x = Math.min(gameDataRef.current.gameAreaWidth - shooter.width, shooter.x + speed)
      }
    },
    [gameState, isStunned], // ¡Importante! Agregar isStunned como dependencia
  )

const updateInvaders = useCallback(() => {
  const invaders = gameDataRef.current.invaders
  // compute effective speed from base + edge bonus
  const base = gameDataRef.current.baseInvaderSpeed || gameDataRef.current.invaderSpeed || 0.5
  const edgeBonus = gameDataRef.current.edgeSpeedBonus || 0
  // Aumentar el límite de velocidad máxima para permitir el escalado exponencial por nivel
  const maxSpeed = Math.max(20, gameDataRef.current.maxInvaderSpeed || 20)
  const speed = Math.min(base + edgeBonus, maxSpeed)
  let shouldDrop = false

  // Mover invasores horizontalmente
  invaders.forEach((invader) => {
    invader.x += speed * gameDataRef.current.invaderDirection
  })

  // Verificar si algún invasor tocó los bordes (mejorado)
  // En móviles, permitir que lleguen más cerca de los bordes reales del área de juego
  const isMobileDevice = window.innerWidth <= 1024
  const leftMargin = isMobileDevice ? -10 : 0
  const rightMargin = isMobileDevice ? 50 : 0
  
  invaders.forEach((invader) => {
    const effectiveWidth = invader.widthVisual || invader.width || 0
    if (invader.x <= leftMargin || invader.x + effectiveWidth >= gameDataRef.current.gameAreaWidth + rightMargin) {
      shouldDrop = true
    }
  })

  // Si tocan los bordes, cambiar dirección y bajar
  if (shouldDrop) {
    gameDataRef.current.invaderDirection *= -1
    invaders.forEach((invader) => {
      invader.y += gameDataRef.current.invaderDropSpeed
    })

    // Incrementar velocidad temporalmente (afecta solo edgeSpeedBonus)
const incBase = gameDataRef.current.invaderEdgeIncrement || 0.2;
const initial = gameDataRef.current.initialInvaderCount || gameDataRef.current.invaders.length || 1;
const ratio   = Math.max(0.4, (gameDataRef.current.invaders.length / initial)); // menos aliens => menor incremento
const inc     = incBase * ratio;

// Apply to edgeSpeedBonus, keep baseInvaderSpeed untouched
gameDataRef.current.edgeSpeedBonus = Math.min(
  (gameDataRef.current.edgeSpeedBonus || 0) + inc,
  (gameDataRef.current.maxInvaderSpeed || 2.5) - (gameDataRef.current.baseInvaderSpeed || 0)
);
  }

  // ✅ VERIFICACIÓN 1: invasores llegan al límite inferior del área de juego
  const bottomLimit = gameDataRef.current.gameAreaHeight - 15
  const reachedBottom = invaders.some(
    (inv) => inv.y + inv.height >= bottomLimit
  )
  
  if (reachedBottom) {
    // Limpiar entradas pegadas (mobile)
    keysRef.current = {}
    
    // 🔥 LLAMAR A endGame DIRECTAMENTE SIN DEPENDENCIA
    console.log(`Invasores llegaron al fondo - Jugador ${currentPlayer} pierde`) // DEBUG
    
    // Lógica de endGame copiada aquí para evitar dependencias circulares
    // IMPORTANTE: Verificar si este jugador ya terminó su turno
    if (playerFinished[currentPlayer - 1]) {
      return // Si ya terminó, no hacer nada
    }

    console.log(`Jugador ${currentPlayer} terminó su turno. Win: false`) // DEBUG

    const currentScore = score[currentPlayer - 1]
    const playerResult = {
      win: false,
      score: currentScore,
      player: currentPlayer,
      level: level,
    }

    // Detener el game loop inmediatamente
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = null
    }

    // Pausar el juego
    gameDataRef.current.isPaused = true

    if (players === 1) {
      // Modo 1 jugador - comportamiento normal
      setGameState("gameOver")
      setIsWin(false)
      
      // Configurar datos para UniversalGameOver
      setGameOverData({
        gameType: 'spaceinvaders',
        isSinglePlayer: true,
        score: currentScore,
        lives: lives[currentPlayer - 1],
        tipoGameOver: false, // Es derrota
        playerName: '',
        player2Name: '',
        player2Score: 0
      })
      
      setShowGameOverForm(true)

      // Marcar que este jugador ya terminó
      setPlayerFinished(prev => {
        const newFinished = [...prev];
        newFinished[currentPlayer - 1] = true;
        return newFinished;
      });
    } else if (players === 2) {
      // Modo 2 jugadores
      if (currentPlayer === 1) {
        console.log("Iniciando transición del jugador 1 al 2") // DEBUG
        
        // Jugador 1 terminó - guardar resultado
        setPlayer1Results(playerResult)
        setGamePhase("player2")

        // Marcar que el jugador 1 terminó
        setPlayerFinished((prev) => {
          const newFinished = [...prev];
          newFinished[0] = true; // Jugador 1 terminó
          return newFinished;
        });

        // MOSTRAR TRANSICIÓN INMEDIATAMENTE
        setShowPlayerTransition(true);
        setGameState("playerTransition");

        // limpiar inputs por si algo quedó presionado en móvil
        keysRef.current = {};

        // The global transition effect (below) handles adding listeners and a failsafe.
        // We only need to show the transition overlay here and clear inputs.
        // The effect watching `showPlayerTransition` + `gameState` will perform the actual
        // "press any button to continue" handling.
        keysRef.current = {};

      } else {
        console.log("Jugador 2 terminó, mostrando resultados finales") // DEBUG
        
        // Jugador 2 terminó - marcar como terminado y mostrar formularios para ambos
        setPlayerFinished((prev) => {
          const newFinished = [...prev];
          newFinished[1] = true; // Jugador 2 terminó
          return newFinished;
        });

        setPlayer2Results(playerResult)
        setGamePhase("bothComplete")
        setGameState("gameOver")
        
        // Configurar datos para UniversalGameOver (modo multiplayer)
        setGameOverData({
          gameType: 'spaceinvaders',
          isSinglePlayer: false,
          score: player1Results.score,
          lives: 0, // Ya no aplica en multiplayer
          tipoGameOver: false, // Se determinará en el componente
          playerName: '',
          player2Name: '',
          player2Score: playerResult.score
        })
        
        setShowGameOverForm(true)
      }
    }
    
    return
  }

  // --- NUEVO: Colisión invasores vs escudos y vs shooter ---
  try {
    const shields = gameDataRef.current.shields || []
    const shooter = gameDataRef.current.shooter || { x: 0, y: 0, width: 0, height: 0 }

    // Chequear cada invasor contra shields
    for (let i = invaders.length - 1; i >= 0; i--) {
      const inv = invaders[i]

      // Colisión con shields: si invader toca cualquier shield -> eliminar shield completamente
      for (let s = shields.length - 1; s >= 0; s--) {
        const sh = shields[s]
        if (
          inv.x < sh.x + sh.width &&
          inv.x + (inv.width || 0) > sh.x &&
          inv.y < sh.y + sh.height &&
          inv.y + (inv.height || 0) > sh.y
        ) {
          // Crear pequeña explosión visual
          gameDataRef.current.explosions.push({
            x: inv.x + (inv.width || 20) / 2,
            y: inv.y + (inv.height || 20) / 2,
            size: 20,
          })

          // Eliminar el shield por completo
          shields.splice(s, 1)
          // No removemos el invader por esta colisión (el invasor puede seguir)
        }
      }

      // Colisión invader -> shooter: terminar el juego inmediatamente para el jugador actual
      if (
        inv.x < shooter.x + shooter.width &&
        inv.x + (inv.width || 0) > shooter.x &&
        inv.y < shooter.y + shooter.height &&
        inv.y + (inv.height || 0) > shooter.y
      ) {
        // Llamar a endGame(false) pero respetando el estado y protecciones que ya tiene
        endGame(false)
        return
      }
    }
  } catch (e) {
    console.warn('Error checking invader collisions:', e)
  }

  // ✅ VERIFICACIÓN 2: invasores llegaron al shooter (verificación adicional)
  const reachedShooter = invaders.some((invader) => 
    invader.y + invader.height >= gameDataRef.current.shooter.y
  )
  
  if (reachedShooter) {
    console.log(`Invasores llegaron al shooter - Jugador ${currentPlayer} pierde`) // DEBUG
    keysRef.current = {}
    
    // Misma lógica que arriba - duplicada para evitar dependencias
    if (playerFinished[currentPlayer - 1]) {
      return
    }

    const currentScore = score[currentPlayer - 1]
    const playerResult = {
      win: false,
      score: currentScore,
      player: currentPlayer,
      level: level,
    }

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = null
    }

    gameDataRef.current.isPaused = true

    if (players === 1) {
      setGameState("gameOver")
      setIsWin(false)
      setShowGameOverForm(true)
      setPlayerFinished(prev => {
        const newFinished = [...prev];
        newFinished[currentPlayer - 1] = true;
        return newFinished;
      });
    } else if (players === 2) {
      if (currentPlayer === 1) {
        setPlayer1Results(playerResult)
        setGamePhase("player2")
        setPlayerFinished((prev) => {
          const newFinished = [...prev];
          newFinished[0] = true;
          return newFinished;
        });
        setShowPlayerTransition(true);
        setGameState("playerTransition");
        keysRef.current = {};
      } else {
        setPlayerFinished((prev) => {
          const newFinished = [...prev];
          newFinished[1] = true;
          return newFinished;
        });
        setPlayer2Results(playerResult)
        setGamePhase("bothComplete")
        setGameState("gameOver")
        
        // Configurar datos para UniversalGameOver (modo multiplayer)
        setGameOverData({
          gameType: 'spaceinvaders',
          isSinglePlayer: false,
          score: player1Results.score,
          lives: 0, // Ya no aplica en multiplayer
          tipoGameOver: false, // Se determinará en el componente
          playerName: '',
          player2Name: '',
          player2Score: playerResult.score
        })
        
        setShowGameOverForm(true)
      }
    }
    
    return
  }
}, [currentPlayer, players, score, playerFinished]) // Solo las dependencias que realmente necesitamos

  const updateLasers = useCallback(() => {
    // Actualizar láseres del jugador
    gameDataRef.current.lasers = gameDataRef.current.lasers.filter((laser) => {
      laser.y -= laser.speed
      return laser.y > -laser.height
    })

    // Actualizar láseres enemigos
    gameDataRef.current.enemyLasers = gameDataRef.current.enemyLasers.filter((laser) => {
      laser.y += laser.speed
      return laser.y < gameDataRef.current.gameAreaHeight
    })

    // Actualizar super rayos
    gameDataRef.current.superBeams = gameDataRef.current.superBeams.filter((beam) => {
      beam.y -= beam.speed
      return beam.y > -beam.height
    })
  }, [])

  const checkCollisions = useCallback(() => {
    const { invaders, lasers, enemyLasers, shields, powerUps, superBeams, shooter } = gameDataRef.current

    // *** NUEVA FUNCIONALIDAD: Colisión entre láseres del jugador y enemigos ***
    for (let i = lasers.length - 1; i >= 0; i--) {
      const playerLaser = lasers[i]
      for (let j = enemyLasers.length - 1; j >= 0; j--) {
        const enemyLaser = enemyLasers[j]

        // Verificar colisión entre láseres
        if (
          playerLaser.x < enemyLaser.x + enemyLaser.width &&
          playerLaser.x + playerLaser.width > enemyLaser.x &&
          playerLaser.y < enemyLaser.y + enemyLaser.height &&
          playerLaser.y + playerLaser.height > enemyLaser.y
        ) {
          // Crear pequeña explosión en el punto de colisión
          gameDataRef.current.explosions.push({
            x: (playerLaser.x + enemyLaser.x) / 2,
            y: (playerLaser.y + enemyLaser.y) / 2,
            size: 8,
          })

          // Remover ambos láseres
          lasers.splice(i, 1)
          enemyLasers.splice(j, 1)

          // Pequeño bonus por interceptar disparo enemigo
          setScore((prev) => {
            const newScore = [...prev]
            newScore[currentPlayer - 1] += 300
            return newScore
          })
          // Reproducir sonido de intercepto (KiHit)
          try {
            tryPlayAudio(kiHitRef, { clone: true }).catch(() => {})
          } catch (e) {
            // ignore
          }
          break
        }
      }
    }

    // Colisiones láser-invasor
    for (let i = lasers.length - 1; i >= 0; i--) {
      const laser = lasers[i]
      for (let j = invaders.length - 1; j >= 0; j--) {
        const invader = invaders[j]
        const effW = invader.widthVisual || invader.width || 0
        const effH = invader.heightVisual || (invader.height && invader.width ? Math.round(invader.height * (effW / invader.width)) : invader.height) || invader.height || 0
        if (
          laser.x < invader.x + effW &&
          laser.x + laser.width > invader.x &&
          laser.y < invader.y + effH &&
          laser.y + laser.height > invader.y
        ) {
          // Marca al invasor como "muriendo" para reproducir la animación/tintado
          if (!invader.dying) {
            invader.dying = true
            invader.dyingUntil = Date.now() + 150 // 150ms para mostrar recoil/tint antes de eliminar
            invader.preDeathOffset = -8
            // normalmente damos puntos por disparos normales
            invader.awardOnDeath = true
            // Reproducir sonido de hit al invasor (puede spamearse)
            try {
              tryPlayAudio(alienHitRef, { clone: true }).catch(() => {})
            } catch (e) {}
          }

          // Aumentar carga del súper inmediatamente
          gameDataRef.current.superCharge[currentPlayer - 1] = Math.min(
            100,
            gameDataRef.current.superCharge[currentPlayer - 1] + 10,
          )

          // Remover solo el láser ahora; el invasor se eliminará tras el retraso en processDyingInvaders
          lasers.splice(i, 1)
          break
        }
      }
    }

    for (let i = superBeams.length - 1; i >= 0; i--) {
      const beam = superBeams[i]
      for (let j = invaders.length - 1; j >= 0; j--) {
        const invader = invaders[j]
        const effW = invader.widthVisual || invader.width || 0
        const effH = invader.heightVisual || (invader.height && invader.width ? Math.round(invader.height * (effW / invader.width)) : invader.height) || invader.height || 0
        if (
          beam.x < invader.x + effW &&
          beam.x + beam.width > invader.x &&
          beam.y < invader.y + effH &&
          beam.y + beam.height > invader.y
        ) {
          // Create explosion but no points
          gameDataRef.current.explosions.push({
            x: invader.x + effW / 2,
            y: invader.y + effH / 2,
            size: 20,
          })

          invaders.splice(j, 1)
        }
      }
    }

    // Colisiones láser enemigo-shooter
    for (let i = enemyLasers.length - 1; i >= 0; i--) {
      const laser = enemyLasers[i]
      if (
        laser.x < shooter.x + shooter.width &&
        laser.x + laser.width > shooter.x &&
        laser.y < shooter.y + shooter.height &&
        laser.y + laser.height > shooter.y
      ) {
        enemyLasers.splice(i, 1)
        loseLife() // Esta función ya maneja todos los efectos
        break
      }
    }

    // Colisiones láser enemigo con escudos
    for (let i = enemyLasers.length - 1; i >= 0; i--) {
      const laser = enemyLasers[i]
      for (let j = shields.length - 1; j >= 0; j--) {
        const shield = shields[j]
        if (
          laser.x < shield.x + shield.width &&
          laser.x + laser.width > shield.x &&
          laser.y < shield.y + shield.height &&
          laser.y + laser.height > shield.y
        ) {
          enemyLasers.splice(i, 1)

          shield.health-- // Reducir vida del escudo

          gameDataRef.current.explosions.push({
            x: laser.x,
            y: laser.y,
            size: 8,
          })

          if (shield.health <= 0) {
            shields.splice(j, 1) // Eliminar escudo si no tiene vida
          }

          break
        }
      }
    }

    // Colisiones gigantes (special spheres) con escudos y shooter
    for (let s = gameDataRef.current.specialSpheres.length - 1; s >= 0; s--) {
      const sphere = gameDataRef.current.specialSpheres[s]
      // Only active (launched) spheres can collide and cause damage
      if (sphere.stage !== 'launched') continue

      // sphere covers x..x+width and y..y+height; check shields (optional: keep shields intact unless hit)
      for (let j = shields.length - 1; j >= 0; j--) {
        const shield = shields[j]
        if (
          sphere.x < shield.x + shield.width &&
          sphere.x + sphere.width > shield.x &&
          sphere.y < shield.y + shield.height &&
          sphere.y + sphere.height > shield.y
        ) {
          // destroy shield immediately on contact during descent
          shields.splice(j, 1)
        }
      }

      // check collision with shooter (instant lose) — only when descending and overlapping
      if (
        sphere.x < shooter.x + shooter.width &&
        sphere.x + sphere.width > shooter.x &&
        sphere.y < shooter.y + shooter.height &&
        sphere.y + sphere.height > shooter.y
      ) {
        // immediate lose: trigger endGame(false)
        gameDataRef.current.specialSpheres.splice(s, 1)
        endGame(false)
        break
      }
    }

    // *** MEJORADA: Colisiones power-up-shooter (ahora cura vida) ***
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const powerUp = powerUps[i]
      if (
        powerUp.x < shooter.x + shooter.width &&
        powerUp.x + powerUp.width > shooter.x &&
        powerUp.y < shooter.y + shooter.height &&
        powerUp.y + powerUp.height > shooter.y
      ) {
        powerUps.splice(i, 1)

        // Si es power-up de vida, curar una vida (máximo 5 vidas)
        if (powerUp.type === "health") {
          setLives((prev) => {
            const newLives = [...prev]
            const currentLives = newLives[currentPlayer - 1]
            if (currentLives < 5) {
              // Máximo 5 vidas
              newLives[currentPlayer - 1] = currentLives + 1
              createLifePopup(powerUp.x, powerUp.y)

              // También dar un poco de carga súper como bonus
              gameDataRef.current.superCharge[currentPlayer - 1] = Math.min(
                100,
                gameDataRef.current.superCharge[currentPlayer - 1] + 25,
              )
              if (senzuSoundRef.current) {
                const sound = senzuSoundRef.current.cloneNode() // crea una copia nueva del audio
                // Use master gain for level; keep element volume at 1 and mute if volume === 0
                try { sound.volume = 1; sound.muted = volume === 0 } catch (e) {}
                sound.currentTime = 0
                tryPlayAudio(sound)
                // También reproducir SenzuEaten
                try { tryPlayAudio(senzuEatenRef, { clone: true }).catch(() => {}) } catch (e) {}
              }
            } else {
              // Si ya tiene máximo de vidas, solo dar carga súper completa
              gameDataRef.current.superCharge[currentPlayer - 1] = 100
              // Bonus de puntos (no popup)
              setScore((prev) => {
                const newScore = [...prev]
                newScore[currentPlayer - 1] += 500
                return newScore
              })
              // Reproducir SenzuEmpty en lugar de Senzu
              try { tryPlayAudio(senzuEmptyRef, { clone: true }).catch(() => {}) } catch (e) {}
            }
            return newLives
          })
        }
      }
    }

    // Procesar invasores marcados como muriendo: eliminar tras breve retardo y otorgar puntos
    const now = Date.now()
    for (let j = invaders.length - 1; j >= 0; j--) {
      const inv = invaders[j]
      if (inv.dying && now >= (inv.dyingUntil || 0)) {
        // Explosión final
        gameDataRef.current.explosions.push({
          x: inv.x + inv.width / 2,
          y: inv.y + inv.height / 2,
          size: 18,
        })

        // Puntos solo si corresponde
        if (inv.awardOnDeath) {
          const pts = inv.points || 0
          setScore((prev) => {
            const newScore = [...prev]
            newScore[currentPlayer - 1] += pts
            return newScore
          })

          // Posibilidad de generar power-up de vida (8% probabilidad)
          if (Math.random() < 0.08) {
            powerUps.push({
              x: inv.x + inv.width / 2 - 8,
              y: inv.y + inv.height / 2 - 8,
              speed: 2,
              width: 16,
              height: 16,
              type: "health",
            })
          }
        }

        // Finalmente remover invasor
        invaders.splice(j, 1)
      }
    }

    updateAlienCounters()
    updateSuperDisplay()

    // Verificar si la oleada terminó: subir de nivel en vez de terminar el juego
    if (invaders.length === 0 && !showLevelCompleted && gameState === "playing") {
      levelUp()
    }
  }, [currentPlayer, createLifePopup, updateAlienCounters, updateSuperDisplay, volume])

  const endGame = useCallback(
    (win) => {
      // IMPORTANTE: Verificar si este jugador ya terminó su turno
      if (playerFinished[currentPlayer - 1]) {
        return // Si ya terminó, no hacer nada
      }
  
      console.log(`Jugador ${currentPlayer} terminó su turno. Win: ${win}`) // DEBUG
  
      const currentScore = score[currentPlayer - 1]
      const playerResult = {
        win: win,
        score: currentScore,
        player: currentPlayer,
        level: level,
      }
  
      // Detener el game loop inmediatamente
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = null
      }
  
      // Pausar el juego
      gameDataRef.current.isPaused = true
  
      if (players === 1) {
        // Modo 1 jugador - comportamiento normal
        setGameState("gameOver")
        setIsWin(win)
        setShowGameOverForm(true)
  
        // Marcar que este jugador ya terminó
        setPlayerFinished(prev => {
          const newFinished = [...prev];
          newFinished[currentPlayer - 1] = true;
          return newFinished;
        });
      } else if (players === 2) {
        // Modo 2 jugadores
        if (currentPlayer === 1) {
          console.log("Iniciando transición del jugador 1 al 2") // DEBUG
          
          // Jugador 1 terminó - guardar resultado
          setPlayer1Results(playerResult)
          setGamePhase("player2")
  
          // Marcar que el jugador 1 terminó
          setPlayerFinished((prev) => {
            const newFinished = [...prev];
            newFinished[0] = true; // Jugador 1 terminó
            return newFinished;
          });
  
          // MOSTRAR TRANSICIÓN INMEDIATAMENTE
          setShowPlayerTransition(true);
          setGameState("playerTransition");

          // limpiar inputs por si algo quedó presionado en móvil
          keysRef.current = {};

          // For press-any-button behavior we rely on the shared effect to add listeners
          // No automatic countdown here; users must press a key/tap to continue.
  
        } else {
          console.log("Jugador 2 terminó, mostrando resultados finales") // DEBUG
          
          // Jugador 2 terminó - marcar como terminado y mostrar formularios para ambos
          setPlayerFinished((prev) => {
            const newFinished = [...prev];
            newFinished[1] = true; // Jugador 2 terminó
            return newFinished;
          });
  
          setPlayer2Results(playerResult)
          setGamePhase("bothComplete")
          setGameState("gameOver")
          
          // Configurar datos para UniversalGameOver (modo multiplayer)
          setGameOverData({
            gameType: 'spaceinvaders',
            isSinglePlayer: false,
            score: player1Results.score,
            lives: 0, // Ya no aplica en multiplayer
            tipoGameOver: false, // Se determinará en el componente
            playerName: '',
            player2Name: '',
            player2Score: playerResult.score
          })
          
          setShowGameOverForm(true)
        }
      }
    },
    [currentPlayer, players, score, resetGame, playerFinished],
  )

  const loseLife = useCallback(() => {
    // Si el jugador ya terminó, no procesar más daño
    if (playerFinished[currentPlayer - 1]) {
      return
    }

    // Reproducir sonidos con mejor manejo de errores y volumen
    const playDamageSounds = async () => {
      try {
        // Reproducir sonidos de daño asegurando el volumen correcto
        if (playerDamageSoundRef.current) {
          const damageSound = playerDamageSoundRef.current.cloneNode();
          // Use master gain; keep element volume at 1 and set muted if necessary
          try { damageSound.volume = 1; damageSound.muted = volume === 0 } catch (e) {}
          // Esperar a que el audio esté listo
          await new Promise((resolve) => {
            damageSound.oncanplay = resolve;
            try { damageSound.load(); } catch(e) {}
          });
          await damageSound.play().catch(e => console.warn("Error playing damage sound:", e));
        }
        
        // Pequeña pausa entre sonidos
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (playerHitSoundRef.current) {
          const hitSound = playerHitSoundRef.current.cloneNode();
          try { hitSound.volume = 1; hitSound.muted = volume === 0 } catch (e) {}
          // Esperar a que el audio esté listo
          await new Promise((resolve) => {
            hitSound.oncanplay = resolve;
            try { hitSound.load(); } catch(e) {}
          });
          await hitSound.play().catch(e => console.warn("Error playing hit sound:", e));
        }
      } catch (error) {
        console.warn("Error in damage sound sequence:", error);
      }
    };

    // Iniciar reproducción de sonidos
    playDamageSounds();    gameDataRef.current.explosions.push({
      x: gameDataRef.current.shooter.x + gameDataRef.current.shooter.width / 2,
      y: gameDataRef.current.shooter.y + gameDataRef.current.shooter.height / 2,
      size: 30,
    })

    setIsStunned(true)
    stunnedRef.current = true

 const shooterElements = document.querySelectorAll(`.${styles.shooter}`) // CORREGIDO
  shooterElements.forEach((el) => el.classList.add(styles.stunned || 'stunned')) // CORREGIDO

setTimeout(() => {
    setIsStunned(false)
    stunnedRef.current = false
    const shooterElements = document.querySelectorAll(`.${styles.shooter}`) // CORREGIDO
    shooterElements.forEach((el) => el.classList.remove(styles.stunned || 'stunned')) // CORREGIDO
  }, 300)
 
    setHasLostInitialLife((prev) => {
      const newStatus = [...prev]
      newStatus[currentPlayer - 1] = true
      return newStatus
    })

    setLives((prev) => {
      const newLives = [...prev]
      newLives[currentPlayer - 1]--

      if (newLives[currentPlayer - 1] <= 0) {
        // Solo llamar endGame si el jugador no ha terminado ya
        if (!playerFinished[currentPlayer - 1]) {
          if (players === 2) {
            if (currentPlayer === 1) {
              endGame(false) // Jugador 1 perdió
            } else {
              endGame(false) // Jugador 2 perdió
            }
          } else {
            endGame(false) // Modo 1 jugador
          }
        }
      }
      return newLives
    })
}, [currentPlayer, players, endGame, playerFinished])

  const adminRemoveLife = useCallback(() => {
  if (gameState !== "playing") return;
  loseLife();
}, [gameState, loseLife]);
// Funciones de administrador
const adminForceWin = useCallback(() => {
  if (gameState !== "playing") return;
  endGame(true); // Forzar victoria
}, [gameState, endGame]);

const adminForceLose = useCallback(() => {
  if (gameState !== "playing") return;
  endGame(false); // Forzar derrota
}, [gameState, endGame]);

const adminAddLife = useCallback(() => {
  if (gameState !== "playing") return;
  setLives((prev) => {
    const newLives = [...prev];
    newLives[currentPlayer - 1] = Math.min(5, newLives[currentPlayer - 1] + 1);
    return newLives;
  });
}, [gameState, currentPlayer]);


const adminAddScore = useCallback(() => {
  if (gameState !== "playing") return;
  setScore((prev) => {
    const newScore = [...prev];
    newScore[currentPlayer - 1] += 1000;
    return newScore;
  });
}, [gameState, currentPlayer]);

const adminEnableSuper = useCallback(() => {
  if (gameState !== "playing") return;
  setScore((prev) => {
    const newScore = [...prev];
    newScore[currentPlayer - 1] = Math.max(2000, newScore[currentPlayer - 1]);
    return newScore;
  });
  gameDataRef.current.lastSuperUse[currentPlayer - 1] = 0; // Reset cooldown
  updateSuperDisplay();
}, [gameState, currentPlayer, updateSuperDisplay]);

const adminClearAllAliens = useCallback(() => {
  if (gameState !== "playing") return;
  gameDataRef.current.invaders = [];
  updateAlienCounters();
}, [gameState, updateAlienCounters]);

  // 5. Función para resetear completamente el juego multijugador
  const resetMultiplayerGame = useCallback(() => {
    setPlayer1Results(null)
    setPlayer2Results(null)
    setGamePhase("playing")
    setCurrentPlayer(1)
    resetGame(true) // FULL RESET
  }, [resetGame])

  const invaderFire = useCallback(() => {
    const now = Date.now()
    if (now - gameDataRef.current.lastInvaderFire > 800 + Math.random() * 1500) {
      const invaders = gameDataRef.current.invaders
      if (invaders.length > 0) {
        const randomInvader = invaders[Math.floor(Math.random() * invaders.length)]
const e = gameDataRef.current.projectiles.enemy;
gameDataRef.current.enemyLasers.push({
  x: randomInvader.x + randomInvader.width / 2 - Math.round(e.w / 2),
  y: randomInvader.y + randomInvader.height,
  speed: e.speed,
  width: e.w,
  height: e.h,
});
        gameDataRef.current.lastInvaderFire = now
      }
    }
  }, [])

  // Función principal de actualización del juego
  const updateGame = useCallback(
    (deltaTime) => {
      if (gameState !== "playing" || gameDataRef.current.isPaused) return

      updateInvaders()
      updateLasers()
      checkCollisions()
      invaderFire()

      // SPECIAL ENEMY SPAWN/UPDATE
      // increment spawn timer
      gameDataRef.current.specialSpawnTimer = (gameDataRef.current.specialSpawnTimer || 0) + deltaTime
      // evaluate spawn every ~2000ms interval
      if (gameDataRef.current.specialSpawnTimer >= 2000) {
        gameDataRef.current.specialSpawnTimer = 0
        // Only spawn if no freezer currently active
        if (!gameDataRef.current.freezerActive) {
          // base probability scaled by level (doubles each level)
          const effectiveProb = (gameDataRef.current.specialBaseProb || 0.02) * Math.pow(2, Math.max(0, level - 1))
          if (Math.random() < effectiveProb) {
            // spawn Freezer at left or right depending on toggle
            const side = gameDataRef.current.specialSideToggle % 2 === 0 ? 'left' : 'right'
            gameDataRef.current.specialSideToggle++
            const gaW = gameDataRef.current.gameAreaWidth
            const gaH = gameDataRef.current.gameAreaHeight
            const startX = side === 'left' ? -80 : gaW + 80
            // spawn a bit higher in the screen
            const y = 20 + Math.random() * Math.max(10, gaH * 0.12)
            // Freezer will sweep only partway toward the opposite side (not full extreme)
            const sweepTargetX = side === 'left' ? Math.round(gaW * 0.85) : Math.round(gaW * 0.15)
            // give freezer a small unique id so spheres can reference their parent
            const freezerId = Date.now() + Math.floor(Math.random() * 1000)
            gameDataRef.current.specialEnemies.push({ id: freezerId, x: startX, y, vx: computeSpecialVx(side === 'left' ? 1 : -1, 'sweep'), side, sweepTargetX, state: 'sweeping' })
            gameDataRef.current.freezerActive = true
            
            // Reproducir risa de Freezer cuando aparece
            console.log('[AUDIO] Attempting to play Freezer laugh...');
            if (freezerSoundRefs.laugh?.current) {
              console.log('[AUDIO] Freezer laugh ref found, attempting playback');
              // Asegurar que el audio esté listo antes de reproducir
              const playLaugh = async () => {
                try {
                  if (audioContextRef.current?.state === 'suspended') {
                    await audioContextRef.current.resume();
                  }
                  await tryPlayAudio(freezerSoundRefs.laugh, { clone: true });
                } catch (e) {
                  console.warn('[AUDIO] Error playing Freezer laugh:', e);
                }
              };
              playLaugh();
            } else {
              console.warn('[AUDIO] Freezer laugh ref not found!');
            }
          }
        }
      }

      // update special enemies (Freezer lifecycle)
      gameDataRef.current.specialEnemies = gameDataRef.current.specialEnemies.filter((se) => {
        const now = Date.now()
        const gaW = gameDataRef.current.gameAreaWidth
        const gaH = gameDataRef.current.gameAreaHeight

        if (se.state === 'sweeping') {
          // move across to sweepTargetX
          const dir = se.vx > 0 ? 1 : -1
          se.x += se.vx * (deltaTime / 16)
          // if reached or passed sweep target, clamp and change to moveToHalf
          if ((dir === 1 && se.x >= se.sweepTargetX) || (dir === -1 && se.x <= se.sweepTargetX)) {
            se.x = se.sweepTargetX
            se.vx = 0
            const chosenHalf = Math.random() < 0.5 ? 'left' : 'right'
            se.chosenHalf = chosenHalf
            se.halfX = chosenHalf === 'left' ? Math.round(gaW * 0.25) : Math.round(gaW * 0.75)
            se.state = 'moveToHalf'
            se.moveStartAt = now
          }
          return true
        }

        if (se.state === 'moveToHalf') {
          // small pause then move to halfX
          if (now >= (se.moveStartAt || 0) + (se.moveDelay || 0)) {
            se.vx = se.halfX > se.x ? computeSpecialVx(1, 'approach') : computeSpecialVx(-1, 'approach')
            se.state = 'approachHalf'
          }
          return true
        }

        if (se.state === 'approachHalf') {
          se.x += se.vx * (deltaTime / 16)
          if ((se.vx > 0 && se.x >= se.halfX) || (se.vx < 0 && se.x <= se.halfX)) {
            se.x = se.halfX
            se.vx = 0
            // Enter preFire: configure timing and create the sphere so it grows DURING preFire
            se.state = 'preFire'
            const preFireDur = (gameDataRef.current.special && gameDataRef.current.special.preFireDuration) || 2000
            se.preFireReadyAt = now + preFireDur

            // Crear esfera al inicio de preFire (si no existe ya para este freezer)
            const existing = (gameDataRef.current.specialSpheres || []).some(s => s.parentFreezerId === se.id)
            if (!existing) {
              // Simplified sphere: spawn centered above the freezer, JS will drive its motion
              // Force the special sphere to occupy HALF of the gameArea width.
              // Make it a perfect circle (height == width). Position it so its bottom
              // sits a small gap above the freezer (so it visually appears above Freezer).
              const sphereWidth = Math.round(gaW * 0.5)
              // Use same value for height to make it a circle; cap it so it doesn't exceed game height * 1.5
              const sphereHeight = Math.min(sphereWidth, Math.round(gaH * 1.5))

              // Position X to cover left or right half exactly
              const sphereX = se.chosenHalf === 'left' ? 0 : Math.round(gaW * 0.5)
              // place the sphere so its bottom sits above the freezer to avoid overlap (keep small gap)
              const smallGap = 3
              // spawnY is the top coordinate; we want bottom = se.y - smallGap
              const spawnBottom = Math.round(se.y - smallGap)
              const sphereY = spawnBottom - sphereHeight

              const sphere = {
                x: sphereX,
                y: sphereY,
                // store the spawn bottom so charging animation can reference a fixed bottom point
                _spawnY: sphereY,
                _spawnBottom: spawnBottom,
                width: sphereWidth,
                height: sphereHeight,
                vx: 0,
                vy: 0,
                side: se.chosenHalf,
                stage: 'charging', // charging -> ready -> launched
                createdAt: now,
                chargeDuration: 1000, // ms to charge (rise + scale)
                readyDuration: 200, // ms hold before launch
                launchTravelMs: 600, // ms to cross to bottom (used to compute vy)
                scale: 0.12,
                parentFreezerId: se.id,
              };
              gameDataRef.current.specialSpheres.push(sphere);
              // Reproducir sonido de expansión de la esfera
              if (freezerSoundRefs.sphereExpand?.current) {
                tryPlayAudio(freezerSoundRefs.sphereExpand, { clone: true });
              }
            }
          }
          return true
        }

        if (se.state === 'preFire') {
          if (now >= se.preFireReadyAt) {
            // Transition to fired — firing moment is the configured preFireReadyAt
            se.state = 'fired'
            se.firedAt = se.preFireReadyAt
            // find associated sphere and force it to start descending now so it is launched immediately
            const sp = (gameDataRef.current.specialSpheres || []).find(s => s.parentFreezerId === se.id)
            if (sp) {
              // Force immediate launch
              sp.stage = 'launched'
              sp._startDescentAt = se.firedAt
              // compute vy to reach bottom in configured travel time
              const gaH = gameDataRef.current.gameAreaHeight
              const dist = Math.max(50, gaH - sp.y)
              const travel = sp.launchTravelMs || 700
              sp.vy = Math.max(0.15, dist / travel)
            }
            const departExtra = (gameDataRef.current.special && gameDataRef.current.special.departDelayAfterFire) || 1000
            // schedule depart a fixed delay after firing (do NOT add spawnDur — the grow already happened during preFire)
            se.departAt = se.firedAt + departExtra
          }
          return true
        }

        if (se.state === 'fired') {
          // if departAt elapsed, start departing even if sphere still active
          if (se.departAt && now >= se.departAt) {
            const leftDist = se.x
            const rightDist = gaW - se.x
            se.departTargetX = leftDist <= rightDist ? -100 : gaW + 100
            se.departTargetY = se.y < gaH / 2 ? -80 : gaH + 80
            se.vx = se.departTargetX > se.x ? computeSpecialVx(1, 'depart') : computeSpecialVx(-1, 'depart')
            // vertical depart speed scaled from horizontal magnitude for consistency
            se.vy = (Math.abs(se.vx) * 0.6) * (se.departTargetY > se.y ? 1 : -1)
            se.state = 'departing';
          }
          return true
        }

        if (se.state === 'departing') {
          // move freezer off-screen towards depart target
          se.x += (se.vx || 0) * (deltaTime / 16);
          se.y += (se.vy || 0) * (deltaTime / 16);
          // remove when far outside bounds
          if (se.x < -200 || se.x > gaW + 200 || se.y < -200 || se.y > gaH + 200) {
            gameDataRef.current.freezerActive = false;
            return false; // remove this freezer
          }
          return true;
        }

        // default keep
        return true;
      })

      // actualizar esferas: controlar el pequeño ciclo JS de carga -> listo -> lanzamiento
      gameDataRef.current.specialSpheres = gameDataRef.current.specialSpheres.filter((sp, idx) => {
        const now = Date.now();

        // CHARGING: subir ligeramente y escalar desde pequeño a full
        if (sp.stage === 'charging') {
          const elapsed = now - (sp.createdAt || 0);
          const dur = sp.chargeDuration || 600;
          const t = Math.min(1, elapsed / dur);
          // scale interpolation (0.12 -> 1)
          sp.scale = 0.12 + t * (1 - 0.12);
          // Move the top slightly upwards during charging (same behavior as original)
          const rise = sp.chargeRise || Math.max(18, Math.round(sp.height * 0.08));
          sp.y = (sp._spawnY !== undefined ? sp._spawnY : sp.y) - t * rise;

          if (t >= 1) {
            sp.stage = 'ready'
            sp._readyStart = now
            sp.scale = 1
          }
          return true
        }

        // READY: pequeño pulso, luego lanzar
        if (sp.stage === 'ready') {
          // gentle pulse
          sp.scale = 1 + Math.sin(now / 120) * 0.02
          if (now - (sp._readyStart || 0) >= (sp.readyDuration || 250)) {
            sp.stage = 'launched'
            // compute vy so the sphere crosses from current y to bottom in launchTravelMs
            const gaW = gameDataRef.current.gameAreaWidth
            const gaH = gameDataRef.current.gameAreaHeight
            const dist = Math.max(50, gaH - sp.y)
            const travel = Math.max(300, sp.launchTravelMs || 700)
            sp.vy = Math.max(0.15, dist / travel)
            
            // Reproducir sonido de lanzamiento
            if (freezerSoundRefs.sphereLaunch?.current) {
              tryPlayAudio(freezerSoundRefs.sphereLaunch, { clone: true });
            } // px per ms
            sp.vx = 0
          }
          return true
        }

        // LAUNCHED: movimiento en linea recta hacia abajo (vy en px/ms)
        if (sp.stage === 'launched') {
          sp.y += (sp.vy || 0) * deltaTime

          // si sale por abajo, notificar al freezer y remover
          if (sp.y - (sp.height / 2) >= gameDataRef.current.gameAreaHeight) {
            const freezers = gameDataRef.current.specialEnemies
            if (freezers && freezers.length) {
              for (let fi = 0; fi < freezers.length; fi++) {
                const f = freezers[fi]
                if (f.state === 'fired' && f.id === sp.parentFreezerId) {
                  const gaW = gameDataRef.current.gameAreaWidth
                  const gaH = gameDataRef.current.gameAreaHeight
                  const leftDist = f.x
                  const rightDist = gaW - f.x
                  f.departTargetX = leftDist <= rightDist ? -100 : gaW + 100
                  f.departTargetY = f.y < gaH / 2 ? -80 : gaH + 80
                  // Use computed special vx so depart scales with invader speed like other phases
                  f.vx = f.departTargetX > f.x ? computeSpecialVx(1, 'depart') : computeSpecialVx(-1, 'depart')
                  // Keep vertical depart speed proportional to horizontal magnitude for consistent feel
                  f.vy = (Math.abs(f.vx) * 0.6) * (f.departTargetY > f.y ? 1 : -1)
                  f.state = 'departing'
                  break
                }
              }
            }
            return false
          }
          return true
        }

        return true
      })

      // Actualizar power-ups
      gameDataRef.current.powerUps = gameDataRef.current.powerUps.filter((powerUp) => {
        powerUp.y += powerUp.speed
        return powerUp.y < gameDataRef.current.gameAreaHeight
      })

      // Actualizar explosiones
      gameDataRef.current.explosions = gameDataRef.current.explosions.filter((explosion) => {
        explosion.size += 1.5
        return explosion.size < 40
      })
    },
    [gameState, updateInvaders, updateLasers, checkCollisions, invaderFire],
  )

 // Método render() corregido - reemplaza el método existente en SpaceInvaders.js

const render = useCallback(() => {
  if (!gameAreaRef.current) return

  const gameArea = gameAreaRef.current
  gameArea.innerHTML = ""

  const { shooter, invaders, lasers, enemyLasers, shields, powerUps, superBeams, explosions } = gameDataRef.current

  // Fragment para batching de elementos
  const fragment = document.createDocumentFragment()

  // Renderizar shooter - CORREGIDO para CSS Modules
  const shooterEl = document.createElement("div")
  
  // Construir clases usando CSS Modules
  let shooterClasses = [styles.shooter]
  
  if (superReady[currentPlayer - 1]) {
    shooterClasses.push(styles.superReady || 'super-ready')
  }
  
  if (stunnedRef.current) {
    shooterClasses.push(styles.stunned || 'stunned')
  }
  
  // Agregar clases de animación (estas son dinámicas)
  if (shootClassRef.current === "der") {
    shooterClasses.push(styles.der || 'der')
  } else if (shootClassRef.current === "izq") {
    shooterClasses.push(styles.izq || 'izq')
  }
  
  if (superClassRef.current === "der-super") {
    shooterClasses.push(styles.derSuper || 'der-super')
  }

  shooterEl.className = shooterClasses.join(' ')
  shooterEl.style.left = shooter.x + "px"
  shooterEl.style.top = shooter.y + "px"
  // Expose logical hitbox visually for debugging
  if (typeof SHOW_HITBOX !== 'undefined' && SHOW_HITBOX) {
    shooterEl.style.width = (shooter.width || 40) + 'px'
    shooterEl.style.height = (shooter.height || 20) + 'px'
    shooterEl.style.boxSizing = 'border-box'
    shooterEl.style.outline = '2px dashed rgba(0,255,0,0.9)'
  }

  fragment.appendChild(shooterEl)

  // Renderizar invasores - CORREGIDO para CSS Modules
  // compute max column per row so we can highlight edge invaders
  const maxColByRow = {}
  invaders.forEach(iv => { maxColByRow[iv.row] = Math.max(maxColByRow[iv.row] || 0, iv.col) })

  invaders.forEach((invader) => {
    const invaderEl = document.createElement("div")
    
    // Construir clases de invasor
    let invaderClasses = [styles.invader]
    
    // Agregar tipo
    if (styles[invader.type]) {
      invaderClasses.push(styles[invader.type])
    }
    
    // Agregar clases de fila y columna (estas son dinámicas, usar fallback)
    invaderClasses.push(`row-${invader.row}`)
    invaderClasses.push(`col-${invader.col}`)
    
    // También agregar las clases con styles si existen
    if (styles[`row${invader.row}`]) {
      invaderClasses.push(styles[`row${invader.row}`])
    }
    if (styles[`col${invader.col}`]) {
      invaderClasses.push(styles[`col${invader.col}`])
    }

    // If invader is dying, apply tint class and small pre-death offset
  if (invader.dying) {
      if (styles.invaderHit) invaderClasses.push(styles.invaderHit)
      invaderEl.className = invaderClasses.join(' ')
      const offsetY = invader.preDeathOffset || 0
      invaderEl.style.transform = `translateY(${offsetY}px)`
    } else {
      invaderEl.className = invaderClasses.join(' ')
    }
    // Set position
    invaderEl.style.left = invader.x + "px"
    invaderEl.style.top = invader.y + "px"

    // Visualize hitbox using the logical width/height
    if (typeof SHOW_HITBOX !== 'undefined' && SHOW_HITBOX) {
      invaderEl.style.width = (invader.width || 40) + 'px'
      invaderEl.style.height = (invader.height || 24) + 'px'
      invaderEl.style.boxSizing = 'border-box'
      // Outline edge invaders differently to help debug which side triggers collisions
      if (invader.col === 0) {
        invaderEl.style.outline = '2px solid rgba(255,165,0,0.9)' // left edge - orange
      } else if (invader.col === maxColByRow[invader.row]) {
        invaderEl.style.outline = '2px solid rgba(255,0,0,0.9)' // right edge - red
      } else {
        invaderEl.style.outline = '1px dashed rgba(255,0,0,0.4)'
      }
    }
    fragment.appendChild(invaderEl)
  })

  // Renderizar láseres - CORREGIDO
  lasers.forEach((laser) => {
    const laserEl = document.createElement("div")
    laserEl.className = styles.laser || 'laser'
    laserEl.style.left = laser.x + "px"
    laserEl.style.top = laser.y + "px"
    laserEl.style.width = laser.width + "px"
    laserEl.style.height = laser.height + "px"
    fragment.appendChild(laserEl)
  })

  // Renderizar láseres enemigos - CORREGIDO
  enemyLasers.forEach((laser) => {
    const laserEl = document.createElement("div")
    laserEl.className = styles.enemyLaser || 'enemy-laser'
    laserEl.style.left = laser.x + "px"
    laserEl.style.top = laser.y + "px"
    laserEl.style.width = laser.width + "px"
    laserEl.style.height = laser.height + "px"
    fragment.appendChild(laserEl)
  })

  // Renderizar escudos CON BARRAS DE VIDA - CORREGIDO
  shields.forEach((shield) => {
    // Container for shield and health bar
    const shieldContainer = document.createElement("div")
    shieldContainer.className = styles.shieldContainer || 'shield-container'
  // Position by shield center and use translateX(-50%) so the container stays
  // horizontally centered regardless of parent layout/offsets (fixes mobile shift)
  const shieldCenterX = Math.round(shield.x + (shield.width || 0) / 2)
  shieldContainer.style.left = shieldCenterX + "px"
  shieldContainer.style.top = shield.y + "px"
  shieldContainer.style.transform = 'translateX(-50%)'

    // Shield health bar
    const healthBar = document.createElement("div")
    const healthPercentage = (shield.health / shield.maxHealth) * 100

    let healthClass = styles.shieldHealthBar || 'shield-health-bar'
    if (healthPercentage <= 25) {
      healthClass += ` ${styles.lowHealth || 'low-health'}`
    } else if (healthPercentage <= 60) {
      healthClass += ` ${styles.mediumHealth || 'medium-health'}`
    } else {
      healthClass += ` ${styles.highHealth || 'high-health'}`
    }

    healthBar.className = healthClass

    // Create individual health segments
    for (let i = 1; i <= shield.maxHealth; i++) {
      const segment = document.createElement("div")

      let segmentClasses = [styles.shieldHealthSegment || 'shield-health-segment']
      
      if (i <= shield.health) {
        if (shield.health <= 2) {
          segmentClasses.push(styles.critical || 'critical')
        } else if (shield.health <= 4) {
          segmentClasses.push(styles.damaged || 'damaged')
        } else {
          segmentClasses.push(styles.active || 'active')
        }
      } else {
        segmentClasses.push(styles.inactive || 'inactive')
      }

      segment.className = segmentClasses.join(' ')
      healthBar.appendChild(segment)
    }

    // Shield sprite
    const shieldEl = document.createElement("div")
    const damageLevel = Math.max(0, shield.maxHealth - shield.health)
    
    let shieldClasses = [styles.shield || 'shield']
    
    // Agregar grupo de escudo
    const shieldGroupClass = styles[`shieldGroup${shield.shieldGroup}`] || `shield-group-${shield.shieldGroup}`
    shieldClasses.push(shieldGroupClass)
    
    // Agregar nivel de daño
    const damageClass = styles[`damage${damageLevel}`] || `damage-${damageLevel}`
    shieldClasses.push(damageClass)
    
    shieldEl.className = shieldClasses.join(' ')
    shieldEl.style.width = shield.width + "px"
    shieldEl.style.height = shield.height + "px"
    if (typeof SHOW_HITBOX !== 'undefined' && SHOW_HITBOX) {
      shieldEl.style.boxSizing = 'border-box'
      shieldEl.style.outline = '2px solid rgba(0,0,255,0.8)'
    }

    // Add health bar first, then shield
    shieldContainer.appendChild(healthBar)
    shieldContainer.appendChild(shieldEl)
    fragment.appendChild(shieldContainer)
  })

  // Renderizar power-ups - CORREGIDO
  powerUps.forEach((powerUp) => {
    const powerUpEl = document.createElement("div")
    let powerUpClasses = [styles.powerUp || 'power-up']
    
    if (powerUp.type === "health") {
      powerUpClasses.push(styles.healthPickup || 'health-pickup')
    }
    
    powerUpEl.className = powerUpClasses.join(' ')
    powerUpEl.style.left = powerUp.x + "px"
    powerUpEl.style.top = powerUp.y + "px"
    fragment.appendChild(powerUpEl)
  })

  // Render special enemies
  gameDataRef.current.specialEnemies.forEach((se) => {
    const seEl = document.createElement('div')
    seEl.className = styles.specialEnemy || 'specialEnemy'
    seEl.style.left = se.x + 'px'
    seEl.style.top = se.y + 'px'
    // add state classes
    if (se.state) {
      seEl.dataset.state = se.state
    }
    // ensure freezer is visible even during preFire
    seEl.style.opacity = seEl.style.opacity || '1'
    fragment.appendChild(seEl)
  })

  // Render special spheres
  gameDataRef.current.specialSpheres.forEach((sp) => {
    const spEl = document.createElement('div')
    // build class list: base giantSphere plus any cumulative classes from sp.classes
    const baseClass = styles.giantSphere || 'giantSphere'
    const classList = [baseClass]
    if (Array.isArray(sp.classes) && sp.classes.length) {
      sp.classes.forEach((c) => {
        classList.push(styles[c] || c)
      })
    } else {
      // fallback: infer from stage (for compatibility)
      const inferred = (sp.stage === 'spawning' || sp.stage === 'growing') ? 'growing'
        : (sp.stage === 'ready') ? 'ready'
        : (sp.stage === 'launched') ? 'attacking'
        : null
      if (inferred) classList.push(styles[inferred] || inferred)
    }

    spEl.className = classList.join(' ')
  // position using horizontal center and bottom Y so we can scale from the bottom
  const centerX = Math.round((sp.x || 0) + (sp.width || 0) / 2)
  // Use spawnBottom as the fixed anchor during charging/ready so the sphere grows from that bottom.
  // But when the sphere is launched, use the dynamic sp.y (top) + height so it can fall smoothly.
  let bottomY
  if (sp.stage === 'launched' || sp.stage === 'launched' || sp.stage === 'attacking') {
    bottomY = Math.round((sp.y || 0) + (sp.height || 0))
  } else {
    bottomY = typeof sp._spawnBottom !== 'undefined' ? Math.round(sp._spawnBottom) : Math.round((sp.y || 0) + (sp.height || 0))
  }
  spEl.style.left = centerX + 'px'
  // place the element so its bottom aligns with the spawn bottom (or computed bottom)
  spEl.style.top = bottomY + 'px'
    spEl.style.width = (sp.width || 100) + 'px'
    spEl.style.height = (sp.height || sp.width || 100) + 'px'
  // translate so the element's bottom is at the top coordinate, and scale from bottom center
  spEl.style.transform = `translate(-50%, -100%) scale(${sp.scale || 1})`
  spEl.style.transformOrigin = '50% 100%'

  // z-index: keep the sphere behind the freezer while charging/ready so it visually appears above
  // (freezer has z-index:25 in CSS). When launched, raise the z-index so it overlaps other elements.
  if (sp.stage === 'charging' || sp.stage === 'ready') {
    spEl.style.zIndex = '10'
  } else if (sp.stage === 'launched' || sp.stage === 'launched' || sp.stage === 'attacking') {
    spEl.style.zIndex = '250'
  } else {
    spEl.style.zIndex = '200'
  }

    // if there is a desired grow duration, keep it as a CSS var for compatibility
    if (sp.spawnDuration) {
      spEl.style.setProperty('--sphere-grow-duration', (sp.spawnDuration || 2000) + 'ms')
    }

    fragment.appendChild(spEl)
  })

  // Renderizar super beams - CORREGIDO
  superBeams.forEach((beam) => {
    const beamEl = document.createElement("div")
    beamEl.className = styles.superBeam || 'super-beam'
    beamEl.style.left = beam.x + "px"
    beamEl.style.top = beam.y + "px"
    beamEl.style.width = beam.width + "px"
    beamEl.style.height = beam.height + "px"
    fragment.appendChild(beamEl)
  })

  // Renderizar explosiones - CORREGIDO
  invaders.forEach((invader) => {
    // Visual element (may be scaled via CSS). Keep visuals identical to before.
    const invaderVisual = document.createElement("div")
    let invaderClasses = [styles.invader]
    if (styles[invader.type]) invaderClasses.push(styles[invader.type])
    invaderClasses.push(`row-${invader.row}`)
    invaderClasses.push(`col-${invader.col}`)
    if (styles[`row${invader.row}`]) invaderClasses.push(styles[`row${invader.row}`])
    if (styles[`col${invader.col}`]) invaderClasses.push(styles[`col${invader.col}`])
    if (invader.dying && styles.invaderHit) invaderClasses.push(styles.invaderHit)
    invaderVisual.className = invaderClasses.join(' ')
    invaderVisual.style.left = invader.x + "px"
    invaderVisual.style.top = invader.y + "px"

    // Append visual invader element
    fragment.appendChild(invaderVisual)
  })

  // Finally attach the batched fragment to the DOM
  try {
    gameArea.appendChild(fragment)
  } catch (e) {
    // defensive: if append fails, log but don't throw to keep game loop alive
    console.warn('[RENDER] append fragment failed', e)
  }

}, [currentPlayer, superReady, spaceKeyState])

  const handleKeyUp = useCallback((e) => {
    keysRef.current[e.key] = false
    // Clear space key state when released
    if (e.key === " " || e.key === "Spacebar") {
      setSpaceKeyState('');
    }
  }, [])

  const handleKeyDown = useCallback((e) => {
    try {
      keysRef.current[e.key] = true

      // Admin secret key sequence
      const newSequence = (adminKeySequence || '') + e.key.toLowerCase();
      const targetSequence = "ginyurana";
      if (targetSequence.startsWith(newSequence)) {
        setAdminKeySequence(newSequence);
        if (newSequence === targetSequence) {
          setShowAdminPanel(true);
          setAdminKeySequence("");
        }
      } else {
        setAdminKeySequence("");
      }

      // Prevent navigation keys interfering
      if (e.key === "Tab" || e.key === "F6") {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      if (e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault()
        e.stopPropagation()
      }

      if (e.key === "ArrowUp") {
        shoot()
      }

      // Space key handling for Super attack
      if (e.key === " " || e.key === "Spacebar") {
        // Set visual state based on Super availability
        setSpaceKeyState(superReady[currentPlayer - 1] ? 'clicked' : 'denied');
        shootSuper()
      }
    } catch (err) {
      // defensive
    }
  }, [shoot, shootSuper, superReady, currentPlayer, adminKeySequence])

  const handleMobileMove = useCallback(
    (direction) => {
      if (gameState !== "playing") return
      keysRef.current[direction === "left" ? "ArrowLeft" : "ArrowRight"] = true
      setTimeout(() => {
        keysRef.current[direction === "left" ? "ArrowLeft" : "ArrowRight"] = false
      }, 100)
    },
    [gameState],
  )

  const handleMobileShoot = useCallback(() => {
    if (gameState !== "playing") return
    shoot()
  }, [gameState, shoot])

const handleMovePress = useCallback((direction) => {
  if (gameState !== "playing") return;
  const key = direction === "left" ? "ArrowLeft" : "ArrowRight";
  keysRef.current[key] = true;
}, [gameState]);

const handleMoveRelease = useCallback((direction) => {
  const key = direction === "left" ? "ArrowLeft" : "ArrowRight";
  keysRef.current[key] = false;
}, []);

const handleMobileSuper = useCallback(() => {
  if (gameState !== "playing") return;
  // Set visual state for mobile super press
  setSpaceKeyState(superReady[currentPlayer - 1] ? 'clicked' : 'denied');
  shootSuper();
  // Clear state after a short delay to match the visual feedback duration
  setTimeout(() => setSpaceKeyState(''), 100);
}, [gameState, shootSuper, superReady, currentPlayer]);

  // Play ButtonError when spaceKeyState becomes 'denied' (non-spamable)
  useEffect(() => {
    if (spaceKeyState === 'denied') {
      if (buttonErrorCooldownRef.current) return;
      buttonErrorCooldownRef.current = true;
      try {
        tryPlayAudio(buttonErrorRef, { clone: true }).catch(() => {})
      } catch (e) {}
      setTimeout(() => { buttonErrorCooldownRef.current = false }, 300);
    }
  }, [spaceKeyState]);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (gameState !== "playing") return

    let animationId
    const moveLoop = () => {
      if (keysRef.current["ArrowLeft"]) {
        moveShooter("left")
      }
      if (keysRef.current["ArrowRight"]) {
        moveShooter("right")
      }
      animationId = requestAnimationFrame(moveLoop)
    }

    moveLoop()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [gameState, moveShooter, adminKeySequence, showAdminPanel])

  // Declarar la función antes del useEffect
  const togglePauseMenu = useCallback(() => {
    if (gameState === "intro") return // no hacer nada si estamos en el menú o viendo intro

    const isPausing = !showPauseMenu
    setShowPauseMenu(isPausing)
    gameDataRef.current.isPaused = isPausing
    setGameState(isPausing ? "paused" : "playing")
  }, [showPauseMenu, gameState])

  // Remove duplicate handleVolumeChange declaration
  // ...existing code...

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
      })
    } else {
      document.exitFullscreen()
    }
  }
  useEffect(() => {
    return () => {
      if (shootAnimationRef.current) {
        clearTimeout(shootAnimationRef.current)
      }
    }
  }, [])
  // No automatic fail-safe: require the user to press any key/click to continue the transition.
  useEffect(() => {
  const handleResize = () => {
    // Actualizar estado de mobile
    setIsMobile(window.innerWidth <= 1024);
    
    // Solo reinicializar enemigos si el juego está en el menú
    if (gameState === 'intro') {
      const gameAreaElement = document.querySelector('.GameArea');
      if (gameAreaElement) {
        gameDataRef.current.gameAreaWidth = gameAreaElement.offsetWidth;
        gameDataRef.current.gameAreaHeight = gameAreaElement.offsetHeight;
      }
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [gameState]);

  // Manejo de teclas mantenidas presionadas optimizado
  useEffect(() => {
    if (gameState === "countdown" && !gameStarted) {
      setGameStarted(true) // marca que el juego arrancó
      // La música se iniciará cuando termine el countdown
    }
  }, [gameState, gameStarted])

  // Cuando entramos en countdown queremos ocultar y desmontar el área de juego
  useEffect(() => {
    if (gameState === 'countdown') {
      console.log('[DEBUG] effect: gameState changed to countdown -> setMountGame(false)')
      setMountGame(false)
    }
  }, [gameState])

  // Track whether we have intentionally started background music for this play session.
  // This prevents music from being started or unpaused from the initial `.gameMenu`.
  const musicStartedRef = useRef(false)
  
  // Referencias para los sonidos de Freezer
  const freezerSoundRefs = {
    sphereExpand: useRef(null),
    sphereLaunch: useRef(null),
    laugh: useRef(null)
  };

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      console.log('[DEBUG] Component unmounting - cleaning up...');
      // Cancel any pending animations
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      // Clear transition flags
      levelTransitionRef.current = false;
      suppressLevelCompletedRestoreRef.current = false;
      // Reset state refs
      gameDataRef.current.isPaused = true;
      stunnedRef.current = false;
      // Clear any remaining timeouts
      if (shootAnimationRef.current) clearTimeout(shootAnimationRef.current);
  if (superAnimationRef.current) clearTimeout(superAnimationRef.current);
      console.log('[DEBUG] Cleanup completed');
    };
  }, []);
  
  useEffect(() => {
    if (gameState !== "countdown" || countdown === null) return;

    console.log('[DEBUG] countdown effect - state:', gameState, 'countdown:', countdown);

    // Play countdown sound on change
    if (countdown > 0 && countdownSoundRef.current) {
      try {
        // Play a clone to allow overlapping
        tryPlayAudio(countdownSoundRef, { clone: true }).catch(() => {});
      } catch (e) {
        console.warn('[AUDIO] countdown sound play failed:', e);
      }
    }

    if (countdown > 0) {
      const timer = setTimeout(() => {
        console.log('[DEBUG] countdown tick ->', countdown);
        setCountdown(c => {
          if (c === null) return null; // protección contra actualizaciones después de limpieza
          return c - 1;
        });
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        console.log('[DEBUG] countdown timer cleared');
      };
    } else {
      // Secuencia controlada de inicio de juego
      const startGameSequence = async () => {
        try {
          console.log('[DEBUG] countdown reached 0 - starting game sequence');
          
          // 1. Limpiar el contador
          setCountdown(null);
          
          // 2. Preparar el área de juego
          setMountGame(true);
          setRemountKey(k => k + 1);
          
          // 3. Asegurar que el juego esté en estado limpio
          if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
          }
          gameDataRef.current.edgeSpeedBonus = 0;
          gameDataRef.current.isPaused = false;
          
          // 4. Iniciar música centralizada si corresponde
          if (!musicStartedRef.current) {
            musicStartedRef.current = true;
            try {
              // Attempt to resume WebAudio context if present
              if (audioContextRef.current && typeof audioContextRef.current.resume === 'function') {
                await audioContextRef.current.resume().catch(() => {});
              }
            } catch (e) {}
            // Do NOT call bgm.play(true) here. The centralized lifecycle effect
            // will start or resume playback based on gameState/countdown and
            // avoid starting music while still in menus.
          }
          
          // 5. Finalmente, forzar una re-medición/initialización ahora que el
          // área de juego se ha montado. Esto corrige el caso donde resetGame
          // fue llamado antes de que el DOM del gameArea existiera (primer
          // arranque). Hacemos la llamada en el siguiente frame para que
          // React haya completado el montaje.
          requestAnimationFrame(() => {
            try {
              // Use a non-full reset here to preserve the intention of the
              // original startGame() which already called resetGame(true)
              resetGame(false)
            } catch (e) {
              console.warn('[DBG] post-mount resetGame failed', e)
            }
          })

          // 6. Cambiar el estado del juego a playing
          setGameState("playing");
          console.log('[DEBUG] game sequence completed - now playing');
        } catch (error) {
          console.error('[DEBUG] Error in game start sequence:', error);
        }
      };

      startGameSequence();
    }
  }, [gameState, countdown]);

// Removed automatic fail-safe transition: user must press a key or tap to continue.
/* transitionTimerRef cleanup not needed - timers removed in favor of press-any-button effect */
  // Inicializar audios solo UNA VEZ
  useEffect(() => {
    // Create WebAudio context and master gain for reliable global volume/mute
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        audioContextRef.current = new AudioCtx()
        masterGainRef.current = audioContextRef.current.createGain()
        masterGainRef.current.gain.value = typeof volume === 'number' ? volume : 1
        masterGainRef.current.connect(audioContextRef.current.destination)
      }
    } catch (e) {
      console.warn('[AUDIO] WebAudio not available:', e)
    }

    // NOTE: Do NOT attach the centralized BGM element to this component's
    // AudioContext. That creates cross-context media element source conflicts
    // and has caused the BGM to stop when rapidly changing volume. Instead,
    // let the centralized bgm manager own the BGM element and control its
    // volume via bgm.setVolume(). Keep this component's masterGain for SFX
    // only and mirror the global volume by calling bgm.setVolume.
    try {
      const internal = bgm && bgm._internal ? bgm._internal : null;
      if (internal && internal.audio) {
        // Ensure the bgm manager has the correct volume; do not create
        // another MediaElementSource on the same HTMLAudioElement.
        try { bgm.setVolume(typeof volume === 'number' ? volume : 1); } catch (e) {}
      }
    } catch (e) {
      // ignore
    }

    const initAudio = (path) => {
      // Accept either a string path or an array of candidate paths
      const srcCandidates = Array.isArray(path) ? path.slice(0) : [path]

      const audio = new Audio()
      audio.preload = 'auto'
      audio.volume = 1
      audio._baseVolume = 1
      audio._available = false // set true once canplaythrough fired
      audio._attempts = 0

      // helper: try to set a candidate src and load
      const tryLoadCandidate = async (candidate) => {
        try {
          audio._attempts++
          // assign src then attempt to load. using assign then load avoids
          // some browser quirks where new Audio(path) throws or marks empty
          audio.src = candidate
          // Some servers might not send correct headers; attempt a HEAD fetch to pre-validate
          try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 2500)
            const res = await fetch(candidate, { method: 'HEAD', signal: controller.signal })
            clearTimeout(timeout)
            if (!res.ok) {
              console.warn('[AUDIO] HEAD check failed for', candidate, res.status)
              return false
            }
          } catch (err) {
            // HEAD may be blocked/cors; ignore but proceed to load anyway
          }

          // Setup temporary handlers for this candidate
          const onCan = () => {
            audio._available = true
            audio.removeEventListener('canplaythrough', onCan)
            audio.removeEventListener('error', onErr)
            console.log('[AUDIO] canplaythrough for', candidate)
          }
          const onErr = (ev) => {
            audio._available = false
            audio.removeEventListener('canplaythrough', onCan)
            audio.removeEventListener('error', onErr)
            console.warn('[AUDIO] error event for', candidate, ev)
          }

          audio.addEventListener('canplaythrough', onCan)
          audio.addEventListener('error', onErr)

          try {
            // try loading; some browsers require calling load explicitly
            audio.load()
          } catch (e) {
            console.warn('[AUDIO] load() threw for', candidate, e)
          }

          // Give it a short window to fire canplaythrough
          await new Promise((resolve) => setTimeout(resolve, 600))

          // if available now, success
          if (audio._available) return true
          // otherwise, remove handlers and return false to try next
          try { audio.removeEventListener('canplaythrough', onCan) } catch(e) {}
          try { audio.removeEventListener('error', onErr) } catch(e) {}
          return false
        } catch (err) {
          console.warn('[AUDIO] tryLoadCandidate threw for', candidate, err)
          return false
        }
      }

      // Try candidates sequentially with limited retries
      (async () => {
        for (let i = 0; i < srcCandidates.length; i++) {
          const c = srcCandidates[i]
          let ok = false
          // Try up to 2 times per candidate
          for (let attempt = 0; attempt < 2 && !ok; attempt++) {
            ok = await tryLoadCandidate(c)
            if (!ok) {
              // small backoff
              await new Promise(r => setTimeout(r, 250 * (attempt + 1)))
            }
          }
          if (ok) break
        }

        // If we still don't have availability, mark and keep the last src assigned
        if (!audio._available) {
          console.warn('[AUDIO] no available source found for', srcCandidates)
        }

        // If WebAudio available, attach source now (if possible)
        try {
          if (audioContextRef.current && masterGainRef.current && audio._available) {
            try {
              const src = audioContextRef.current.createMediaElementSource(audio)
              const baseGain = audioContextRef.current.createGain()
              baseGain.gain.value = audio._baseVolume
              src.connect(baseGain)
              baseGain.connect(masterGainRef.current)
              audio._sourceNode = src
              audio._baseGain = baseGain
            } catch (e) {
              console.warn('[AUDIO] createMediaElementSource failed for', audio.src, e)
            }
          }
        } catch (e) {
          console.warn('[AUDIO] WebAudio attach failed:', e)
        }
      })()

      // stall/error handlers
      audio.addEventListener('stalled', () => {
        console.warn('[AUDIO] stalled on', audio.src)
      })
      audio.addEventListener('emptied', () => {
        // sometimes browsers mark element emptied when source invalid
        console.warn('[AUDIO] emptied event for', audio.src)
      })

      // Enhance cloneNode to maintain behavior
      const originalCloneNode = audio.cloneNode.bind(audio)
      audio.cloneNode = function() {
        const clone = originalCloneNode(true)
        try { clone.preload = 'auto' } catch (e) {}
        try { clone.volume = 1 } catch (e) {}
        try { clone._baseVolume = audio._baseVolume } catch (e) {}
        try { clone.load() } catch (e) {}
        // Avoid attaching to audio context for clones here; clones will be
        // used transiently and master gain will still control if attached.
        return clone
      }

      return audio
    }

      const initAudioWithVolume = (path, baseVolume = 1) => {
        const audio = initAudio(path);
        audio._baseVolume = baseVolume;
        // Update base gain if it exists
        if (audio._baseGain) {
          audio._baseGain.gain.value = baseVolume;
        }
        return audio;
      };

  // Sonidos base del juego
  // Use the BackgroundMusic folder where BattleMusic.mp3 actually lives
  // Background music handled centrally by `bgm` adapter; do not create a local element here.
    superSoundRef.current = initAudio("/sounds/SuperSound.wav");
      shootSoundRef.current = initAudioWithVolume("/sounds/ki2.mp3", 1); // 60% del volumen base
    senzuSoundRef.current = initAudio("/sounds/Senzu.wav");
    playerDamageSoundRef.current = initAudio("/sounds/BardockAh.mp3");
    playerHitSoundRef.current = initAudio("/sounds/damage.wav");
    countdownSoundRef.current = initAudio("/sounds/Countdown.mp3");
  // SpaceInvaders specific SFX
  superChargedRef.current = initAudio("/sounds/SpaceInvadersSounds/SuperCharged.mp3");
  buttonErrorRef.current = initAudio("/sounds/SpaceInvadersSounds/ButtonError.mp3");
  alienHitRef.current = initAudio("/sounds/SpaceInvadersSounds/AlienHit.mp3");
  // Make these slightly louder by increasing their base gain (>1)
  kiHitRef.current = initAudioWithVolume("/sounds/SpaceInvadersSounds/KiHit.mp3", 1.5);
  senzuEatenRef.current = initAudioWithVolume("/sounds/SpaceInvadersSounds/SenzuEaten.mp3", 1.4);
  senzuEmptyRef.current = initAudioWithVolume("/sounds/SpaceInvadersSounds/SenzuEmpty.mp3", 1.4);
    
    // Inicializar los sonidos de Freezer
    console.log('[AUDIO] Initializing Freezer sounds...');
    
    try {
      // Inicializar cada sonido y asignarlo a su referencia
      freezerSoundRefs.sphereExpand.current = initAudio("/sounds/DeathBallExpand.mp3");
      console.log('[AUDIO] sphereExpand initialized:', freezerSoundRefs.sphereExpand.current ? 'OK' : 'Failed');

      freezerSoundRefs.sphereLaunch.current = initAudio("/sounds/DeathBallAttack.mp3");
      console.log('[AUDIO] sphereLaunch initialized:', freezerSoundRefs.sphereLaunch.current ? 'OK' : 'Failed');

      freezerSoundRefs.laugh.current = initAudio("/sounds/FreezerLaugh.mp3");
      const laughInitResult = freezerSoundRefs.laugh.current ? 'OK' : 'Failed';
      console.log('[AUDIO] laugh initialized:', laughInitResult);
      
      // Asegurarse de que el sonido está conectado al master gain
      if (freezerSoundRefs.laugh.current) {
        try {
          if (audioContextRef.current && masterGainRef.current && !freezerSoundRefs.laugh.current._sourceNode) {
            const src = audioContextRef.current.createMediaElementSource(freezerSoundRefs.laugh.current);
            src.connect(masterGainRef.current);
            freezerSoundRefs.laugh.current._sourceNode = src;
          }
        } catch (e) {
          console.warn('[AUDIO] Failed to connect Freezer laugh to master gain:', e);
        }
      } else {
        console.warn('[AUDIO] Failed to initialize Freezer laugh sound!');
      }
      
    } catch (e) {
      console.error('[AUDIO] Error initializing Freezer sounds:', e);
    }
    
    // Almacenar las referencias en gameDataRef para acceso global
    gameDataRef.current.freezerSoundRefs = freezerSoundRefs;

    // Some browsers block audio playback until a user gesture; attempt to unlock on first interaction
    // IMPORTANT: do NOT start background music here. We only want to "unlock" audio decoding so
    // later programmatic play() (after countdown) is allowed. We try to play once and immediately pause
    // so the audio is unlocked but not audible.
    const resumeOnInteraction = () => {
      try {
        // We intentionally avoid marking musicStartedRef here. This ensures the music cannot be
        // started/unpaused from the initial `.gameMenu` by accidental interactions or keyboard shortcuts.
        // Unlock audio system by attempting a short start/stop of the centralized bgm
        try {
          // Try to resume AudioContext if available
          if (audioContextRef.current && typeof audioContextRef.current.resume === 'function') {
            audioContextRef.current.resume().catch(() => {});
          }
        } catch (e) {}
        try {
          // Initialize the centralized BGM subsystem to "unlock" audio decoding
          // in some browsers without actually starting playback. Do NOT start
          // a track here to avoid accidental music during menu interactions.
          bgm.init();
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }

      // Resume AudioContext if present (some browsers require a user gesture)
      try {
        if (audioContextRef.current && typeof audioContextRef.current.resume === 'function') {
          audioContextRef.current.resume().catch(() => {})
        }
      } catch (e) {
        // ignore
      }

      document.removeEventListener('pointerdown', resumeOnInteraction)
      document.removeEventListener('keydown', resumeOnInteraction)
    }
    document.addEventListener('pointerdown', resumeOnInteraction)
    document.addEventListener('keydown', resumeOnInteraction)
  }, []) // <-- vacío, se ejecuta solo una vez

  // Main game loop driver - ensure defined before effect that starts it
  const gameLoop = useCallback((startTs) => {
    // seed the lastFrameTime so delta calculation is sane on first frame
    lastFrameTime.current = typeof startTs === 'number' ? startTs : performance.now()

    const step = (now) => {
      try {
        const delta = now - (lastFrameTime.current || now)
        lastFrameTime.current = now
        // update game state and render; protect each to avoid stopping loop
        try {
          updateGame(delta)
        } catch (e) {
          console.warn('[GAMELOOP] updateGame error', e)
        }
        try {
          render()
        } catch (e) {
          console.warn('[GAMELOOP] render error', e)
        }
      } catch (err) {
        console.error('[GAMELOOP] unexpected error', err)
      }

      gameLoopRef.current = requestAnimationFrame(step)
    }

    // start the RAF-driven loop
    gameLoopRef.current = requestAnimationFrame(step)
  }, [updateGame, render])

  // Este efecto se asegura de que el volumen se aplique a todos los audios,
  // incluso los que se crean después de la inicialización
  useEffect(() => {
    if (typeof volume !== 'number') return;
    // Update WebAudio master gain if available
    try {
      if (masterGainRef.current && typeof masterGainRef.current.gain !== 'undefined') {
        masterGainRef.current.gain.value = volume
      }
    } catch (e) {
      console.warn('[AUDIO] Failed to update master gain:', e)
    }

    // Also ensure existing HTMLAudioElements reflect muted state as a fallback
    const audioRefs = [startSoundRef, superSoundRef, shootSoundRef, senzuSoundRef, playerDamageSoundRef, playerHitSoundRef, countdownSoundRef,
      superChargedRef, buttonErrorRef, alienHitRef, kiHitRef, senzuEatenRef, senzuEmptyRef]
    audioRefs.forEach(ref => {
      if (ref.current) {
        try {
          // keep element volume at 1 and use master gain; but set muted when volume === 0 to be defensive
          ref.current.muted = volume === 0
        } catch (e) {
          console.warn('[AUDIO] Failed to set muted on element:', e)
        }
      }
    })
    
    // Also update freezer sounds
    Object.values(freezerSoundRefs).forEach(ref => {
      if (ref?.current) {
        try {
          // keep element volume at 1 and use master gain; but set muted when volume === 0 to be defensive
          ref.current.volume = 1;
          ref.current.muted = volume === 0;
        } catch (e) {
          console.warn('[AUDIO] Failed to set freezer sound volume:', e)
        }
      }
    });

    // If there's a video for super, update its muted state too
    if (superVideoRef.current) {
      try {
        superVideoRef.current.muted = volume === 0
      } catch (e) {
        console.warn('[AUDIO] Failed to set video muted:', e)
      }
    }
  }, [volume]);

  useEffect(() => {
    if (gameState !== "playing") return

    const interval = setInterval(() => {
      if (keysRef.current["ArrowLeft"]) {
        moveShooter("left")
      }
      if (keysRef.current["ArrowRight"]) {
        moveShooter("right")
      }
    }, 10) // ~83fps para movimiento suave

    return () => clearInterval(interval)
  }, [gameState, moveShooter])

  // When a super orb becomes ready (off -> on), play SuperCharged
  useEffect(() => {
    try {
      // Compare previous and current arrays
      const prev = prevSuperReadyRef.current || [false, false]
      if (Array.isArray(superReady)) {
        for (let idx = 0; idx < superReady.length; idx++) {
          if (!prev[idx] && superReady[idx]) {
            // Became ready
            tryPlayAudio(superChargedRef, { clone: true }).catch(() => {})
          }
        }
      }
      prevSuperReadyRef.current = [...(superReady || [])]
    } catch (e) {
      // ignore
    }
  }, [superReady])

  useEffect(() => {
    if (superVideoRef.current) {
      superVideoRef.current.volume = volume
    }
  }, [volume]) // This effect runs whenever the volume state changes

  // Ensure the super video respects the current volume and auto-plays when shown
  useEffect(() => {
    const vid = superVideoRef.current
    if (!vid) return

    if (showSuperVideo) {
      try {
        vid.volume = volume
        vid.currentTime = 0
        const playPromise = vid.play()
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.catch((e) => {
            console.warn('Super video play failed:', e)
          })
        }
      } catch (e) {
        console.warn('Error starting super video:', e)
      }
    } else {
      try {
        vid.pause()
        vid.currentTime = 0
      } catch (e) {
        // ignore
      }
    }
  }, [showSuperVideo, volume])

  // Efecto para actualizar el volumen de la música
  useEffect(() => {
    try {
      if (masterGainRef.current && typeof masterGainRef.current.gain !== 'undefined') {
        masterGainRef.current.gain.value = volume
      }
      try { bgm.setVolume(volume); } catch (e) {}
    } catch (e) {
      console.warn('[AUDIO] Failed to update music volume:', e)
    }
  }, [volume])

  // Limpieza del timeout de seguridad del super video al desmontar
  useEffect(() => {
    return () => {
      if (superVideoTimeoutRef.current) {
        clearTimeout(superVideoTimeoutRef.current)
        superVideoTimeoutRef.current = null
      }
    }
  }, [])

  // Efectos
  useEffect(() => {
    const handleKeyDownGlobal = (e) => handleKeyDown(e)
    const handleKeyUpGlobal = (e) => handleKeyUp(e)

    window.addEventListener("keydown", handleKeyDownGlobal)
    window.addEventListener("keyup", handleKeyUpGlobal)

    return () => {
      window.removeEventListener("keydown", handleKeyDownGlobal)
      window.removeEventListener("keyup", handleKeyUpGlobal)
    }
  }, [handleKeyDown, handleKeyUp])

  // Admin actions exposed to AdminPanel
  const handleAdminLevelUp = useCallback(() => {
    try {
      // Allow admin to force a level transition even if the game isn't in the
      // normal 'playing' state. levelUp accepts a `force` flag to bypass the
      // gameState check.
      levelUp(true)
    } catch (e) {
      console.warn('Admin levelUp failed', e)
    }
  }, [levelUp])

  const handleAdminIncreaseSpeed = useCallback(() => {
    try {
      // Increase base invader speed by 25% (persistent across edge hits)
      const curBase = gameDataRef.current.baseInvaderSpeed || gameDataRef.current.invaderSpeed || 1
      gameDataRef.current.baseInvaderSpeed = curBase * 1.25
      // Reset edge bonus to avoid accidental overwrite
      gameDataRef.current.edgeSpeedBonus = 0
      // Also increase drop speed moderately
      gameDataRef.current.invaderDropSpeed = Math.round((gameDataRef.current.invaderDropSpeed || 45) * 1.1)
      console.log('Admin increased base invader speed to', gameDataRef.current.baseInvaderSpeed)
    } catch (e) {
      console.warn('Admin increase speed failed', e)
    }
  }, [])

  // Admin: spawn a special enemy immediately (for testing)
  const handleAdminSpawnSpecial = useCallback(() => {
    try {
      if (gameDataRef.current.freezerActive) {
        console.log('Freezer already active; admin spawn ignored')
        return
      }
      const side = gameDataRef.current.specialSideToggle % 2 === 0 ? 'left' : 'right'
      gameDataRef.current.specialSideToggle++
      const gaW = gameDataRef.current.gameAreaWidth || (window.innerWidth * 0.8)
      const gaH = gameDataRef.current.gameAreaHeight || (window.innerHeight * 0.8)
      const startX = side === 'left' ? -80 : gaW + 80
      const y = 20 + Math.random() * Math.max(10, gaH * 0.12)
      const sweepTargetX = side === 'left' ? Math.round(gaW * 0.85) : Math.round(gaW * 0.15)
      gameDataRef.current.specialEnemies.push({ x: startX, y, vx: computeSpecialVx(side === 'left' ? 1 : -1, 'sweep'), side, sweepTargetX, state: 'sweeping' })
      gameDataRef.current.freezerActive = true
      console.log('Admin spawned Freezer at', startX, y)

      // Play the Freezer laugh sound the same way natural spawns do so admin
      // spawns behave identically (resume audio context if needed and clone).
      try {
        console.log('[AUDIO] Admin: Attempting to play Freezer laugh...');
        if (freezerSoundRefs.laugh?.current) {
          const playLaugh = async () => {
            try {
              if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
              }
              await tryPlayAudio(freezerSoundRefs.laugh, { clone: true });
            } catch (e) {
              console.warn('[AUDIO] Error playing Freezer laugh (admin):', e);
            }
          };
          playLaugh();
        } else {
          console.warn('[AUDIO] Freezer laugh ref not found (admin)!');
        }
      } catch (e) {
        console.warn('[AUDIO] Admin spawn laugh play failed:', e);
      }
    } catch (e) {
      console.warn('Failed to spawn special enemy via admin', e)
    }
  }, [])

  useEffect(() => {
    if (gameState === "playing") {
      lastFrameTime.current = performance.now()
      console.log('[DEBUG] game loop starting (gameState=playing)')
      gameLoop(lastFrameTime.current)
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Control background music: only play/stop when the game's mount state changes.
  // NOTE: previously this effect also depended on `volume`, which caused React to run
  // the cleanup (calling bgm.stop()) on every volume change — that's what made the
  // music stop when the pause menu slider moved. Split responsibilities so volume
  // changes only update the volume (handled by a separate effect above) and this
  // effect only manages play/resume/stop around mounting.
  useEffect(() => {
    try {
      if (musicStartedRef.current && mountGame) {
        // Ensure music is resumed when the game mounts and we've started music.
        // Do NOT react to `musicMuted` here; muting/unmuting is handled by
        // the explicit toggle handler so we avoid stopping the playback
        // when the user simply toggles mute.
        try { bgm.resume(); } catch (e) {}
      } else {
        // If music was never started or the game is unmounted, ensure stop/reset.
        try { bgm.stop(); } catch (e) {}
      }
    } catch (e) {
      // ignore
    }

    // Cleanup: stop BGM when the component unmounts or mountGame toggles to false.
    return () => {
      try { bgm.stop(); } catch (e) {}
    }
  }, [mountGame])

  // Pause game loop and input while level completed overlay is visible
  useEffect(() => {
    if (showLevelCompleted) {
      // store previous paused state
      const prevPaused = gameDataRef.current.isPaused
      gameDataRef.current.isPaused = true
      setGameState((gs) => (gs === 'playing' ? 'paused' : gs))

      // prevent super from being used by making superReady false temporarily
      const prevSuperReady = [...superReady]
      setSuperReady([false, false])

      return () => {
        // If a level transition is suppressing the automatic restore, skip forcing gameState
        if (suppressLevelCompletedRestoreRef.current) {
          // clear the suppression flag and exit cleanup early
          suppressLevelCompletedRestoreRef.current = false
          // still restore paused state and superReady
          gameDataRef.current.isPaused = prevPaused
          setSuperReady(prevSuperReady)
          return
        }

        // restore previous paused state
        gameDataRef.current.isPaused = prevPaused
        // restore superReady
        setSuperReady(prevSuperReady)
        // if we restored to playing, ensure gameState is set back
        if (!gameDataRef.current.isPaused && mountGame) {
          setGameState('playing')
        }
      }
    }
  }, [showLevelCompleted, mountGame])

  // Funciones de interfaz
  const startGame = (playerCount, name1 = 'Jugador 1', name2 = 'Jugador 2') => {
    setPlayers(playerCount)
    setPlayer1Name(name1)
    setPlayer2Name(name2)
    setGamePhase(playerCount === 2 ? "player1" : "intro")
    resetGame(true) // FULL RESET para iniciar juego
    // Iniciar directamente el countdown
    setCountdown(3)
    setGameState("countdown")
  }

  // Funciones del menú expandible
  const handleSelect = (mode) => {
    if (selecting === mode) {
      return; // Ya está seleccionado
    }
    
    playOpenSound();
    setSelecting(mode);
    setPlayer1Name('');
    setPlayer2Name('');
    setNameError('');
    setShowSelectorContent(false);
    setTimeout(() => setShowSelectorContent(true), 100);
  };

  const handlePlayGuest = () => {
    playSelectedSound();
    if (selecting === 'single') {
      startGame(1, 'Bardock');
    } else {
      startGame(2, 'Jugador 1', 'Jugador 2');
    }
    setSelecting(null);
  };

  const handlePlay = () => {
    if (selecting === 'single') {
      if (!player1Name.trim()) {
        setNameError('Por favor ingresa un nombre');
        return;
      }
      playSelectedSound();
      startGame(1, player1Name.trim());
    } else {
      if (!player1Name.trim() || !player2Name.trim()) {
        setNameError('Por favor ingresa ambos nombres');
        return;
      }
      // Validar que los nombres no sean iguales
      if (player1Name.trim().toLowerCase() === player2Name.trim().toLowerCase()) {
        setNameError('No pueden jugar dos personas con un mismo nombre.');
        return;
      }
      startGame(2, player1Name.trim(), player2Name.trim());
    }
    setSelecting(null);
  };

  const handleExit = (e) => {
    e.stopPropagation();
    playCloseSound();
    setSelecting(null);
    setPlayer1Name('');
    setPlayer2Name('');
    setNameError('');
    setShowSelectorContent(false);
  };

  const backToMenu = () => {
    onBack();
    setShowGameOverForm(false)
    setGameStarted(false) // Resetear flag de juego iniciado
    // Intro video eliminado
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
    try { bgm.stop(); } catch (e) {}
  }
  const handleUniversalGameOverSubmit = (formData) => {
    // Lógica para procesar el envío del formulario del UniversalGameOver
    console.log('Game Over Form Data:', formData)
    
    setShowGameOverForm(false)
    if (players === 2) {
      resetMultiplayerGame()
    }
    backToMenu()
  }

  const handleUniversalGameOverSkip = () => {
    setShowGameOverForm(false)
    if (players === 2) {
      resetMultiplayerGame()
    }
    backToMenu()
  }

  // En el componente SpaceInvaders
  // Intro video removido: ya no hay handlers relacionados

  // Render del componente
  return (
    <div className={styles.spaceContainer}>
      <Nube />      
      <AdminPanel
        showPanel={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        gameState={gameState}
        players={players}
        currentPlayer={currentPlayer}
        score={score}
        lives={lives}
        onForceWin={adminForceWin}
        onForceLose={adminForceLose}
        onAddLife={adminAddLife}
        onRemoveLife={adminRemoveLife}
        onAddScore={adminAddScore}
        onEnableSuper={adminEnableSuper}
        onClearAliens={adminClearAllAliens}
        onLevelUp={handleAdminLevelUp}
        onIncreaseSpeed={handleAdminIncreaseSpeed}
        onSpawnSpecialEnemy={handleAdminSpawnSpecial}
      />
      
      <PauseMenu
  showPauseButton={gameState === 'playing'}
  showPauseMenu={showPauseMenu}
  onRequestClose={togglePauseMenu}
  gameState={gameState}
  volume={volume}
  onTogglePause={togglePauseMenu}
  onBackToMenu={onBack}
  onToggleFullScreen={toggleFullScreen}
  onResetGame={resetCurrentGame}
  onVolumeChange={handleVolumeChange}
  musicMuted={musicMuted}
  onToggleMusic={handleToggleMusic}
  enableEsc={gameState === 'playing' || gameState === 'paused'} // Habilitar ESC durante juego y pausa
  onBackToPlayerSelect={() => {
    setShowPauseMenu(false);
    setGameState('intro');
    try { bgm.stop(); } catch (e) {}
  }}
/>      {/* MENÚ INICIAL */}
  {gameState === "intro" && (
        <div className={styles.gameMenu}>
          <button
            onClick={onBack}
            className="backBtn"
            title="Volver al lobby"
          >
          </button>
          <div className={styles.menuContainer}>
            <div className={styles.Titles}>
              <h1 className={styles.gameTitle}><span>SPACE</span> <span>INVADERS</span></h1>
              <h2 className={styles.gameSubtitle}>La Batalla Final de Bardock</h2>
            </div>
            <div className={styles.BardockMenu}/>
            <div className={styles.menuOptions}>
              <div
                className={`${styles.menuButton} ${styles.singlePlayer} ${selecting === 'single' ? styles.expandedButton : ''}`}
                onClick={() => handleSelect('single')}
                style={{ cursor: 'pointer', position: 'relative', zIndex: selecting === 'single' ? 2 : 1 }}
              >
                {selecting !== 'single' && <i className={`${styles.player1Icon} ${styles.playersIcon}`}></i>}
                {selecting !== 'single' && '1 JUGADOR'}
                <div className={`${styles.nameSelectorContent} ${selecting === 'single' && showSelectorContent ? styles.active : ''}`}>
                  <input
                    type="text"
                    className={`${styles.nameInput} ${styles.SelectButton}`}
                    placeholder="Nombre del jugador"
                    value={player1Name}
                    onChange={e => setPlayer1Name(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePlay();
                      }
                    }}
                    maxLength={15}
                  />
                  <button
                    className={`${styles.guestButton} ${styles.SelectButton}`}
                    style={{ width: '100%' }}
                    onClick={(e) => { e.stopPropagation(); handlePlayGuest(); }}
                  >
                    Jugar como invitado
                  </button>
                  <div className={styles.actionButtons}>
                    <button
                      className={`${styles.playButton} ${styles.SelectButton}`}
                      style={{ width: '100%' }}
                      onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                      disabled={!player1Name.trim()}
                    >
                      Jugar
                    </button>
                    <button
                      className={`${styles.exitButton} ${styles.SelectButton}`}
                      style={{ width: '100%' }}
                      onClick={handleExit}
                    >
                      Salir
                    </button>
                  </div>
                  {nameError && <div className={styles.errorMsg}>{nameError}</div>}
                </div>
              </div>
              <div
                className={`${styles.menuButton} ${styles.multiPlayer} ${selecting === 'multi' ? styles.expandedButton : ''}`}
                onClick={() => handleSelect('multi')}
                style={{ cursor: 'pointer', position: 'relative', zIndex: selecting === 'multi' ? 2 : 1 }}
              >
                {selecting !== 'multi' && <i className={`${styles.player2Icon} ${styles.playersIcon}`}></i>}
                {selecting !== 'multi' && '2 JUGADORES'}
                <div className={`${styles.nameSelectorContent} ${selecting === 'multi' && showSelectorContent ? styles.active : ''}`}>
                  <input
                    type="text"
                    className={`${styles.nameInput} ${styles.SelectButton}`}
                    placeholder="Nombre Jugador 1"
                    value={player1Name}
                    onChange={e => setPlayer1Name(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Si hay texto en input 1, mover al input 2
                        if (player1Name.trim()) {
                          const input2 = e.target.parentElement.querySelector('input[placeholder="Nombre Jugador 2"]');
                          if (input2) {
                            input2.focus();
                          }
                        }
                      }
                      // Navegación con flechas
                      else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const input2 = e.target.parentElement.querySelector('input[placeholder="Nombre Jugador 2"]');
                        if (input2) {
                          input2.focus();
                        }
                      }
                    }}
                    maxLength={15}
                  />
                  <input
                    type="text"
                    className={`${styles.nameInput} ${styles.SelectButton}`}
                    placeholder="Nombre Jugador 2"
                    value={player2Name}
                    onChange={e => setPlayer2Name(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Si hay texto en input 2 pero no en input 1, mover al input 1
                        if (player2Name.trim() && !player1Name.trim()) {
                          const input1 = e.target.parentElement.querySelector('input[placeholder="Nombre Jugador 1"]');
                          if (input1) {
                            input1.focus();
                          }
                        } 
                        // Si ambos tienen texto, enviar
                        else if (player1Name.trim() && player2Name.trim()) {
                          handlePlay();
                        }
                      }
                      // Navegación con flechas
                      else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const input1 = e.target.parentElement.querySelector('input[placeholder="Nombre Jugador 1"]');
                        if (input1) {
                          input1.focus();
                        }
                      }
                    }}
                    maxLength={15}
                  />
                  <button
                    className={`${styles.guestButton} ${styles.SelectButton}`}
                    style={{ width: '100%' }}
                    onClick={(e) => { e.stopPropagation(); handlePlayGuest(); }}
                  >
                    Jugar como invitado
                  </button>
                  <div className={styles.actionButtons}>
                    <button
                      className={`${styles.playButton} ${styles.SelectButton}`}
                      style={{ width: '100%' }}
                      onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                      disabled={!player1Name.trim() || !player2Name.trim()}
                    >
                      Jugar
                    </button>
                    <button
                      className={`${styles.exitButton} ${styles.SelectButton}`}
                      style={{ width: '100%' }}
                      onClick={handleExit}
                    >
                      Salir
                    </button>
                  </div>
                  {nameError && <div className={styles.errorMsg}>{nameError}</div>}
                </div>
              </div>
            </div>
            
            <div className={styles.menuControls}>
              <p>Controles:</p>
              <p>← → Mover | ↑ Disparar | ESPACIO Súper Ataque</p>
            </div>
          </div>
        </div>
      )}

      {/* Intro video eliminado: iniciamos el countdown directamente al empezar el juego */}

      {showSuperVideo && (
        <div className={styles.superVideoContainer}>
          <video
            ref={superVideoRef}
            autoPlay
            onEnded={handleSuperVideoEnd}
            onError={(e) => {
              console.warn('[SUPER] Error en video del super ataque:', e)
              handleSuperVideoEnd() // Forzar cierre si hay error
            }}
            onAbort={(e) => {
              console.warn('[SUPER] Video del super ataque abortado:', e)
              handleSuperVideoEnd() // Forzar cierre si se aborta
            }}
            className={styles.superVideo}
            src="/videos/BardockSuper.mp4"
            playsInline
            muted={false}
          />
        </div>
      )}

      {/* HUD persistent: Nivel y Countdown deben permanecer visibles durante reset/level-up */}
      {(gameState === "countdown" || gameState === "playing" || gameState === "paused" || gameState === "gameOver") && (
        <div className={styles.persistentHud}>
          {gameState !== "countdown" && (
            <div className={styles.levelIndicatorPersist}>
              <div className={styles.levelText}>
                Nivel: <span className={styles.levelNumber}>{level}</span>
              </div>
              {players === 2 && (
                <div className={styles.playerText}>
                  {currentPlayer === 1 
                    ? (player1Name || 'Jugador 1')
                    : (player2Name || 'Jugador 2')
                  }
                </div>
              )}
            </div>
          )}
          {gameState === "countdown" && <div className={styles.countdown}>{countdown}</div>}
        </div>
      )}

      {/* Juego y otros HUDs se montan/desmontan aquí (game area) */}
      {(mountGame && (gameState === "countdown" || gameState === "playing" || gameState === "paused" || gameState === "gameOver")) && (
        <div key={remountKey} className={styles.gameContainer}>
          <div className={styles.ship}></div>
          
          {/* HUD (detalles dentro del juego) - level indicator moved to persistentHud */}
          <div className={styles.info}>
            <div className={styles.gameIndicators}>
              {/* levelIndicator removed (now persistent) */}
            </div>
            <div className={styles.scorelives}>
              <div className={styles.score}>
                <p>Puntaje:</p>
                <span>{score[currentPlayer - 1]}</span>
              </div>

              {/* Player label: show in singleplayer (guest -> Bardock or chosen name) and in multiplayer show JUGADOR X or chosen name */}
              {(() => {
                let label = ''
                if (players === 1) {
                  // if player1Name is empty or guest, show Bardock
                  const name = (player1Name && player1Name.trim()) ? player1Name.trim() : 'Bardock'
                  label = name
                } else if (players === 2) {
                  // Prefer explicit player names if set; else fallback to JUGADOR X
                  if (currentPlayer === 1) {
                    label = (player1Name && player1Name.trim()) ? player1Name.trim() : 'JUGADOR 1'
                  } else {
                    label = (player2Name && player2Name.trim()) ? player2Name.trim() : 'JUGADOR 2'
                  }
                }

                return (
                  <div className={styles.playerTurn}>{label}</div>
                )
              })()}

                <div
                  className={`${styles.livesBar} ${
                  lives[currentPlayer - 1] <= 1
                    ? styles.lowLives
                    : !hasLostInitialLife[currentPlayer - 1]
                      ? styles.goodLives
                      : ""
                }`}
              >
                {[1, 2, 3, 4, 5].map((i) => {
                  const currentLives = lives[currentPlayer - 1] || 0
                  const hasLife = i <= currentLives
                  // color state applies when the slot is an active life
                  const colorClass = hasLife
                    ? (currentLives === 1 ? styles.red : currentLives === 2 ? styles.yellow : styles.active)
                    : styles.inactive
                  // Apply vidainactiva only to the two extra slots (4 and 5) when inactive
                  const inactiveVidaclass = !hasLife && i > 3 ? styles.vidainactiva : ""
                  return (
                    <div
                      key={i}
                      className={`${styles.life} ${colorClass} ${inactiveVidaclass}`}
                    />
                  )
                })}
              </div>
            </div>

            <div className={styles.alienCounters}>
              <div className={styles.alienCounter}>
                <div className={`${styles.alienIcon} ${styles.type3}`}></div>
                <span className={styles.alienCount}>{alienCounts.type3}</span>
              </div>
              <div className={styles.alienCounter}>
                <div className={`${styles.alienIcon} ${styles.type2}`}></div>
                <span className={styles.alienCount}>{alienCounts.type2}</span>
              </div>
              <div className={styles.alienCounter}>
                <div className={`${styles.alienIcon} ${styles.type1}`}></div>
                <span className={styles.alienCount}>{alienCounts.type1}</span>
              </div>
            </div>

            <div className={styles.super}>
                           <span className={styles.superPoints}>
                {score[currentPlayer - 1] < 2000
                  ? `${2000 - score[currentPlayer - 1]} pts`
                  : superReady[currentPlayer - 1]
                    ? "LISTO"
                    : "COOLDOWN"}
                </span>
              <div className={`${styles.superOrb} ${!superReady[currentPlayer - 1] ? styles.off : ""}`}></div>
              <div className={styles.superStatus}>
                <span className={`${styles.optionLabel} ${spaceKeyState ? styles[spaceKeyState] : ''}`}>ESPACIO</span>

              </div>
            </div>
          </div>

          {/* Game Area */}
          <div className={styles.gameAreaWrapper}>
            <div 
              className={`${styles.gameArea} ${gameStarted ? styles.gameAreaStarted : ""}`} 
              ref={gameAreaRef}
            ></div>
          </div>

          <div className={styles.controls}>
            <p>CONTROLES: ← → mover, ↑ disparar, ESPACIO súper (cada 2000 pts + cooldown)</p>
            <p style={{ fontSize: "12px", color: "#aaa", marginTop: "5px" }}>
              Semillas dan +1 vida | Intercepta disparos enemigos para +300 pts | Súper no da puntos
            </p>
          </div>
          
          {/* countdown overlay moved to persistentHud so it remains visible while game area is unmounted */}
        </div>
      )}

      {/* Overlay de nivel completado estilo SimonDice */}
      {showLevelCompleted && (
        <div className={simonStyles.levelCompletedScreen}>
          <div className={simonStyles.levelCompletedContent}>
            <h1>¡Nivel {levelCompletedInfo.prev} Completado!</h1>
            <p className={simonStyles.transitionText}>Pasando al nivel {levelCompletedInfo.next}</p>
          </div>
        </div>
      )}

      {/* PANTALLA DE TRANSICIÓN */}
      {showPlayerTransition && gameState === "playerTransition" && (
        <div className={styles.playerTransitiona}>
          <div className={styles.transitionContent}>
            <h2>¡Fin del turno de {player1Name}!</h2>
            <p>Es turno de {player2Name}</p>
            <p className={styles.continueText}>{!isMobile ? 'Presiona cualquier botón para continuar' : 'Presiona para continuar'}</p>
          </div>
        </div>
      )}

      {/* Mostrar formulario de game over */}
      {showGameOverForm && gamePhase === "bothComplete" && (
        <div>
          <MultiplayerGameOver
            gameType="spaceinvaders"
            score={player1Results.score}
            score2={player2Results.score}
            player1Name={player1Name}
            player2Name={player2Name}
            gameSpecificData={{
              level1: player1Results.level || 1,
              level2: player2Results.level || 1,
              level: Math.max(player1Results.level || 1, player2Results.level || 1),
              aliensDestroyed: (player1Results.aliensDestroyed || 0) + (player2Results.aliensDestroyed || 0)
            }}
            onSaveScore={async (data) => {
              if (data.playerNum === 1) {
                await saveSpaceInvadersScore({
                  nombre: data.name,
                  nivel: (player1Results.level || 1),
                  puntuacion: player1Results.score
                });
                onSaveScoreSpaceInvaders(
                  Date.now().toString() + "-1",
                  data.name,
                  player1Results.score
                )
              } else {
                await saveSpaceInvadersScore({
                  nombre: data.name,
                  nivel: (player2Results.level || 1),
                  puntuacion: player2Results.score
                });
                onSaveScoreSpaceInvaders(
                  Date.now().toString() + "-2",
                  data.name,
                  player2Results.score
                )
              }
            }}
            onRestart={() => {
              // Volver al menú de selección de nombres (igual que "Cambiar jugadores")
              setGameState('intro');
              setShowGameOverForm(false);
              resetMultiplayerGame();
              try { bgm.stop(); } catch (e) {}
            }}
            onBackToMenu={handleUniversalGameOverSkip}
            videoSrc={GoVideo}
          />
        </div>
      )}

      {/* Formulario normal para 1 jugador */}
      {showGameOverForm && players === 1 && (
        <SinglePlayerGameOver
          gameType="spaceinvaders"
          isWin={isWin}
          score={Math.max(...score)}
          playerName={player1Name}
          gameSpecificData={{
            level: level, // pasar el nivel actual alcanzado
            aliensDestroyed: totalAliens > 0 ? totalAliens - (gameDataRef.current?.invaders?.length || 0) : 0
          }}
          onSaveScore={async (data) => {
            await saveSpaceInvadersScore({
              nombre: data.name,
              nivel: level,
              puntuacion: data.score
            });
            onSaveScoreSpaceInvaders(
              Date.now().toString(),
              data.name,
              data.score
            )
          }}
          onRestart={() => {
            // Volver al menú de selección de nombres (igual que "Cambiar jugadores")
            setGameState('intro');
            setShowGameOverForm(false);
            resetGame(true);
              try { bgm.stop(); } catch (e) {}
          }}
          onBackToMenu={handleUniversalGameOverSkip}
          videoSrc={isWin ? winVideo : loseVideo}
        />
      )}

      {/* Mobile Controls */}
      {isMobile && gameState === "playing" && (
        <div className={styles.mobileControls}>
          <div className={styles.mobileMovement}>
            <button
              className={`${styles.mobileBtn} ${styles.moveBtn} ${styles.leftBtn}`}
              onPointerDown={(e) => { e.preventDefault(); handleMovePress("left"); }}
              onPointerUp={() => handleMoveRelease("left")}
              onPointerCancel={() => handleMoveRelease("left")}
              onPointerLeave={() => handleMoveRelease("left")}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              className={`${styles.mobileBtn} ${styles.moveBtn} ${styles.rightBtn}`}
              onPointerDown={(e) => { e.preventDefault(); handleMovePress("right"); }}
              onPointerUp={() => handleMoveRelease("right")}
              onPointerCancel={() => handleMoveRelease("right")}
              onPointerLeave={() => handleMoveRelease("right")}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <div className={styles.mobileActions}>
            <button
              className={`${styles.mobileBtn} ${styles.shootBtn}`}
              onPointerDown={(e) => { e.preventDefault(); handleMobileShoot(); }}
            >
              <i className="fa-solid fa-rocket"></i>
            </button>

            <button
              className={`${styles.mobileBtn} ${styles.superBtn}`}
              onPointerDown={(e) => { e.preventDefault(); handleMobileSuper(); }}
              disabled={!superReady[currentPlayer - 1]}
              aria-disabled={!superReady[currentPlayer - 1]}
              title="Ataque especial"
            >
              <i className="fa-solid fa-bolt"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpaceInvaders