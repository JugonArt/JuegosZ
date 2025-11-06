// src/contexts/NubeContext.js
import React, { createContext, useState, useContext } from 'react';

// Crea el contexto con un valor por defecto para que los tests
// que renderizan componentes fuera del Provider no fallen al
// desestructurar useNube().
const NubeContext = createContext({ showNube: false, setShowNube: () => {} });

// Crea el "Provider" que envolverá tu aplicación
export const NubeProvider = ({ children }) => {
  const [showNube, setShowNube] = useState(false);

  // El valor que se comparte con los componentes
  const value = {
    showNube,
    setShowNube,
  };

  return <NubeContext.Provider value={value}>{children}</NubeContext.Provider>;
};

// Crea un "hook" personalizado para usar el contexto fácilmente
export const useNube = () => useContext(NubeContext);