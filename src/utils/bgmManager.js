// Default available background music tracks (actual files in public/sounds/BackgroundMusic)
const DEFAULT_BGM_TRACKS = [
  '/sounds/BackgroundMusic/Angel.mp3',
  '/sounds/BackgroundMusic/BattleMusic.mp3',
  '/sounds/BackgroundMusic/Cell.mp3',
  '/sounds/BackgroundMusic/Cha-La.mp3',
  '/sounds/BackgroundMusic/Danger.mp3',
  '/sounds/BackgroundMusic/Fight.mp3',
  '/sounds/BackgroundMusic/KameSenin.mp3',
  '/sounds/BackgroundMusic/Lost.mp3',
  '/sounds/BackgroundMusic/Prologo.mp3',
  '/sounds/BackgroundMusic/Prologo2.mp3',
  '/sounds/BackgroundMusic/SonGoku.mp3',
  '/sounds/BackgroundMusic/SuperSaiyan.mp3',
  '/sounds/BackgroundMusic/Tenkaichi.mp3'
];

class BGMManager {
  constructor() {
    if (BGMManager.instance) {
      return BGMManager.instance;
    }
    BGMManager.instance = this;
    
    this.currentTrack = null;
    this.currentTrackIndex = -1;
    this.audio = null;
    this.isMuted = false;
    this.isPaused = false;
    this.volume = 0.5;
    this.isPlaying = false;
    this._webAudioFailed = false;
    
    // Volume control state
    this._lastVolumeUpdate = 0;
    this._pendingVolumeValue = null;
    this._volumeUpdateInterval = 50;
    this._volumeUpdateTimer = null;
    
    // Web Audio API components
    this.audioContext = null;
    this.gainNode = null;
    this.mediaSource = null;
    
    // active track list (can be replaced via setPlaylist)
    this._tracks = DEFAULT_BGM_TRACKS.slice();
    this._playedTracks = [];
  this._forceNewOnNextPlay = false;
  // Pending play flag used when autoplay is blocked by the browser
  this._pendingPlay = false;

    // Add handlers to manage volume updates and auto-resume
    this._setupAutoResume();
    this._setupVolumeUpdater();
  }

  _setupAutoResume() {
    const resumeAudioContextAndPlayIfPending = () => {
      // Try resuming the audio context if needed
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(e => {
          console.warn('[BGM] Failed to resume audio context:', e);
        });
      }

      // If a previous play() attempt was blocked by autoplay policy, try again
      try {
        if (this.audio && !this.isPlaying && this._pendingPlay) {
          const p = this.audio.play();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              this.isPlaying = true;
              this.isPaused = false;
              this._pendingPlay = false;
            }).catch(() => {
              // still blocked — keep pending true
            });
          }
        }
      } catch (e) {
        // ignore
      }
    };

    // Setup auto-resume on any user interaction
    try {
      ['click', 'touchstart', 'keydown'].forEach(event => {
        window.addEventListener(event, resumeAudioContextAndPlayIfPending, { once: false, passive: true });
      });
    } catch (e) {
      console.warn('[BGM] Failed to add auto-resume listeners:', e);
    }
  }

  _setupVolumeUpdater() {
    // Check for pending volume changes periodically
    const checkVolume = () => {
      if (this._pendingVolumeValue !== null && 
          Date.now() - this._lastVolumeUpdate >= this._volumeUpdateInterval) {
        this._applyVolumeChange();
      }
      // Schedule next check
      this._volumeUpdateTimer = setTimeout(checkVolume, this._volumeUpdateInterval);
    };

    // Start the update loop
    checkVolume();

    // Setup cleanup on window unload
    try {
      window.addEventListener('unload', () => {
        if (this._volumeUpdateTimer) {
          clearTimeout(this._volumeUpdateTimer);
          this._volumeUpdateTimer = null;
        }
      }, { passive: true });
    } catch (e) {
      console.warn('[BGM] Failed to setup volume updater cleanup:', e);
    }
  }

  initialize() {
    if (!this.audio) {
      // Crear elemento de audio
      this.audio = new Audio();
      this.audio.loop = true;
      
      // Solo intentar inicializar Web Audio si no hay instancia previa
      if (!this.audioContext && !this._webAudioFailed) {
        try {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          this.gainNode = this.audioContext.createGain();
          this.gainNode.connect(this.audioContext.destination);
          this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
          this.mediaSource = this.audioContext.createMediaElementSource(this.audio);
          this.mediaSource.connect(this.gainNode);
          // Mantener el volumen del elemento de audio en 1 cuando usamos Web Audio
          this.audio.volume = 1;
        } catch (e) {
          console.warn('[BGM] Web Audio init failed, using standard volume control:', e);
          this._webAudioFailed = true;
          // Limpiar referencias fallidas
          this.audioContext = null;
          this.gainNode = null;
          this.mediaSource = null;
          // Fallback a control de volumen estándar
          this.audio.volume = this.isMuted ? 0 : this.volume;
        }
      } else if (this._webAudioFailed) {
        // Si Web Audio falló antes, usar control estándar
        this.audio.volume = this.isMuted ? 0 : this.volume;
      }
    }
  }

  getRandomTrack() {
    const pool = Array.isArray(this._tracks) && this._tracks.length ? this._tracks : DEFAULT_BGM_TRACKS;
    const availableTracks = pool.filter(track => !this._playedTracks.includes(track));
    
    // Si ya se reprodujeron todas las canciones, reiniciar la lista
    if (availableTracks.length === 0) {
      this._playedTracks = [];
      this.currentTrackIndex = -1;
      return pool[0];
    }
    
    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    this._playedTracks.push(randomTrack);
    this.currentTrackIndex = pool.indexOf(randomTrack);
    return randomTrack;
  }

  play(forceNewTrack = false) {
    this.initialize();
    // Honor an internal flag that forces selection of a new random track
    forceNewTrack = forceNewTrack || !!this._forceNewOnNextPlay;
    // Clear the flag immediately so subsequent plays behave normally
    if (this._forceNewOnNextPlay) this._forceNewOnNextPlay = false;

    if (!this.isPlaying || forceNewTrack) {
      if (this.audio.src && !forceNewTrack) {
        // Si ya hay una canción cargada y no se fuerza nueva, solo reproducir
        if (this.isPaused) {
          this.resume();
          return;
        }
        const playPromise = this.audio.play();
        if (playPromise) {
          playPromise
            .then(() => {
              this.isPlaying = true;
              this.isPaused = false;
            })
            .catch(error => {
              console.warn('[BGM] Playback error:', error);
              // Mark pending so auto-resume can retry when user interacts
              this._pendingPlay = true;
            });
        }
        return;
      }

      const track = this.getRandomTrack();
      console.log('[BGM] Starting track:', track);
      
      this.currentTrack = track;
      this.audio.src = track;
      this.audio.currentTime = 0;
      this.audio.volume = this.isMuted ? 0 : this.volume;
      this.isPlaying = true;
      this.isPaused = false;
      
      const playPromise = this.audio.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.warn('[BGM] Playback error:', error);
          // If playback was blocked by autoplay policies, mark as pending so
          // the auto-resume handler can attempt playback on next user gesture.
          this._pendingPlay = true;
          this.isPlaying = false;
        });
      }
    } else if (this.isPaused) {
      this.resume();
    }
  }

  stop() {
    if (this.audio && this.isPlaying) {
      console.log('[BGM] Stopping track:', this.currentTrack);
      // Temporary debug: print a stack trace so we can identify who is calling stop()
      try {
        // console.trace prints a stack trace to the console; keep this until we identify the caller
        console.trace('[BGM] stop() called');
      } catch (e) {
        try {
          // Fallback: explicit stack from Error
          console.log('[BGM] stop() stack:', (new Error()).stack);
        } catch (e2) {}
      }

      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      this.isPaused = false;
    }
  }

  pause() {
    if (this.audio && this.isPlaying && !this.isPaused) {
      console.log('[BGM] Pausing track:', this.currentTrack);
      this.audio.pause();
      this.isPaused = true;
      return true;
    }
    return false;
  }

  resume() {
    if (this.audio && this.isPaused) {
      console.log('[BGM] Resuming track:', this.currentTrack);
      const playPromise = this.audio.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.warn('[BGM] Resume error:', error);
        });
      }
      this.isPaused = false;
      return true;
    }
    return false;
  }

  nextTrack() {
    if (!this._tracks.length) return false;
    
    const pool = Array.isArray(this._tracks) && this._tracks.length ? this._tracks : DEFAULT_BGM_TRACKS;
    this.currentTrackIndex = (this.currentTrackIndex + 1) % pool.length;
    const nextTrack = pool[this.currentTrackIndex];
    
    if (nextTrack) {
      this.currentTrack = nextTrack;
      this.audio.src = nextTrack;
      this.audio.currentTime = 0;
      this.isPlaying = true;
      this.isPaused = false;
      
      const playPromise = this.audio.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.warn('[BGM] Next track error:', error);
        });
      }
      return true;
    }
    return false;
  }

  // Throttle volume changes to avoid overwhelming the audio system
  _lastVolumeUpdate = 0;
  _pendingVolumeValue = null;
  _volumeUpdateInterval = 50; // ms between updates

  setVolume(value) {
    // Normalizar el valor entre 0 y 1
    const v = Math.max(0, Math.min(1, Number(value) || 0));
    this.volume = v;
    
    // Store pending value
    this._pendingVolumeValue = v;

    // If we're not playing or have no audio element, just store the value
    if (!this.audio || !this.isPlaying) return;

    const now = Date.now();
    
    // If too soon since last update, wait
    if (now - this._lastVolumeUpdate < this._volumeUpdateInterval) return;

    // Otherwise update now
    this._applyVolumeChange();
  }

  _applyVolumeChange() {
    // If no pending value, nothing to do
    if (this._pendingVolumeValue === null) return;

    const v = this._pendingVolumeValue;
    this._pendingVolumeValue = null;
    this._lastVolumeUpdate = Date.now();

    // Don't mess with audioContext.state here - let the auto-resume handle that
    if (!this.audio) return;

    try {
      if (this.gainNode && this.audioContext?.state === 'running') {
        // Direct gain update - no ramping needed for slider
        this.gainNode.gain.value = this.isMuted ? 0 : v;
      } else {
        // Fallback to standard volume
        this.audio.volume = this.isMuted ? 0 : v;
      }
    } catch (e) {
      console.warn('[BGM] Volume update failed:', e);
      // Last resort: try direct audio volume
      try { this.audio.volume = this.isMuted ? 0 : v; } catch (e2) {}
    }
  }

  toggleMute() {
    if (this.isMuted) {
      this.isMuted = false;
      if (this.audio) {
        this.audio.volume = this.volume;
      }
    } else {
      this.isMuted = true;
      if (this.audio) {
        this.audio.volume = 0;
      }
    }
    console.log('[BGM] Music muted:', this.isMuted);
    return this.isMuted;
  }

  getCurrentState() {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      isPaused: this.isPaused,
      currentTrack: this.currentTrack,
      currentTrackIndex: this.currentTrackIndex,
      volume: this.volume
    };
  }

  // Compatibility helpers for existing code that expects a backgroundMusic-like API
  init() {
    // no-op for now (kept for compatibility)
    this.initialize();
  }

  playRandom() {
    return this.play(true);
  }

  // Allow setting a playlist (array of paths)
  setPlaylist(list = []) {
    if (!Array.isArray(list)) return;
    // normalize paths
    this._playlist = list.map(p => (p && p.startsWith('/') ? p : `/sounds/BackgroundMusic/${p}`));
    // replace tracks only if non-empty
    if (this._playlist.length) {
      this._tracks = this._playlist.slice();
    }
  }

  // Backwards-compatible alias used by some modules
  updateMasterGain(v = null) {
    // translate to setVolume
    if (typeof v === 'number') this.setVolume(v);
    else this.setVolume(this.volume);
  }

  // Fully stop playback and reset internal playlist/state so the next play
  // will select a fresh random track. Useful when navigating away from a
  // game and wanting the BGM system to start anew.
  reset() {
    // Stop playback if active and reset playhead, but DO NOT clear audio.src here.
    // Clearing src can cause a transient "no supported sources" error if play()
    // is called concurrently. Instead, mark that the next play should force a
    // fresh random track.
    try {
      if (this.audio) {
        try { this.audio.pause(); } catch (e) {}
        try { this.audio.currentTime = 0; } catch (e) {}
        // keep audio.src so the element remains valid; next play will replace it
      }
    } catch (e) {}

    // Reset manager state
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTrack = null;
    this.currentTrackIndex = -1;
    this._playedTracks = [];
    this._pendingPlay = false;
    // Force selection of a new random track on the next play() call
    this._forceNewOnNextPlay = true;
    console.log('[BGM] Resetting playback state');
  }
}

// Export a singleton instance
export const bgmManager = new BGMManager();

// Default export for backwards compatibility
export default bgmManager;

// Create a custom hook for React components
export const useBGM = () => {
  return {
    play: (forceNewTrack) => bgmManager.play(forceNewTrack),
    stop: () => bgmManager.stop(),
    pause: () => bgmManager.pause(),
    resume: () => bgmManager.resume(),
    nextTrack: () => bgmManager.nextTrack(),
    toggleMute: () => bgmManager.toggleMute(),
    setVolume: (value) => bgmManager.setVolume(value),
    getCurrentState: () => bgmManager.getCurrentState(),
    // Reset playback state and playlist so next play() picks a new random track
    reset: () => bgmManager.reset()
  };
};
