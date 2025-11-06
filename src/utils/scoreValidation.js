// Score validation utilities

export const validatePlayerName = (name) => {
  const errors = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('El nombre es requerido');
    return { valid: false, errors };
  }

  const trimmed = name.trim();

  // Check if empty
  if (trimmed.length === 0) {
    errors.push('El nombre no puede estar vacío');
  }

  // Check minimum length
  if (trimmed.length > 0 && trimmed.length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }

  // Check maximum length
  if (trimmed.length > 20) {
    errors.push('El nombre no puede tener más de 20 caracteres');
  }

  // Check if only numbers
  if (trimmed.length > 0 && /^\d+$/.test(trimmed)) {
    errors.push('El nombre no puede contener solo números');
  }

  // Check for invalid characters (optional: allow letters, numbers, spaces, basic symbols)
  if (trimmed.length > 0 && !/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ._-]+$/.test(trimmed)) {
    errors.push('El nombre contiene caracteres no permitidos');
  }

  // Reserved names (case-insensitive)
  const reservedNames = [
    'invitado', 'guest', 'player', 'jugador', 'admin', 
    'jugador 1', 'jugador 2', 'player 1', 'player 2',
    'bardock' // default placeholder
  ];
  
  if (reservedNames.includes(trimmed.toLowerCase())) {
    errors.push('Este nombre está reservado, por favor elige otro');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: trimmed
  };
};

// Format error messages for display
export const formatValidationErrors = (errors) => {
  if (!errors || errors.length === 0) return '';
  return errors.join('. ');
};
