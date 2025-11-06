import { useState, useEffect } from 'react';

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const width = window.innerWidth;
      const height = window.innerHeight;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Detectar móviles
      const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod', 
        'blackberry', 'windows phone', 'mobile'
      ];
      const isMobileUserAgent = mobileKeywords.some(keyword => 
        userAgent.includes(keyword)
      );

      // Detectar por tamaño de pantalla y capacidad táctil
      const isMobileSize = width <= 768 && hasTouch;
      const isTabletSize = width > 768 && width <= 1024 && hasTouch;

      setIsMobile(isMobileUserAgent || isMobileSize);
      setIsTablet(isTabletSize);
      
      // Detectar orientación
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    // Verificar al cargar
    checkDevice();

    // Verificar al cambiar el tamaño de ventana
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkDevice, 100); // Delay para que se apliquen los cambios
    });

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    orientation,
    isTouchDevice: isMobile || isTablet
  };
};

export default useMobileDetection;