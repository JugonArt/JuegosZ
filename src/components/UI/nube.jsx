// src/components/UI/nube.jsx
import React from 'react';
import { useNube } from '../../contexts/nubecontext.js';
import '../styles/UI.css'; // Asegúrate de tener los estilos en un archivo separado

const Nube = () => {
  const { showNube } = useNube();
  const audioRef = React.useRef(null);
  const prevShowRef = React.useRef(showNube);

  React.useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/LobbySounds/NimbusMoving.mp3');
      audioRef.current.volume = 0.6;
    }
    
    // Solo reproducir cuando showNube cambia de false a true
    if (showNube && !prevShowRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    
    prevShowRef.current = showNube;
  }, [showNube]);

  return (
    <div className={`nube ${showNube ? 'show' : ''}`}>
      {/* El contenido de la nube está en el CSS como background-image */}
    </div>
  );
};

export default Nube;