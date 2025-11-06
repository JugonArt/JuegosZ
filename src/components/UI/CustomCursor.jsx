import React, { useEffect, useRef } from 'react';
import '../styles/CustomCursor.css';

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const currentPositionRef = useRef({ x: 0, y: 0 });
  const holdTimeoutRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const lastMoveTimeRef = useRef(Date.now());
  const checkInactivityIntervalRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const updateCursorPosition = (e) => {
      positionRef.current = { x: e.clientX, y: e.clientY };
      lastMoveTimeRef.current = Date.now();
      cursor.classList.remove('cursor-inactive');
      
      // Ocultar temporalmente el cursor para detectar el elemento real debajo
      const cursorDisplay = cursor.style.display;
      cursor.style.display = 'none';
      const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
      cursor.style.display = cursorDisplay;
      
      if (elementUnderCursor) {
        // Limpiar solo las clases de hover (no las de click/hold)
        cursor.classList.remove('cursor-pointer', 'cursor-hover');
        
        // Detectar elementos interactivos
        const isButton = elementUnderCursor.tagName === 'BUTTON' || 
                         elementUnderCursor.closest('button');
        const isLink = elementUnderCursor.tagName === 'A' || 
                       elementUnderCursor.closest('a');
        const isInput = elementUnderCursor.tagName === 'INPUT' ||
                       elementUnderCursor.tagName === 'TEXTAREA' ||
                       elementUnderCursor.closest('input, textarea');
        const hasOnClick = elementUnderCursor.onclick || 
                          elementUnderCursor.closest('[onclick]');
        
        // Agregar clase pointer si es un elemento interactivo
        if (isButton || isLink || hasOnClick) {
          cursor.classList.add('cursor-hover', 'cursor-pointer');
        } else if (isInput) {
          cursor.classList.add('cursor-hover', 'cursor-text');
        }
      }
    };

    const animate = () => {
      const dx = positionRef.current.x - currentPositionRef.current.x;
      const dy = positionRef.current.y - currentPositionRef.current.y;
      
      currentPositionRef.current.x += dx * 0.15;
      currentPositionRef.current.y += dy * 0.15;

      cursor.style.left = `${currentPositionRef.current.x}px`;
      cursor.style.top = `${currentPositionRef.current.y}px`;
      
      requestAnimationFrame(animate);
    };

    const handleMouseDown = (e) => {
      // Agregar clase de click inmediatamente
      cursor.classList.add('cursor-click');
      
      // Limpiar timeout anterior si existe
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      
      // Después de 800ms de mantener presionado, activar cursor-grab
      holdTimeoutRef.current = setTimeout(() => {
        cursor.classList.remove('cursor-click');
        cursor.classList.add('cursor-grab');
      }, 500);
    };

    const handleMouseUp = () => {
      // Limpiar el timeout si se suelta antes de tiempo
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
      
      // Remover clases de click y grab
      cursor.classList.remove('cursor-grab');
      
      // Si tenía cursor-click, mantenerlo brevemente antes de quitarlo
      if (cursor.classList.contains('cursor-click')) {
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
        }
        
        clickTimeoutRef.current = setTimeout(() => {
          cursor.classList.remove('cursor-click');
        }, 200);
      }
    };

    window.addEventListener('mousemove', updateCursorPosition);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    animate();

    // Iniciar el intervalo de verificación de inactividad
    checkInactivityIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastMove = now - lastMoveTimeRef.current;
      
      if (timeSinceLastMove >= 2000) {
        cursor.classList.add('cursor-inactive');
      }
    }, 100); // Verificar cada 100ms

    return () => {
      window.removeEventListener('mousemove', updateCursorPosition);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      if (checkInactivityIntervalRef.current) {
        clearInterval(checkInactivityIntervalRef.current);
      }
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" />;
};
export default CustomCursor;
