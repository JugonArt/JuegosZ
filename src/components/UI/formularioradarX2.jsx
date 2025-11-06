import React, { useState } from 'react';
import styles from '../styles/forms.module.css';

const FormTateti = ({ onStart }) => {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [submitted1, setSubmitted1] = useState(false);
  const [submitted2, setSubmitted2] = useState(false);

  const handleSubmit1 = (e) => {
    e.preventDefault();
    if (!name1.trim()) return;
    setSubmitted1(true);
  };

  const handleSubmit2 = (e) => {
    e.preventDefault();
    if (!name2.trim()) return;
    setSubmitted2(true);
  };

  const handleStart = () => {
    if (submitted1 && submitted2) {
      onStart(name1.trim(), name2.trim());
    }
  };

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formContainer}>
        {/* Formulario Jugador 1 */}
        <form onSubmit={handleSubmit1} className={styles.gameForm}>
          <label className={styles.formLabel}>Jugador 1 (Gokú)</label>
          <input
            type="text"
            value={name1}
            onChange={(e) => {
              setName1(e.target.value);
              setSubmitted1(false); // Reiniciar si cambian el nombre
            }}
            className={styles.formControl}
            placeholder="Nombre del jugador 1"
            required
          />
          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.startButton}>
              Registrar Jugador 1
            </button>
          </div>
        </form>

        {/* Formulario Jugador 2 */}
        <form onSubmit={handleSubmit2} className={styles.gameForm}>
          <label className={styles.formLabel}>Jugador 2 (Vegeta)</label>
          <input
            type="text"
            value={name2}
            onChange={(e) => {
              setName2(e.target.value);
              setSubmitted2(false); // Reiniciar si cambian el nombre
            }}
            className={styles.formControl}
            placeholder="Nombre del jugador 2"
            required
          />
          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.startButton}>
              Registrar Jugador 2
            </button>
          </div>
        </form>
      </div>
              {/* Botón Empezar */}
        <div className={`${styles.buttonContainer} ${styles.buttonContainer2}`}>
          <button
            type="button"
            className={styles.startButton}
            onClick={handleStart}
            disabled={!(submitted1 && submitted2)} // Habilitado solo si ambos jugadores están registrados
          >
            ¡Empezar!
          </button>
        </div>
    </div>
  );
};

export default FormTateti;
