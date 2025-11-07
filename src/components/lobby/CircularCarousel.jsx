import React, { useEffect, useRef } from 'react';
import { Camera, Mesh, Plane, Program, Renderer, Transform } from 'ogl';
import styles from '../styles/CircularCarousel.module.css';
import useLobbySound from '../../hooks/useLobbySound';

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
  // Ahora triplicamos los proyectos (3 réplicas). Usar /3 para calcular el conteo
  const actualProjectCount = this.length / 3;
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
constructor(container, { projects, onPlayClick, getGameplayClasses, bend = 2, grabSpeed = 1, wheelSpeed = 2, scrollSpeed = 2, scrollEase = 1, freezeOnInit = false, playSelectorSound = null, playSelectedSound = null } = {}) {
    // Prefer external sound providers (funciones) para evitar crear elementos
    // audio directamente desde la clase. Si no se proporcionan, creamos
    // Audio simples como fallback.
    this.hasInteracted = false;

    if (typeof playSelectorSound === 'function') {
      this.playSelector = playSelectorSound;
    } else {
      this.selectorAudio = new Audio('/sounds/LobbySounds/GameSelector.mp3');
      this.selectorAudio.volume = 0.2;
      this.playSelector = () => {
        try {
          this.selectorAudio.currentTime = 0;
          const p = this.selectorAudio.play();
          if (p && typeof p.then === 'function') p.catch(() => {});
        } catch (e) {}
      };
    }

    if (typeof playSelectedSound === 'function') {
      this.playSelected = playSelectedSound;
    } else {
      this.selectedAudio = new Audio('/sounds/LobbySounds/GameSelected.mp3');
      this.selectedAudio.volume = 0.6;
      this.playSelected = () => {
        try {
          this.selectedAudio.currentTime = 0;
          const p = this.selectedAudio.play();
          if (p && typeof p.then === 'function') p.catch(() => {});
        } catch (e) {}
      };
    }

    // Debounce para el sonido del selector (usa this.playSelector)
    this.playSelectorSoundDebounced = debounce(() => {
      if (this.hasInteracted) {
        try { this.playSelector(); } catch (e) {}
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
  // Flag para congelar la interacción. Puede venir desde las opciones para
  // evitar una breve ventana donde el usuario pueda interactuar durante la
  // inicialización en dispositivos móviles.
  this.isFrozen = !!freezeOnInit;
  this.keyboardScrollAmount = 10; // Cantidad de scroll por tecla de flecha (doble)
    
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createCards(bend);
    
    // Intentar centrar desde el inicio en la réplica central la tarjeta
    // cuyo id sea 'spaceinvaders' (si existe). Esto evita que el carousel
    // arranque en un espacio vacío.
    if (this.cards && this.cards.length > 0) {
      const cardWidth = this.cards[0].width || 0;
      const projectCount = this.projects ? this.projects.length : 0;
      let targetIndex = null;
      if (projectCount > 0) {
        for (let i = 0; i < this.cards.length; i++) {
          const cardProject = this.cards[i].project;
          if (cardProject && cardProject.id === 'spaceinvaders') {
            // Preferir la réplica central
            if (i >= projectCount && i < projectCount * 2) {
              targetIndex = i;
              break;
            }
            if (targetIndex === null) targetIndex = i;
          }
        }
      }

      if (targetIndex !== null) {
        const scrollPos = -cardWidth * targetIndex;
        this.scroll.current = scrollPos;
        this.scroll.target = scrollPos;
        this.scroll.last = scrollPos;
      }
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
    // El contenedor puede ser null en situaciones de resize/remount rápido.
    // Proteger y reintentar un frame después si aún no existe para evitar
    // lanzar una excepción que rompa la app.
    try {
      if (this.container && this.container.appendChild) {
        this.container.appendChild(this.gl.canvas);
      } else {
        // Reintentar una vez en el siguiente frame
        requestAnimationFrame(() => {
          try {
            if (this.container && this.container.appendChild) {
              this.container.appendChild(this.gl.canvas);
            }
          } catch (e) {}
        });
      }
    } catch (e) {
      // Ignorar errores de append para evitar crash; el canvas quedará
      // unido cuando el contenedor esté disponible.
    }
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
          try { this.playSelected(); } catch (e) {}
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

  // Hooks para sonidos del lobby (selector y seleccionado)
  const playSelector = useLobbySound('/sounds/LobbySounds/GameSelector.mp3', { volume: 0.2 });
  const playSelected = useLobbySound('/sounds/LobbySounds/GameSelected.mp3', { volume: 0.6 });

  useEffect(() => {
  const isMobile = window.innerWidth <= 768;

  // Si estamos en móvil/tablet, NO arrancamos el WebGL Carousel. En su
  // lugar dejamos que el render muestre una carta estática centrada.
  // Destruimos cualquier instancia previa para limpiar el canvas.
  if (isMobile) {
    try {
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    } catch (e) {}
    try {
      if (cardsRef.current) {
        const dbg = cardsRef.current.querySelector('.__debugSlots');
        if (dbg) dbg.parentNode.removeChild(dbg);
      }
    } catch (e) {}

    // No iniciamos listeners ni nada más en móvil - el return cleanup es
    // un noop (se recreará la lógica cuando el hook se vuelva a ejecutar
    // por un cambio de props o si el usuario fuerza un resize que provoque
    // el remount por otra parte de la app).
    return () => {};
  }
  
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
    scrollEase: 0.15,
    freezeOnInit: isMobile,
    playSelectorSound: playSelector,
    playSelectedSound: playSelected
  });

  // Si estamos en móvil/tablet, congelar la interacción para que el carousel
  // quede fijo con SpaceInvaders centrado y no sea scrolleable.
  if (isMobile) {
    try {
      appRef.current.freeze();
    } catch (e) {}
  }
  
  // Restaurar estado del scroll solo si ya existía (no es la primera carga)
  // Para móviles/tablet queremos forzar que SpaceInvaders esté centrado
  // al crear/reaparecer, así que no restauramos el scroll guardado en esos
  // casos. Solo restauramos el estado previo en pantallas de escritorio.
  if (scrollStateRef.current && !isMobile) {
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
        scrollEase: 0.15,
        freezeOnInit: newIsMobile,
        playSelectorSound: playSelector,
        playSelectedSound: playSelected
      });
      if (newIsMobile) {
        try { appRef.current.freeze(); } catch (e) {}
      }
      
      // Restaurar estado del scroll (solo para escritorio). En móvil
      // preferimos forzar el centrado de SpaceInvaders al recrear.
      if (scrollStateRef.current && !newIsMobile) {
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

    // --- DEBUG: crear capa de marcadores de slots (solo en móvil) ---
    let debugLayer = cardsRef.current.querySelector('.__debugSlots');
    const isMobileNow = window.innerWidth <= 768;
    if (!debugLayer) {
      debugLayer = document.createElement('div');
      debugLayer.className = '__debugSlots';
      // Asegurar que el contenedor padre tenga positioning para que los
      // absolute de los marcadores funcionen.
      try { cardsRef.current.style.position = 'relative'; } catch (e) {}
      debugLayer.style.position = 'absolute';
      debugLayer.style.left = '0';
      debugLayer.style.top = '0';
      debugLayer.style.width = '100%';
      debugLayer.style.height = '100%';
      debugLayer.style.pointerEvents = 'none';
      debugLayer.style.zIndex = '9999';
      cardsRef.current.appendChild(debugLayer);
    }

    // Asegurar número de marcadores igual al número de posiciones
    try {
      while (debugLayer.children.length < positions.length) {
        const m = document.createElement('div');
        m.style.position = 'absolute';
        m.style.top = '0';
        m.style.height = '100%';
        m.style.pointerEvents = 'none';
        m.style.boxSizing = 'border-box';
        m.style.zIndex = '9999';
        m.style.display = 'none';
        m.style.color = 'white';
        m.style.fontSize = '12px';
        m.style.textAlign = 'center';
        m.style.lineHeight = '18px';
        m.style.paddingTop = '6px';
        debugLayer.appendChild(m);
      }
      while (debugLayer.children.length > positions.length) {
        debugLayer.removeChild(debugLayer.lastChild);
      }
    } catch (e) {}
    const containerWidth = cardsRef.current.clientWidth;
    
    // Verificar si hay movimiento
    const hasMovement = Math.abs(
      appRef.current.scroll.current - appRef.current.scroll.last
    ) > 0.01;

    cards.forEach((card, index) => {
      let translateX = 0;
      let translateY = 0;
      let rotateZ = 0;
      let scale = 1;
      let opacity = 1;
      if (positions[index]) {
        const pos = positions[index];
        scale = pos.scale.x / 10;
        translateX = pos.x * 60;
        translateY = pos.y * 50;
        rotateZ = pos.rotation * (180 / Math.PI);

        const fadeFactor = 0.04;
        const fadeExponent = 2; 
        opacity = Math.max(0, 1 - Math.pow(Math.abs(pos.x) * fadeFactor, fadeExponent));

        card.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotateZ(${rotateZ}deg) scale(${scale})`;
        card.style.opacity = opacity;
        
        // SOLO ESTA PARTE ES NUEVA - will-change dinámico
        if (hasMovement) {
          card.style.willChange = 'transform, opacity';
        } else {
          card.style.willChange = 'auto';
        }
      }

      // Actualizar marcador debug para este índice (solo en móvil)
      try {
        const marker = debugLayer.children[index];
        if (marker) {
          if (!isMobileNow) {
            marker.style.display = 'none';
          } else {
            marker.style.display = 'block';
            // ancho estimado del slot en px: usar card.width * 60 como aproximación
            const cardObj = appRef.current && appRef.current.cards ? appRef.current.cards[index] : null;
            const slotW = (cardObj && cardObj.width ? cardObj.width * 60 : 160);
            const left = Math.round(containerWidth / 2 + translateX - slotW / 2);
            marker.style.left = `${left}px`;
            marker.style.width = `${Math.max(40, slotW)}px`;
            marker.style.border = '2px dashed rgba(255,0,0,0.9)';
            marker.style.background = 'rgba(255,0,0,0.06)';
            // label con id del proyecto si está disponible
            try {
              const projectId = (appRef.current && appRef.current.cards && appRef.current.cards[index] && appRef.current.cards[index].project) ? appRef.current.cards[index].project.id : `idx:${index}`;
              marker.textContent = projectId;
            } catch (e) { marker.textContent = index; }
          }
        }
      } catch (e) {}
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

  // Observer para detectar cuando el carousel reaparece en pantalla (p.ej.
  // al volver desde otra sección). Si el contenedor vuelve a ser visible en
  // móvil/tablet, reenfocamos la tarjeta central a 'spaceinvaders' y volvemos
  // a congelar la interacción para asegurar comportamiento consistente.
  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const isMobileNow = window.innerWidth <= 768;
        if (isMobileNow && appRef.current) {
          const tryRestore = (attempt = 0) => {
            const app = appRef.current;
            if (!app) return;
            const ready = app.cards && app.cards.length > 0 && app.cards[0].plane && app.cards[0].plane.scale && app.cards[0].plane.scale.x && !isNaN(app.cards[0].plane.scale.x);
                if (ready || attempt > 9) {
                try {
                  // Asegurar que tamaños/posiciones están sincronizados antes de
                  // forzar la posición del scroll.
                  try { app.onResize && app.onResize(); } catch (e) {}

                  const projectCount = app.projects ? app.projects.length : 0;
                  let targetIndex = null;
                  if (projectCount > 0) {
                    for (let i = 0; i < app.cards.length; i++) {
                      const cardProject = app.cards[i].project;
                      if (cardProject && cardProject.id === 'spaceinvaders') {
                        if (i >= projectCount && i < projectCount * 2) {
                          targetIndex = i;
                          break;
                        }
                        if (targetIndex === null) targetIndex = i;
                      }
                    }
                  }

                  // Diagnostic logs to help debug slot positions on restore
                  try {
                    /* eslint-disable no-console */
                    console.log('[Carousel] restore attempt:', { projectCount, targetIndex });
                    if (app.cards && app.cards[0]) {
                      const cardWidthLog = app.cards[0].width || 0;
                      console.log('[Carousel] cardWidth:', cardWidthLog);
                    }
                    if (app.cards) {
                      app.cards.forEach((c, idx) => {
                        try {
                          const pid = c.project && c.project.id ? c.project.id : null;
                          console.log(`[Carousel] card[${idx}] pid=${pid} index=${c.index} x=${c.x} extra=${c.extra} isBefore=${c.isBefore} isAfter=${c.isAfter}`);
                        } catch (e) {}
                      });
                    }
                    /* eslint-enable no-console */
                  } catch (e) {}

                  if (targetIndex !== null && app.cards && app.cards[0]) {
                    const cardWidth = app.cards[0].width || 0;
                    const scrollPos = -cardWidth * targetIndex;

                    // Reset structural state on each card so we don't keep
                    // remnants from previous interactions (extra, isBefore/After)
                    try {
                      app.cards.forEach(card => {
                        try {
                          card.extra = 0;
                          card.isBefore = false;
                          card.isAfter = false;
                          // recalc sizes/positions
                          try { card.onResize({ screen: app.screen, viewport: app.viewport }); } catch (e) {}
                          card.x = card.width * card.index;
                        } catch (e) {}
                      });
                    } catch (e) {}

                    // Apply the scroll position and make last match so the
                    // direction calculation is deterministic.
                    app.scroll.current = scrollPos;
                    app.scroll.target = scrollPos;
                    app.scroll.last = scrollPos;

                    // Actualizar manualmente las posiciones de las tarjetas
                    // (sin depender del estado frozen) para que WebGL tenga sus
                    // valores correctos inmediatamente.
                    try {
                      const dir = app.scroll.current > app.scroll.last ? 'right' : 'left';
                      app.cards.forEach(card => {
                        try { card.update(app.scroll, dir); } catch (e) {}
                      });
                    } catch (e) {}

                    // Forzar render y actualizar el DOM (updateCards aplicará
                    // transform/opacity/clases)
                    try {
                      if (app.renderer && app.renderer.render) {
                        app.renderer.render({ scene: app.scene, camera: app.camera });
                      }
                      try { updateCards(); } catch (e) {}
                    } catch (e) {}
                  } else {
                    try { app.onCheck && app.onCheck(); } catch (e) {}
                  }

                  // Asegurar congelamiento en móvil
                  // Resetear la referencia del centro para forzar reaplicar la
                  // clase CSS en el loop de actualización del DOM.
                  try { lastAppliedCenterRef.current = -1; } catch (e) {}

                  // Descongelar brevemente para permitir que el loop de render
                  // y el updateCards apliquen transformaciones/cEntrada en DOM,
                  // luego volver a congelar para evitar interacción del usuario.
                  try {
                    if (app.unfreeze) app.unfreeze();
                  } catch (e) {}
                  setTimeout(() => {
                    try { if (app.freeze) app.freeze(); } catch (e) {}
                  }, 220);
                } catch (e) {
                  // ignorar pequeños errores
                }
            } else {
              requestAnimationFrame(() => tryRestore(attempt + 1));
            }
          };
          tryRestore();
        }
      }
    });
  };

  const intersectionObserver = new IntersectionObserver(observerCallback, { threshold: 0.05 });
  if (containerRef.current) intersectionObserver.observe(containerRef.current);

  return () => {
    window.removeEventListener('resize', debouncedResize);
    if (appRef.current) {
      appRef.current.destroy();
    }
    if (intersectionObserver) {
      try { intersectionObserver.disconnect(); } catch (e) {}
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

  const handlePlayClick = (projectId) => {
    // Reproducir sonido antes de navegar (hook)
    try { playSelected(); } catch (e) {}
    onPlayClick(projectId);
  };

  // Si estamos en móvil, renderizamos una carta estática centrada en lugar
  // del carousel WebGL. Esto evita problemas de posición y es más barato.
  const isMobileRender = typeof window !== 'undefined' && window.innerWidth <= 768;
  if (isMobileRender) {
    const project = projects.find(p => p.id === 'spaceinvaders') || projects[0] || duplicatedProjects[0];
    const gameplayClasses = getGameplayClasses(project.id);
    return (
      <div className={styles.circularCarousel}>
        <div className={styles.canvasContainer} />
        {/* Asegurar que el contenedor ocupe la pantalla para centrar la carta */}
        <div className={styles.cardsContainer} style={{ position: 'relative', minHeight: '100vh' }}>
          <div className={`${styles.cardWrapper}`}>
            <div
              className={`${styles.carouselItem} ${styles.projectCard} ${styles[project.colorClass]} ${styles[project.id]}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80vw',
                height: '110vw',
                maxHeight: '80vh',
                boxSizing: 'border-box'
              }}
            >
              <div className={styles.background} />
              <div className={styles.character} />
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
                    <div className={`${styles.playIcon} ${styles.playItem}`} />
                    <p className={`${styles.playText} ${styles.playItem}`}>JUGAR</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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