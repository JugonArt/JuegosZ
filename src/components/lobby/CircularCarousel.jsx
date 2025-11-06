import React, { useEffect, useRef } from 'react';
import { Camera, Mesh, Plane, Program, Renderer, Transform } from 'ogl';
import styles from '../styles/CircularCarousel.module.css';

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1, p2, t) {
  return p1 + (p2 - p1) * t;
}

class GameCard {
  constructor({
    geometry,
    gl,
    index,
    length,
    renderer,
    scene,
    screen,
    viewport,
    bend,
    project,
    onPlayClick,
    getGameplayClasses
  }) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.viewport = viewport;
    this.bend = bend;
    this.project = project;
    this.onPlayClick = onPlayClick;
    this.getGameplayClasses = getGameplayClasses;
    
    this.createMesh();
    this.onResize();
  }

// Dentro de la clase GameCard en CircularCarousel.jsx

createMesh() {
  // Crear un plano simple sin textura
  this.program = new Program(this.gl, {
    depthTest: false,
    depthWrite: false,
    vertex: `
      precision highp float;
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      
      // Nuevos uniforms para el efecto
      uniform float uTime;
      uniform float uSpeed;

      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;

        // La lógica de la onda del ejemplo
        p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.01 + uSpeed * 0.1);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `, // Fin del vertex shader
    fragment: `
      precision highp float;
      varying vec2 vUv;
      void main() {
        // Mantenemos el plano invisible
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      }
    `,
    transparent: true,
    
    // Añade los uniforms aquí
    uniforms: {
        uTime: { value: 100 * Math.random() }, // Valor inicial aleatorio para desincronizar las ondas
        uSpeed: { value: 0 }
    }
  });

  this.plane = new Mesh(this.gl, {
    geometry: this.geometry,
    program: this.program
  });
  this.plane.setParent(this.scene);
}

  update(scroll, direction) {
  // Calcula la velocidad (diferencia entre el scroll actual y el anterior)
  this.speed = scroll.current - scroll.last;

  // Actualiza los uniforms del shader
  this.program.uniforms.uTime.value += 0.04;
  this.program.uniforms.uSpeed.value = this.speed;

  // El resto de tu código de update...
  this.plane.position.x = this.x - scroll.current - this.extra
    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
const effectiveX = Math.min(Math.abs(x), R * 0.99);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
this.isBefore = this.plane.position.x + planeOffset < -viewportOffset - 50;
this.isAfter = this.plane.position.x - planeOffset > viewportOffset + 50;
    
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

onResize({ screen, viewport } = {}) {
  if (screen) this.screen = screen;
  if (viewport) this.viewport = viewport;
  
  this.scale = this.screen.height / 1500;
  this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
  this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
  
  // Ajustar padding según ancho de pantalla y número de proyectos
  const isMobile = this.screen.width <= 768;
  // Con 4 juegos necesitamos más padding que con 5 para distribuir mejor
  const baseProjectCount = 5; // Número original de proyectos para el que se diseñó
  const actualProjectCount = this.length / 2; // Dividir por 2 porque están duplicados
  const paddingMultiplier = baseProjectCount / actualProjectCount;
  this.padding = isMobile ? 0.4 * paddingMultiplier : 2 * paddingMultiplier;
  
  this.width = this.plane.scale.x + this.padding;
  this.widthTotal = this.width * this.length;
  this.x = this.width * this.index;
}

  getWorldPosition() {
    return {
      x: this.plane.position.x,
      y: this.plane.position.y,
      rotation: this.plane.rotation.z,
      scale: { x: this.plane.scale.x, y: this.plane.scale.y }
    };
  }
}

class CircularApp {
constructor(container, { projects, onPlayClick, getGameplayClasses, bend = 2, grabSpeed = 1, wheelSpeed = 2, scrollSpeed = 2, scrollEase = 1 } = {}) {
    // Crear instancias de Audio para los sonidos
    this.selectorSound = new Audio('/sounds/LobbySounds/GameSelector.mp3');
    this.selectorSound.volume = 0.2;
    this.selectedSound = new Audio('/sounds/LobbySounds/GameSelected.mp3');
    this.selectedSound.volume = 0.6;
    
    // Flag para primera interacción
    this.hasInteracted = false;

    // Debounce para el sonido del selector
    this.playSelectorSoundDebounced = debounce(() => {
      if (this.hasInteracted) {
        this.selectorSound.currentTime = 0;
        this.selectorSound.play().catch(() => {}); // Ignorar errores de reproducción
      }
    }, 100);

    // (Removed onCenterConfirmed hook; central class is handled in React side)

    // Escuchar la primera interacción
    const markInteracted = () => {
      this.hasInteracted = true;
      // Remover los listeners una vez que se detecta la interacción
      document.removeEventListener('click', markInteracted);
      document.removeEventListener('touchstart', markInteracted);
    };
    document.addEventListener('click', markInteracted);
    document.addEventListener('touchstart', markInteracted);
    this.container = container;
    this.projects = projects;
    this.onPlayClick = onPlayClick;
    this.getGameplayClasses = getGameplayClasses;
    this.grabSpeed = grabSpeed;
  this.wheelSpeed = wheelSpeed;
  this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck, 200);
    this.isFrozen = false; // Nuevo: para congelar la interacción
  this.keyboardScrollAmount = 10; // Cantidad de scroll por tecla de flecha (doble)
    
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createCards(bend);
    
    // Ajustar scroll inicial para que SpaceInvaders del grupo central esté en el centro
    // Con triplicación: [grupo1: Space,PPT,Tateti,Simon] [grupo2: Space,PPT,Tateti,Simon] [grupo3: ...]
    // Array índices:     [0,    1,  2,     3    ] [4,    5,  6,     7    ] [8, ...]
    // Queremos SpaceInvaders del grupo2 (índice 4) centrado
    // El scroll se calcula como: -posición_de_la_tarjeta_en_x
    // Como cada tarjeta está en x = index * cardWidth, necesitamos desplazar -4 * cardWidth
    // PERO también necesitamos centrar, así que restamos media tarjeta más
    if (this.cards.length > 0) {
      const cardWidth = this.cards[0].width;
      const projectCount = this.projects.length;
      // Desplazamos para centrar la primera tarjeta del segundo grupo (SpaceInvaders)
      // No es necesario ajuste adicional porque el update() ya maneja el centrado
      this.scroll.current = -cardWidth * projectCount;
      this.scroll.target = -cardWidth * projectCount;
      this.scroll.last = -cardWidth * projectCount;
    }
    
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100
    });
  }

  createCards(bend) {
    // Triplicar proyectos para asegurar que siempre haya tarjetas visibles a ambos lados
    // Con 4 juegos: [1,2,3,4, 1,2,3,4, 1,2,3,4] = 12 tarjetas
    const duplicatedProjects = [...this.projects, ...this.projects, ...this.projects];
    
    this.cards = duplicatedProjects.map((project, index) => {
      return new GameCard({
        geometry: this.planeGeometry,
        gl: this.gl,
        index,
        length: duplicatedProjects.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        viewport: this.viewport,
        bend,
        project,
        onPlayClick: this.onPlayClick,
        getGameplayClasses: this.getGameplayClasses
      });
    });
  }

  onTouchDown(e) {
    if (this.isFrozen) return; // No responder si está congelado
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;
  }

  onTouchMove(e) {
    if (!this.isDown || this.isFrozen) return; // No responder si está congelado
    const x = e.touches ? e.touches[0].clientX : e.clientX;
const distance = (this.start - x) * (this.grabSpeed * 0.025);
    this.scroll.target = this.scroll.position + distance;
  }

  onTouchUp() {
    if (this.isFrozen) return; // No responder si está congelado
    this.isDown = false;
    this.onCheck();
  }

  onWheel(e) {
    if (this.isFrozen) return; // No responder si está congelado
    const delta = e.deltaY || e.wheelDelta || e.detail;
this.scroll.target += (delta > 0 ? this.wheelSpeed : -this.wheelSpeed) * 2;
    this.onCheckDebounce();
  }

  onKeyDown(e) {
    if (this.isFrozen) return;
    
    // La tecla Enter marca como interacción
    if (!this.hasInteracted && e.key === 'Enter') {
      this.hasInteracted = true;
    }
    
    // Flechas izquierda/derecha para navegar
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.scroll.target -= this.keyboardScrollAmount;
      this.onCheckDebounce();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.scroll.target += this.keyboardScrollAmount;
      this.onCheckDebounce();
    }
    // Enter para seleccionar el juego central
    else if (e.key === 'Enter') {
      e.preventDefault();
      const centralCard = this.getCentralCard();
      if (centralCard && this.onPlayClick) {
        // Reproducir sonido de selección solo si ya hubo interacción
        if (this.hasInteracted) {
          this.selectedSound.currentTime = 0;
          this.selectedSound.play().catch(() => {}); // Ignorar errores de reproducción
        }
        this.onPlayClick(centralCard.project.id);
      }
    }
  }

  // Obtener la card más cercana al centro
  getCentralCard() {
    if (!this.cards || this.cards.length === 0) return null;
    
    let closestCard = null;
    let minDistance = Infinity;
    
    this.cards.forEach(card => {
      const distance = Math.abs(card.plane.position.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestCard = card;
      }
    });
    
    return closestCard;
  }

  onCheck() {
    if (!this.cards || !this.cards[0] || this.isFrozen) return; // No ejecutar si está congelado
    const width = this.cards[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    const newTarget = this.scroll.target < 0 ? -item : item;
    
    // Si el target cambió, reproducir sonido selector
    if (Math.abs(newTarget - this.scroll.target) > 0.1) {
      this.playSelectorSoundDebounced();
    }
    
    this.scroll.target = newTarget;
  }

  // Métodos para congelar/descongelar la interacción
  freeze() {
    this.isFrozen = true;
    this.isDown = false; // Terminar cualquier interacción en curso
  }

  unfreeze() {
    this.isFrozen = false;
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    
    if (this.cards) {
      this.cards.forEach(card => card.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }

  update() {
    // Solo actualizar el scroll si no está congelado
    if (!this.isFrozen) {
      this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    }
    
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    
    if (this.cards) {
      this.cards.forEach(card => card.update(this.scroll, direction));
    }
    
    // (No-op: center class is handled in the React layer directly)
    
    this.renderer.render({ scene: this.scene, camera: this.camera });
    
    // Solo actualizar scroll.last si no está congelado
    if (!this.isFrozen) {
      this.scroll.last = this.scroll.current;
    }
    
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  // Obtener el índice de la card más cercana al centro (basado en posiciones actuales)
  getCentralCardIndex() {
    if (!this.cards || this.cards.length === 0) return 0;
    let minDistance = Infinity;
    let closestIndex = 0;
    this.cards.forEach((card, idx) => {
      const distance = Math.abs(card.plane.position.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });
    return closestIndex;
  }

  getCardPositions() {
    return this.cards.map(card => card.getWorldPosition());
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    
    window.addEventListener('resize', this.boundOnResize);
    window.addEventListener('mousewheel', this.boundOnWheel);
    window.addEventListener('wheel', this.boundOnWheel);
    window.addEventListener('mousedown', this.boundOnTouchDown);
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    window.addEventListener('touchstart', this.boundOnTouchDown);
    window.addEventListener('touchmove', this.boundOnTouchMove);
    window.addEventListener('touchend', this.boundOnTouchUp);
    window.addEventListener('keydown', this.boundOnKeyDown);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
    window.removeEventListener('mousewheel', this.boundOnWheel);
    window.removeEventListener('wheel', this.boundOnWheel);
    window.removeEventListener('mousedown', this.boundOnTouchDown);
    window.removeEventListener('mousemove', this.boundOnTouchMove);
    window.removeEventListener('mouseup', this.boundOnTouchUp);
    window.removeEventListener('touchstart', this.boundOnTouchDown);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchUp);
    window.removeEventListener('keydown', this.boundOnKeyDown);
    
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

export default function CircularCarousel({ projects, onPlayClick, getGameplayClasses, animate, isTransitioning }) {
  const containerRef = useRef(null);
  const cardsRef = useRef(null);
  const appRef = useRef(null);
  const propsRef = useRef({ projects, onPlayClick, getGameplayClasses });
  const scrollStateRef = useRef(null); // null inicialmente, se configurará en primera carga
  // Centered class management
  const lastAppliedCenterRef = useRef(-1);

  // Actualizar las props en el ref cada render
  propsRef.current = { projects, onPlayClick, getGameplayClasses };

  useEffect(() => {
  const isMobile = window.innerWidth <= 768;
  
  // Guardar estado actual del scroll si existe
  if (appRef.current) {
    scrollStateRef.current = {
      current: appRef.current.scroll.current,
      target: appRef.current.scroll.target,
      last: appRef.current.scroll.last
    };
    appRef.current.destroy();
  }
  
  appRef.current = new CircularApp(containerRef.current, {
    projects: propsRef.current.projects,
    onPlayClick: propsRef.current.onPlayClick,
    getGameplayClasses: propsRef.current.getGameplayClasses,
    bend: isMobile ? -8 : -4,        // Más bend en móvil
    grabSpeed: isMobile ? 3 : 1,     // Más rápido en móvil
    wheelSpeed: 3,
    scrollEase: 0.15
  });

  // Si estamos en móvil/tablet, congelar la interacción para que el carousel
  // quede fijo con SpaceInvaders centrado y no sea scrolleable.
  if (isMobile) {
    try {
      appRef.current.freeze();
    } catch (e) {}
  }
  
  // Restaurar estado del scroll solo si ya existía (no es la primera carga)
  if (scrollStateRef.current) {
    appRef.current.scroll.current = scrollStateRef.current.current;
    appRef.current.scroll.target = scrollStateRef.current.target;
    appRef.current.scroll.last = scrollStateRef.current.last;
  }
  // Si es la primera carga, el scroll ya está configurado correctamente en el constructor

   const handleResize = () => {
    const wasMobile = window.innerWidth <= 768;
    if ((wasMobile && !isMobile) || (!wasMobile && isMobile)) {
      // Guardar estado antes de destruir
      if (appRef.current) {
        scrollStateRef.current = {
          current: appRef.current.scroll.current,
          target: appRef.current.scroll.target,
          last: appRef.current.scroll.last
        };
        appRef.current.destroy();
      }
      const newIsMobile = window.innerWidth <= 768;
      appRef.current = new CircularApp(containerRef.current, {
        projects: propsRef.current.projects,
        onPlayClick: propsRef.current.onPlayClick,
        getGameplayClasses: propsRef.current.getGameplayClasses,
        bend: newIsMobile ? -8 : -4,
        grabSpeed: newIsMobile ? 2 : 1,
        wheelSpeed: 3,
        scrollEase: 0.15
      });
      if (newIsMobile) {
        try { appRef.current.freeze(); } catch (e) {}
      }
      
      // Restaurar estado del scroll
      if (scrollStateRef.current) {
        appRef.current.scroll.current = scrollStateRef.current.current;
        appRef.current.scroll.target = scrollStateRef.current.target;
        appRef.current.scroll.last = scrollStateRef.current.last;
      }
    }
  };

  // Debounce del resize para no recrear constantemente
  let resizeTimeout;
  const debouncedResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 500);
  };

  window.addEventListener('resize', debouncedResize);

const updateCards = () => {
  if (appRef.current && cardsRef.current) {
    // Actualizar estado guardado del scroll
    scrollStateRef.current = {
      current: appRef.current.scroll.current,
      target: appRef.current.scroll.target,
      last: appRef.current.scroll.last
    };
    
    const positions = appRef.current.getCardPositions();
    const cards = cardsRef.current.querySelectorAll(`.${styles.cardWrapper}`);
    
    // Verificar si hay movimiento
    const hasMovement = Math.abs(
      appRef.current.scroll.current - appRef.current.scroll.last
    ) > 0.01;

    cards.forEach((card, index) => {
      if (positions[index]) {
        const pos = positions[index];
        const scale = pos.scale.x / 10;
        const translateX = pos.x * 60;
        const translateY = pos.y * 50;
        const rotateZ = pos.rotation * (180 / Math.PI);

        const fadeFactor = 0.04;
        const fadeExponent = 2; 
        const opacity = Math.max(0, 1 - Math.pow(Math.abs(pos.x) * fadeFactor, fadeExponent));

        card.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotateZ(${rotateZ}deg) scale(${scale})`;
        card.style.opacity = opacity;
        
        // SOLO ESTA PARTE ES NUEVA - will-change dinámico
        if (hasMovement) {
          card.style.willChange = 'transform, opacity';
        } else {
          card.style.willChange = 'auto';
        }
      }
    });

    // Detect center index based on positions array (real-time) and apply class immediately
    try {
      let minDistance = Infinity;
      let centerIndex = -1;
      positions.forEach((p, i) => {
        if (!p) return;
        const d = Math.abs(p.x);
        if (d < minDistance) {
          minDistance = d;
          centerIndex = i;
        }
      });

      if (centerIndex !== -1 && centerIndex !== lastAppliedCenterRef.current) {
  const wrappers = Array.from(cardsRef.current.querySelectorAll(`.${styles.cardWrapper}`));
  // Map to inner carouselItem elements and remove previous centered class from items
  const items = wrappers.map(w => w.querySelector(`.${styles.carouselItem}`)).filter(Boolean);
  items.forEach(it => it.classList.remove(styles.centeredgame));
  // apply to new (inner carouselItem)
  const item = items[centerIndex];
  if (item) item.classList.add(styles.centeredgame);
        lastAppliedCenterRef.current = centerIndex;
      }
    } catch (e) {
      // ignore any errors in center detection
    }
  }
  requestAnimationFrame(updateCards);
};
  // Iniciar el bucle de actualización de las cartas **después** de que WebGL
  // haya inicializado las tarjetas. En dispositivos móviles a veces las
  // posiciones no están listas al primer raf, así que hacemos un pequeño poll
  // de frames (hasta 10) y luego forzamos el snap inicial.
  const startUpdateLoop = () => {
    let attempts = 0;
    const tryInit = () => {
      attempts += 1;
      const app = appRef.current;

      const ready = app && app.cards && app.cards.length > 0 && app.cards[0].plane && app.cards[0].plane.scale && app.cards[0].plane.scale.x && !isNaN(app.cards[0].plane.scale.x);

      if (ready) {
        try {
          // Asegurar que tamaños y viewport estén sincronizados
          app.onResize();

          // Intentar forzar que la tarjeta central sea SpaceInvaders en la
          // carga inicial. Buscamos el índice de la tarjeta correspondiente
          // dentro del grupo central (segunda réplica).
          const projectCount = app.projects ? app.projects.length : 0;
          let targetIndex = null;
          if (projectCount > 0) {
            for (let i = 0; i < app.cards.length; i++) {
              const cardProject = app.cards[i].project;
              if (cardProject && cardProject.id === 'spaceinvaders') {
                // comprobamos si pertenece al grupo central
                if (i >= projectCount && i < projectCount * 2) {
                  targetIndex = i;
                  break;
                }
                // si no encontramos en el grupo central, guardamos la primera
                if (targetIndex === null) targetIndex = i;
              }
            }
          }

          if (targetIndex !== null) {
            const cardWidth = app.cards[0].width || 0;
            const scrollPos = -cardWidth * targetIndex;
            app.scroll.current = scrollPos;
            app.scroll.target = scrollPos;
            app.scroll.last = scrollPos;
          } else {
            // Fallback: usar onCheck() si no encontramos el proyecto
            app.onCheck();
            app.scroll.last = app.scroll.current;
          }
        } catch (e) {
          // ignorar errores menores
        }

        // iniciar el loop de actualización del DOM
        updateCards();
      } else if (attempts < 10) {
        // Intentar en el siguiente frame
        requestAnimationFrame(tryInit);
      } else {
        // Fallback: si no quedó listo, forzamos el inicio para evitar bloquear
        try {
          if (app) {
            app.onResize();
            app.onCheck();
            app.scroll.last = app.scroll.current;
          }
        } catch (e) {}
        updateCards();
      }
    };

    requestAnimationFrame(tryInit);
  };

  startUpdateLoop();

  return () => {
    window.removeEventListener('resize', debouncedResize);
    if (appRef.current) {
      appRef.current.destroy();
    }
    // No center timeout to clear (class applied instantly)
  };
  }, [projects, onPlayClick, getGameplayClasses]); // Restaurar dependencias originales

  // useEffect para manejar el congelamiento durante transiciones
  useEffect(() => {
    if (appRef.current) {
      if (isTransitioning) {
        appRef.current.freeze();
      } else {
        appRef.current.unfreeze();
      }
    }
  }, [isTransitioning]);

  // Triplicar proyectos para el loop infinito (asegura tarjetas visibles a ambos lados)
  const duplicatedProjects = [...projects, ...projects, ...projects];

  // Referencia para el audio de selección
  const selectedSoundRef = React.useRef(null);

  // Inicializar el audio
  React.useEffect(() => {
    selectedSoundRef.current = new Audio('/sounds/LobbySounds/GameSelected.mp3');
    selectedSoundRef.current.volume = 0.6;
  }, []);

  const handlePlayClick = (projectId) => {
    // Reproducir sonido antes de navegar
    if (selectedSoundRef.current) {
      selectedSoundRef.current.currentTime = 0;
      selectedSoundRef.current.play();
    }
    onPlayClick(projectId);
  };

  return (
    <div className={styles.circularCarousel}>
      <div ref={containerRef} className={styles.canvasContainer} />
      <div ref={cardsRef} className={styles.cardsContainer}>
        {duplicatedProjects.map((project, index) => {
          const gameplayClasses = getGameplayClasses(project.id);
          return (
            <div key={`${project.id}-${index}`}
            className={`${styles.cardWrapper} ${animate ? styles.entry : styles.leave}`}>
              <div
                className={`${styles.carouselItem} ${styles.projectCard} ${styles[project.colorClass]} ${styles[project.id]}`}
              >
                <div className={styles.background}/>
                <div className={styles.character}/>
                <div className={styles.cardHeader}>
                  <div className={styles.cardDot} />
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{project.title}</h3>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.playerInfo}>
                    <div className={gameplayClasses.players1.classes.join(' ')}>
                      <p>{gameplayClasses.players1.text}</p>
                    </div>
                    <div className={gameplayClasses.players2.classes.join(' ')}>
                      <p>{gameplayClasses.players2.text}</p>
                    </div>
                  </div>
                  <button 
                    className={styles.playButton}
                    onClick={() => handlePlayClick(project.id)}
                    tabIndex={-1}
                  >
                    <div className={styles.playCont}>
                      <div className={`${styles.playIcon} ${styles.playItem}`}/>
                      <p className={`${styles.playText} ${styles.playItem}`}>JUGAR</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}