// src/components/UI/BackButton.jsx
import React from 'react';

const BackButton = ({ onBack }) => {
  return (
    <button
      onClick={onBack} // onBack ya maneja la transición desde App.js
      className="backBtn"
      title="Volver al lobby"
    />
  );
};

export default BackButton;