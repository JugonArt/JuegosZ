import React from 'react';
import styles from '../../styles/1942/Background.module.css';

// En Background.jsx
const Background = ({ videoSourceMP4, videoSourceWEBM }) => {
  return (
    <div className={styles.introVideoContainer} tabIndex={0}>
      <video className={styles.gameBackgroundVideo} autoPlay loop muted playsInline>
        {/* Prioriza WebM para mejor rendimiento, con MP4 como fallback */}
        {videoSourceWEBM && <source src={videoSourceWEBM} type="video/webm" />}
        {videoSourceMP4 && <source src={videoSourceMP4} type="video/mp4" />}
        Tu navegador no soporta el tag de video.
      </video>
    </div>
  );
};

export default Background;