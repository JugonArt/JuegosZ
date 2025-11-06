import React, { useEffect, useState } from 'react';

const VideoPlayer = ({ onSkip }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide después de 14 segundos
    const timer = setTimeout(() => {
      handleHideVideo();
    }, 14000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleHideVideo = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
    }, 500); // Tiempo para la animación de desaparición
  };

  const handleSkipClick = () => {
    handleHideVideo();
  };

  return (
    <div className={`video-container ${!isVisible ? 'hiding' : ''}`}>
      <iframe
        width="100%"
        height="100%"
        src="https://www.youtube.com/embed/a0j9p1-UhfQ?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&start=0&end=14&enablejsapi=1"
        title="Dragon Ball Intro"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        style={{ border: 'none' }}
      />
      
      <button
        onClick={handleSkipClick}
        className="skip-button"
      >
        Saltar intro
      </button>

      <style jsx>{`
        .video-container {
          width: 100vw;
          height: 110vh;
          left: 0;
          top: -4vw;
          display: block;
          transition: opacity 0.5s ease-out;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          position: absolute;
          z-index: 10;
        }

        .video-container.hiding {
          opacity: 0;
          pointer-events: none;
        }

        .skip-button {
          position: absolute;
          bottom: 5vw;
          right: 5vw;
          width: 7vw;
          height: 3vw;
          background: #f7665c;
          color: white;
          border: none;
          padding: 0.2vw 0.5vw;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          z-index: 1000;
          transition: all 0.3s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .skip-button:hover {
          background: #fdafa9;
        }

        /* Responsivo para dispositivos móviles */
        @media (max-width: 768px) {
          .video-container {
            width: 100%;
            height: 100vh;
            top: 0;
          }

          .skip-button {
            width: 20vw;
            height: 8vw;
            bottom: 10vw;
            right: 10vw;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;