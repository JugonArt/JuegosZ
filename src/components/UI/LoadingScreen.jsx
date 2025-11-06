import React, { useState, useEffect } from 'react';
import styles from '../styles/LoadingScreen.module.css';

const LoadingScreen = ({ onLoadComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let imageCount = 0;
    let loadedCount = 0;
    let fontsLoaded = false;
    let domReady = false;

    // Función para actualizar el progreso
    const updateProgress = () => {
      // Calcular progreso total
      const imageProgress = imageCount > 0 ? (loadedCount / imageCount) * 70 : 70;
      const fontProgress = fontsLoaded ? 20 : 0;
      const domProgress = domReady ? 10 : 0;
      
      const totalProgress = Math.min(100, imageProgress + fontProgress + domProgress);
      setProgress(totalProgress);

      // Si llegamos al 100%, iniciar animación de salida
      if (totalProgress >= 100 && !isComplete) {
        setIsComplete(true);
        setTimeout(() => {
          onLoadComplete?.();
        }, 800); // Tiempo para la animación de salida
      }
    };

    // Detectar todas las imágenes en el documento
    const images = document.querySelectorAll('img');
    const backgroundImages = [];
    
    // Buscar imágenes de fondo en elementos
    document.querySelectorAll('*').forEach(el => {
      const bgImage = window.getComputedStyle(el).backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const matches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/g);
        if (matches) {
          matches.forEach(match => {
            const url = match.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1');
            if (url && !url.startsWith('data:')) {
              backgroundImages.push(url);
            }
          });
        }
      }
    });

    imageCount = images.length + backgroundImages.length;

    // Si no hay imágenes, solo esperar fonts y DOM
    if (imageCount === 0) {
      imageCount = 1;
      loadedCount = 1;
    }

    // Cargar imágenes normales
    images.forEach(img => {
      if (img.complete) {
        loadedCount++;
        updateProgress();
      } else {
        img.addEventListener('load', () => {
          loadedCount++;
          updateProgress();
        });
        img.addEventListener('error', () => {
          loadedCount++;
          updateProgress();
        });
      }
    });

    // Cargar imágenes de fondo
    backgroundImages.forEach(url => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        updateProgress();
      };
      img.onerror = () => {
        loadedCount++;
        updateProgress();
      };
      img.src = url;
    });

    // Verificar fuentes
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fontsLoaded = true;
        updateProgress();
      });
    } else {
      // Fallback si no hay soporte para Font Loading API
      setTimeout(() => {
        fontsLoaded = true;
        updateProgress();
      }, 100);
    }

    // DOM completamente cargado
    if (document.readyState === 'complete') {
      domReady = true;
      updateProgress();
    } else {
      window.addEventListener('load', () => {
        domReady = true;
        updateProgress();
      });
    }

    // Actualización inicial
    updateProgress();

    // Timeout de seguridad (máximo 10 segundos)
    const timeout = setTimeout(() => {
      if (!isComplete) {
        setProgress(100);
        setIsComplete(true);
        setTimeout(() => {
          onLoadComplete?.();
        }, 800);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isComplete, onLoadComplete]);

  return (
    <div className={`${styles.loadingScreen} ${isComplete ? styles.fadeOut : ''}`}>
          <div className={styles.background} />
      <div className={styles.loadingContent}>
        {/* Logo o título de tu juego */}
        <div className={styles.logo}>
          <div className={styles.dragonBall} />
        </div>

        {/* Barra de progreso */}
        <div className={styles.progressContainer}>
                {/* Texto de carga */}
        <div className={styles.progressText}>
            {Math.round(progress)}%
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>

        </div>
      </div>

      {/* Efecto de fondo animado */}
      <div className={styles.backgroundEffect}>
        <div className={styles.circle} />
        <div className={styles.circle} />
        <div className={styles.circle} />
      </div>
    </div>
  );
};

export default LoadingScreen;