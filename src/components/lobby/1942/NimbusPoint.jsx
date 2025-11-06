// Crea este nuevo archivo: NimbusPoint.jsx
import React from 'react';

const NimbusPoint = ({ x, y, size, color, opacity }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: '50%',
        opacity: opacity,
        filter: 'blur(5px)',
        transform: 'translate(-50%, -50%)', // Centra el punto en las coordenadas
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default NimbusPoint;