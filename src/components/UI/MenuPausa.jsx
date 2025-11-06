import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/pausemenu.module.css';
import { useBGM } from '../../utils/bgmManager';

const MENU_SOUNDS = {
  open: new Audio('/sounds/LobbySounds/PauseMenuOpen1.mp3'),
  close: new Audio('/sounds/LobbySounds/PauseMenuClose.mp3'),
  hover: new Audio('/sounds/LobbySounds/PauseMenuOption.mp3'),
  select: new Audio('/sounds/LobbySounds/PauseMenuSelected.mp3'),
};

// Ajustar volumen de los sonidos
Object.values(MENU_SOUNDS).forEach(sound => {
  sound.volume = 0.6;
});

// Función para reproducir sonido de forma segura
const playSound = (soundKey) => {
  const sound = MENU_SOUNDS[soundKey];
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {}); // Ignorar errores de reproducción
  }
};

const PauseMenu = ({
  showPauseMenu,
  gameState,
  volume,
  onTogglePause,
  onRequestClose,
  onBackToMenu,
  onToggleFullScreen,
  onResetGame,
  onVolumeChange,
  onBackToPlayerSelect, // Nuevo prop para volver al selector de jugadores
  customButtons = [],
  showPauseButton = true, // Nuevo prop para controlar si mostrar el botón de pausa
  gameType = 'default', // Nuevo prop para identificar el juego y aplicar estilos específicos
  enableEsc = true, // Nuevo prop para controlar si ESC debe funcionar
  // Nuevo: props para controlar solo la música de fondo
  musicMuted = false,
  onToggleMusic = () => {}
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isOpening, setIsOpening] = useState(false); // Nuevo estado para controlar apertura
  const [canToggle, setCanToggle] = useState(true); // Estado general para controlar si se puede togglear
  const [focusedIndex, setFocusedIndex] = useState(-1); // Para navegación con teclado (Iniciar sin foco)
  
  // *** REFS para la restricción de velocidad de navegación y mouse ***
  const isMouseActiveRef = useRef(false); // Ref para el estado del mouse
  const canNavigateRef = useRef(true); // Controla el bloqueo de 0.5s
  const navigationTimeoutRef = useRef(null); // Ref para guardar el ID del timeout
  // Debounce para prevenir múltiples reproducciones rápidas al mover el mouse
  const lastHoverTimeRef = useRef(0);
  const HOVER_DEBOUNCE_MS = 180; // tiempo mínimo entre reproducciones de hover (ms)
  
  // *** REFS para centralizar todo el estado dinámico (SOLUCIÓN ROBUSTA) ***
  const allStateRef = useRef({});

  const menuRef = useRef(null);

  // Inicializar el gestor de música
  const bgm = useBGM();

  // Función universal para fullscreen si no se pasa por prop
  const handleFullScreen = useCallback(() => {
    if (typeof onToggleFullScreen === 'function') {
      onToggleFullScreen();
    } else {
      // Buscar el contenedor principal del juego
      const pptContainer = document.querySelector('.pptContainer') || document.querySelector('.GameArea') || document.body;
      if (pptContainer.requestFullscreen) {
        pptContainer.requestFullscreen();
      } else if (pptContainer.webkitRequestFullscreen) {
        pptContainer.webkitRequestFullscreen();
      } else if (pptContainer.mozRequestFullScreen) {
        pptContainer.mozRequestFullScreen();
      } else if (pptContainer.msRequestFullscreen) {
        pptContainer.msRequestFullscreen();
      }
    }
  }, [onToggleFullScreen]);

  // useEffect para controlar cuando el menú se abre (manejar apertura)
  useEffect(() => {
    if (showPauseMenu) {
      setIsOpening(true);
      setCanToggle(false); // Bloquear toggles durante apertura
      setFocusedIndex(-1); // Resetear foco al abrir (empezar sin selección)
      isMouseActiveRef.current = false; // Resetear ref del mouse al abrir
      canNavigateRef.current = true; // Asegurar que la navegación está disponible al abrir
      
      playSound('open'); // Reproducir sonido de apertura

      // Timeout para esperar a que termine la animación de apertura
      const openingTimeout = setTimeout(() => {
        setIsOpening(false);
        setCanToggle(true); // Permitir toggles después de apertura completa
      }, 800); // 800ms para que las animaciones de entrada terminen
      return () => clearTimeout(openingTimeout);
    }
  }, [showPauseMenu]);

  const toggleMute = useCallback(() => {
    onVolumeChange(volume > 0 ? 0 : 0.5);
  }, [volume, onVolumeChange]);

  const handleVolumeSliderChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
    e.target.style.setProperty("--slider-value", newVolume * 100 + "%");
  }, [onVolumeChange]);

  // Función para iniciar salida con animación
  const handleExit = useCallback((callback) => {
    if (isExiting) return;

    // Request parent to hide the menu immediately to avoid lingering UI.
    // Prefer an explicit onRequestClose (should call setShowPauseMenu(false)).
    // As a fallback, call onTogglePause if it's not the same callback.
    try {
      if (typeof onRequestClose === 'function' && onRequestClose !== callback) {
        onRequestClose();
      } else if (typeof onTogglePause === 'function' && onTogglePause !== callback) {
        onTogglePause();
      }
    } catch (e) {
      // ignore any errors from parent callbacks
    }

    setIsExiting(true);
    setCanToggle(false); // Bloquear toggles durante cierre
    playSound('close'); // Reproducir sonido de cierre

    // Limpiar todos los timeouts relevantes (solo los que queden)
    setFocusedIndex(-1); // Quitar foco de teclado inmediatamente al salir

    setTimeout(() => {
      // Ejecuta la acción original (ej: navegación o reset)
      if (typeof callback === 'function') callback();
      setIsExiting(false);

      setTimeout(() => {
        setCanToggle(true); // Permitir toggles después de que termine todo
      }, 75);
    }, 500);
  }, [isExiting, onTogglePause, onRequestClose]);
  

  // Función para calcular la lista de botones y sus acciones/estados
  const getButtonList = useCallback(() => {
    const list = [];
    list.push({ type: 'volver', action: () => handleExit(onTogglePause), disabled: isExiting || isOpening });
    if (onBackToPlayerSelect) list.push({ type: 'jugadores', action: () => handleExit(onBackToPlayerSelect), disabled: isExiting || isOpening });
    list.push({ type: 'menu', action: () => handleExit(onBackToMenu), disabled: isExiting || isOpening });
    list.push({ type: 'fullscreen', action: handleFullScreen, disabled: isExiting || isOpening });
    if (onResetGame) list.push({ type: 'reset', action: () => handleExit(onResetGame), disabled: isExiting || isOpening });
    customButtons.forEach((button) => {
      list.push({ type: 'custom', action: button.onClick, disabled: button.disabled });
    });
    list.push({ type: 'volume', action: null, disabled: false });
    return list;
  }, [handleExit, onTogglePause, isExiting, isOpening, onBackToPlayerSelect, onBackToMenu, handleFullScreen, onResetGame, customButtons]);

  // Handlers para el div de botones para controlar la prioridad del mouse
  const handleButtonsMouseEnter = () => {
    isMouseActiveRef.current = true; // Uso del Ref
    setFocusedIndex(-1); // Deseleccionar el botón con flechas
  };

  // Handler para hover en botones individuales
  const handleButtonHover = (e) => {
    // No reproducir sonido si está deshabilitado o es el control de volumen (evitar ruido al arrastrar)
    const isVolumeControl = e.currentTarget.getAttribute('aria-label') === 'Control de volumen';
    if (e.currentTarget.disabled || isVolumeControl) return;

    // Debounce: evitar reproducir hover múltiples veces en ráfaga si el mouse pasa rápido
    const now = Date.now();
    if (now - lastHoverTimeRef.current < HOVER_DEBOUNCE_MS) return;
    lastHoverTimeRef.current = now;

    playSound('hover');
  };

  // Handler para click en botones
  const handleButtonClick = (action) => {
    if (typeof action === 'function') {
      playSound('select');
      action();
    }
  };

  const handleButtonsMouseLeave = () => {
    isMouseActiveRef.current = false; // Uso del Ref
  };

  // 1. Efecto para mantener el Ref de estado actualizado
  useEffect(() => {
    const buttonList = getButtonList();
    const volumeIndex = buttonList.findIndex(btn => btn.type === 'volume');

    allStateRef.current = {
        showPauseMenu,
        isExiting,
        isOpening,
        focusedIndex,
        volume,
        canToggle,
        enableEsc,
        showPauseButton,
        buttonList,
        volumeIndex,
        // Setters/Actions:
        setFocusedIndex,
        onTogglePause,
        onVolumeChange,
        handleExit,
        toggleMute,
    };
  }, [
    showPauseMenu, isExiting, isOpening, focusedIndex, volume, canToggle, 
    enableEsc, showPauseButton, onTogglePause, onVolumeChange, handleExit, 
    toggleMute, getButtonList, setFocusedIndex
  ]);

  // 2. Efecto para el Keydown Listener (ESTÁTICO - SOLO MONTAJE)
  useEffect(() => {
    const handleKeyDown = (e) => {
        const state = allStateRef.current; // Acceso al estado más reciente
        const refs = { isMouseActiveRef, canNavigateRef, navigationTimeoutRef };

        // ESC abre/cierra menú
        if (e.key === "Escape" && state.enableEsc && state.canToggle) {
            e.preventDefault();
            if (state.showPauseMenu && !state.isExiting && !state.isOpening) {
                state.handleExit(state.onTogglePause);
            } else if (!state.showPauseMenu && state.showPauseButton) {
                state.onTogglePause();
                playSound('open');
            }
            return;
        }

        // Solo navegación si menú abierto (volumen siempre permitido)
        if (!state.showPauseMenu) return;

        // **1. LÓGICA DE VOLUMEN GLOBAL (ArrowLeft/Right)**
        if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
            
            // Para izquierda/derecha no reproducimos sonido de hover
            // ya que el usuario está ajustando el volumen del juego
            
            // Forzar el foco en el botón de volumen
            state.setFocusedIndex(state.volumeIndex);

            // Ajustar volumen (permitido incluso durante animaciones)
            if (e.key === "ArrowLeft") {
                state.onVolumeChange(Math.max(0, state.volume - 0.05));
            } else if (e.key === "ArrowRight") {
                state.onVolumeChange(Math.min(1, state.volume + 0.05));
            }
            return; 
        }
        
        // Mute global
        if (e.key === "m" || e.key === "M") {
            e.preventDefault();
            state.toggleMute();
            return;
        }

        // **2. LÓGICA DE NAVEGACIÓN (ArrowDown/Up)**
        if (["ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            
            // BLOQUEO CLAVE 1: Si el mouse está activo, bloqueamos
            if (refs.isMouseActiveRef.current) return;
            
            // BLOQUEO CLAVE 2: Si no se puede navegar (por el delay de 0.5s), salimos
            if (!refs.canNavigateRef.current) return;

            // --- INICIAR BLOQUEO DE NAVEGACIÓN (0.5s) ---
            refs.canNavigateRef.current = false;
            
            if (refs.navigationTimeoutRef.current) {
                clearTimeout(refs.navigationTimeoutRef.current);
            }
            refs.navigationTimeoutRef.current = setTimeout(() => {
                 refs.canNavigateRef.current = true; // Reestablecer el ref después del tiempo
                 refs.navigationTimeoutRef.current = null;
            }, 200); // 500ms de delay entre movimientos
            
            // Mover foco (instantáneo)
            state.setFocusedIndex((prev) => {
                const listLength = state.buttonList.length;
                let next = prev;
                
                // Si el foco estaba en -1 (ninguno seleccionado), forzamos al primer botón (0).
                if (prev === -1) {
                    next = 0;
                } else {
                    // Navegación cíclica normal
                    next = prev + (e.key === "ArrowDown" ? 1 : -1);
                    if (next < 0) next = listLength - 1;
                    if (next >= listLength) next = 0;
                }
                
                // Play hover sound for all buttons, including volume control when using up/down
                playSound('hover');
                
                return next;
            });
            
            return;
        }
        
        // **3. LÓGICA ENTER**
        if (e.key === "Enter") {
            e.preventDefault();
            const btn = state.buttonList[state.focusedIndex];
            if (state.focusedIndex !== -1 && btn && !btn.disabled) {
                playSound('select');
                if (btn.action) {
                    btn.action();
                } else if (btn.type === 'volume') {
                    state.toggleMute();
                }
            }
            return;
        }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => {
        window.removeEventListener("keydown", handleKeyDown);
        // La limpieza del timer aquí solo ocurre cuando el componente se desmonta.
        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
        }
    };
  }, []); // Array de dependencias vacío: Solo se monta/desmonta una vez.

  // 3. Efecto para limpieza al cerrar el menú (sin desmontar el componente)
  useEffect(() => {
    if (!showPauseMenu && navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
        canNavigateRef.current = true; // Asegurar que se puede empezar a navegar en la próxima apertura
    }
  }, [showPauseMenu]);

  // Cuando el menú se abre, aseguramos que no esté en modo salida
  useEffect(() => {
    if (showPauseMenu) {
      setIsExiting(false);
    }
  }, [showPauseMenu]);


  // Función auxiliar para obtener el índice de foco esperado para cada botón
  const getButtonFocusIndex = useCallback((type, index = 0) => {
        let currentFocusIndex = 0;
        
        // Botón 1: Volver al juego
        if (type === 'volver') return currentFocusIndex;
        currentFocusIndex++;
        
        // Botón 2: Cambiar jugadores
        if (onBackToPlayerSelect) {
            if (type === 'jugadores') return currentFocusIndex;
            currentFocusIndex++;
        }
        
        // Botón 3: Volver al menú
        if (type === 'menu') return currentFocusIndex;
        currentFocusIndex++;
        
        // Botón 4: Pantalla completa
        if (type === 'fullscreen') return currentFocusIndex;
        currentFocusIndex++;

        // Botón 5: Reiniciar juego
        if (onResetGame) {
            if (type === 'reset') return currentFocusIndex;
            currentFocusIndex++;
        }
        
        // Botones Custom
        if (type === 'custom') {
            return currentFocusIndex + index;
        }
        currentFocusIndex += customButtons.length;
        
        // Botón Final: Volumen
        if (type === 'volume') return currentFocusIndex;
        
        return -1; // No encontrado
  }, [onBackToPlayerSelect, onResetGame, customButtons]);

  return (
    <>
      {/* Botón de pausa - solo visible cuando el menú NO está abierto */}
      {showPauseButton && (
        <button 
          onClick={onTogglePause} 
          className={styles.pauseButton}
        >
          <i className="fa-solid fa-pause"></i>
        </button>
      )}

      {/* Menú de pausa - solo visible cuando está abierto */}
      {(showPauseMenu || isExiting) && (
        <div className={styles.pauseMenu}>
          <div
            ref={menuRef}
            className={`${styles.menupause} ${isExiting ? styles.salida : ""}`}
          >
            <div className={`${styles.background} ${isExiting ? styles.salida : ""}`} />
            <div className={`${styles.NimbusTitle} ${isExiting ? styles.salida : ""}`} />
            <div className={styles.Title}>
              <h2 className={styles.TitleLetters}>
                <span>P</span><span>A</span><span>U</span><span>S</span><span>A</span>
              </h2>
            </div>
            <div className={`${styles.Goku} ${isExiting ? styles.salida : ""}`} />

            <div 
              className={`${styles.buttons} ${gameType === 'simondice' ? styles.buttonsSimon : ''} ${isExiting ? styles.salida : ""}`} 
              onMouseEnter={handleButtonsMouseEnter} 
              onMouseLeave={handleButtonsMouseLeave} 
            >
              {/* Volver al juego */}
              <button
                // Solo .hover si focusedIndex es el actual Y el mouse NO está activo
                className={`${styles.menuButton} ${focusedIndex === getButtonFocusIndex('volver') && !isMouseActiveRef.current ? styles.hover : ""}`} 
                style={{ "--i": 0 }}
                onClick={() => handleButtonClick(() => handleExit(onTogglePause))}
                onMouseEnter={handleButtonHover}
                disabled={isExiting || isOpening}
                tabIndex={focusedIndex === getButtonFocusIndex('volver') ? 0 : -1}
              >
                <span><i className="fa-solid fa-play"></i> V</span>olver al juego
                <div className={styles.backgroundText} />
              </button>

              {/* Cambiar jugadores */}
              {onBackToPlayerSelect && (
                <button
                  className={`${styles.menuButton} ${focusedIndex === getButtonFocusIndex('jugadores') && !isMouseActiveRef.current ? styles.hover : ""}`} 
                  style={{ "--i": 1 }}
                  onClick={() => handleButtonClick(() => { try { bgm.reset(); } catch (e) {} ; handleExit(onBackToPlayerSelect); })}
                  onMouseEnter={handleButtonHover}
                  disabled={isExiting || isOpening}
                  tabIndex={focusedIndex === getButtonFocusIndex('jugadores') ? 0 : -1}
                >
                  <span><i className="fa-solid fa-users"></i> C</span>ambiar jugadores
                  <div className={styles.backgroundText} />
                </button>
              )}

              {/* Volver al menú */}
              <button
                className={`${styles.menuButton} ${focusedIndex === getButtonFocusIndex('menu') && !isMouseActiveRef.current ? styles.hover : ""}`} 
                style={{ "--i": 2 }}
                onClick={() => handleButtonClick(() => { try { bgm.reset(); } catch (e) {} ; handleExit(onBackToMenu); })}
                onMouseEnter={handleButtonHover}
                disabled={isExiting || isOpening}
                tabIndex={focusedIndex === getButtonFocusIndex('menu') ? 0 : -1}
              >
                <span><i className="fa-solid fa-cloud"></i> V</span>olver al menú
                <div className={styles.backgroundText} />
              </button>

              {/* Pantalla completa */}
              <button
                className={`${styles.menuButton} ${focusedIndex === getButtonFocusIndex('fullscreen') && !isMouseActiveRef.current ? styles.hover : ""}`} 
                style={{ "--i": 2 }}
                onClick={() => handleButtonClick(handleFullScreen)}
                onMouseEnter={handleButtonHover}
                disabled={isExiting || isOpening}
                tabIndex={focusedIndex === getButtonFocusIndex('fullscreen') ? 0 : -1}
              >
                <span><i className="fa-solid fa-expand"></i>P</span>antalla completa
                <div className={styles.backgroundText} />
              </button>

              {/* Reiniciar juego */}
              {onResetGame && (
                <button
                  className={`${styles.menuButton} ${focusedIndex === getButtonFocusIndex('reset') && !isMouseActiveRef.current ? styles.hover : ""}`} 
                  style={{ "--i": 3 }}
                  onClick={() => handleButtonClick(() => handleExit(onResetGame))}
                  onMouseEnter={handleButtonHover}
                  disabled={isExiting || isOpening}
                  tabIndex={focusedIndex === getButtonFocusIndex('reset') ? 0 : -1}
                >
                  <span><i className="fa-solid fa-rotate-right"></i> R</span>einiciar juego
                  <div className={styles.backgroundText} />
                </button>
              )}

              {/* Botones personalizados */}
              {customButtons.map((button, index) => {
                const customIdx = getButtonFocusIndex('custom', index);
                return (
                  <button
                    key={index}
                    className={`${styles.menuButton} ${button.className || ""} ${focusedIndex === customIdx && !isMouseActiveRef.current ? styles.hover : ""}`} 
                    onClick={() => handleButtonClick(button.onClick)}
                    onMouseEnter={handleButtonHover}
                    disabled={button.disabled}
                    tabIndex={focusedIndex === customIdx ? 0 : -1}
                  >
                    {button.icon && <i className={button.icon}></i>}
                    {button.text}
                  </button>
                );
              })}

              {/* Volumen */}
              <button
                className={`${styles.menuButton} ${focusedIndex === getButtonFocusIndex('volume') && !isMouseActiveRef.current ? styles.hover : ""}`} 
                style={{ "--i": 4 }}
                tabIndex={focusedIndex === getButtonFocusIndex('volume') ? 0 : -1}
                aria-label="Control de volumen"
                onMouseEnter={handleButtonHover}
                disabled={false}  // Never disable volume control
              >
                <span>
                  {volume > 0 ? (
                    <i className="fa-solid fa-volume-high" onClick={toggleMute}></i>
                  ) : (
                    <i className="fa-solid fa-volume-xmark" onClick={toggleMute}></i>
                  )}
                </span>
                <input
                  id="volumeSlider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeSliderChange}
                  style={{ "--slider-value": volume * 100 + "%" }}
                  tabIndex={-1}
                  disabled={false}  // Never disable volume slider
                />
                {/* Botón para silenciar SOLO música de fondo */}
                <div className={styles.musicControls}>
                  <span
                    type="button"
                    className={styles.musicToggle}
                    onClick={() => {
                      // Simply call the parent handler - let it manage bgm state
                      if (typeof onToggleMusic === 'function') {
                        onToggleMusic();
                      }
                    }}
                    aria-pressed={musicMuted}
                    title={musicMuted ? 'Reanudar música' : 'Pausar música'}
                  >
                    <i className={`fa-solid ${musicMuted ? 'fa-play' : 'fa-pause'}`}></i>
                  </span>
                  <span
                    type="button"
                    className={styles.musicNext}
                    onClick={() => {
                      bgm.nextTrack();
                    }}
                    title="Siguiente canción"
                  >
                    <i className="fa-solid fa-forward"></i>
                  </span>
                </div>
                <div className={styles.backgroundText} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PauseMenu;