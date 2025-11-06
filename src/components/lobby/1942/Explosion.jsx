import React, { useEffect, useState } from 'react';
import styles from '../../styles/1942/Objects.module.css'
const Explosion = ({ explosion }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Iniciar animación inmediatamente
    setAnimate(true);
  }, []);

  // Configuración según el tipo de explosión
  const getExplosionConfig = (type) => {
    switch(type) {
      case 'small':
        return {
          size: 40,
          duration: 800,
          particles: 8,
          colors: ['#ff4444', '#ff8800', '#ffff00'],
          shadowIntensity: 'light'
        };
      case 'medium':
        return {
          size: 60,
          duration: 1000,
          particles: 12,
          colors: ['#ff6b35', '#f7931e', '#ffcc02'],
          shadowIntensity: 'medium'
        };
      case 'large':
        return {
          size: 80,
          duration: 1200,
          particles: 16,
          colors: ['#ff6b35', '#f7931e', '#ffcc02', '#fff200'],
          shadowIntensity: 'heavy'
        };
      case 'huge':
        return {
          size: 100,
          duration: 1500,
          particles: 20,
          colors: ['#ff1744', '#ff6b35', '#f7931e', '#ffcc02', '#fff200'],
          shadowIntensity: 'extreme'
        };
      default:
        return {
          size: 50,
          duration: 1000,
          particles: 10,
          colors: ['#ff4444', '#ff8800', '#ffff00'],
          shadowIntensity: 'medium'
        };
    }
  };

  const config = getExplosionConfig(explosion.type);

  // Generar partículas aleatorias
  const generateParticles = () => {
    return Array.from({ length: config.particles }, (_, index) => ({
      id: index,
      angle: (360 / config.particles) * index + Math.random() * 30,
      distance: Math.random() * (config.size * 0.8),
      size: Math.random() * 8 + 4,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      delay: Math.random() * 200
    }));
  };

  const particles = generateParticles();

  const getShadowStyle = (intensity) => {
    const shadows = {
      light: '0 0 20px #ff4444, 0 0 40px #ff8800',
      medium: '0 0 30px #ff6b35, 0 0 60px #f7931e',
      heavy: '0 0 40px #ff6b35, 0 0 80px #f7931e, 0 0 120px #ffcc02',
      extreme: '0 0 50px #ff1744, 0 0 100px #ff6b35, 0 0 150px #f7931e, 0 0 200px #ffcc02'
    };
    return shadows[intensity] || shadows.medium;
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: explosion.x - config.size / 2,
        top: explosion.y - config.size / 2,
        width: config.size,
        height: config.size,
        zIndex: 100,
      }}
    >
      {/* Explosión principal */}
      <div
        className={`absolute inset-0 rounded-full ${animate ? 'animate-explosion-main' : ''}`}
        style={{
          background: `radial-gradient(circle, ${config.colors.join(', ')}, transparent)`,
          boxShadow: getShadowStyle(config.shadowIntensity),
          animationDuration: `${config.duration}ms`,
        }}
      />

      {/* Flash inicial */}
      <div
        className={`absolute inset-0 rounded-full ${animate ? 'animate-explosion-flash' : ''}`}
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, transparent 50%)',
          animationDuration: `${config.duration * 0.3}ms`,
        }}
      />

      {/* Ondas de choque */}
      {(explosion.type === 'large' || explosion.type === 'huge') && (
        <>
          <div
            className={`absolute inset-0 rounded-full border-2 ${animate ? 'animate-explosion-shockwave' : ''}`}
            style={{
              borderColor: config.colors[0],
              animationDuration: `${config.duration * 0.8}ms`,
              animationDelay: `${config.duration * 0.1}ms`,
            }}
          />
          <div
            className={`absolute inset-0 rounded-full border-2 ${animate ? 'animate-explosion-shockwave' : ''}`}
            style={{
              borderColor: config.colors[1],
              animationDuration: `${config.duration * 0.9}ms`,
              animationDelay: `${config.duration * 0.2}ms`,
            }}
          />
        </>
      )}

      {/* Partículas */}
{particles.map((particle) => (
  <div
    key={particle.id}
    className={`absolute ${animate ? 'animate-explosion-particle' : ''}`}
    style={{
      left: '50%',
      top: '50%',
      width: particle.size,
      height: particle.size,
      backgroundColor: particle.color,
      borderRadius: '50%',
      // Quitamos el transform aquí para usar las variables CSS
      
      // Pasar variables CSS para el keyframe
      '--particle-angle': `${particle.angle}deg`,
      '--particle-distance': `${particle.distance}px`,

      animationDuration: `${config.duration}ms`,
      animationDelay: `${particle.delay}ms`,
      boxShadow: `0 0 10px ${particle.color}`,
    }}
  />
))}

      {/* Estilos CSS en línea para las animaciones */}
      <style>{`
      
        @keyframes explosion-main {
          0% {
            transform: scale(0.1);
            opacity: 1;
          }
          20% {
            transform: scale(1.2);
            opacity: 1;
          }
          60% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        @keyframes explosion-flash {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(0.8);
            opacity: 0.9;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        @keyframes explosion-shockwave {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }

        @keyframes explosion-particle {
          0% {
            transform: translate(-50%, -50%) rotate(${0}deg) translateY(0) scale(1);
            opacity: 1;
          }
          70% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) rotate(${0}deg) translateY(-${config.size}px) scale(0.2);
            opacity: 0;
          }
        }
  @keyframes explosion-particle-move {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) rotate(var(--particle-angle)) translate(0, 0) scale(1);
    }
    100% {
      opacity: 0;
      /* Mueve la partícula hacia afuera a su distancia máxima y la encoge */
      transform: translate(-50%, -50%) rotate(var(--particle-angle)) translate(0, -var(--particle-distance)) scale(0.2);
    }
  }

  .animate-explosion-particle {
    animation: explosion-particle-move ease-out forwards;
  }

        .animate-explosion-main {
          animation: explosion-main ease-out forwards;
        }

        .animate-explosion-flash {
          animation: explosion-flash ease-out forwards;
        }

        .animate-explosion-shockwave {
          animation: explosion-shockwave ease-out forwards;
        }

        .animate-explosion-particle {
          animation: explosion-particle ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Explosion;