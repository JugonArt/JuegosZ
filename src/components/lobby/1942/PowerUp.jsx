"use client";

import styles from '../../styles/1942/Objects.module.css';

const PowerUp = ({ powerUp }) => {
  return (
    <div
      className={`${styles.absolute} ${styles.rounded} ${styles[powerUp.type]}`}
      style={{
        left: powerUp.x,
        top: powerUp.y,
        width: powerUp.width,
        height: powerUp.height,
        backgroundColor: "transparent",
      }}
    ></div>
  );
};

export default PowerUp;