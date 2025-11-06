import React from 'react';

const OptimizedImage = ({ src, alt, className, ...props }) => {
  // Asume que src es la ruta base sin extensión, ejemplo: "/assets/1942/GokuIcon"
  return (
    <picture>
      <source type="image/avif" srcSet={`${src}.avif`} />
      <source type="image/webp" srcSet={`${src}.webp`} />
      <img
        src={`${src}.webp`}
        alt={alt}
        className={className}
        {...props}
      />
    </picture>
  );
};

export default OptimizedImage;