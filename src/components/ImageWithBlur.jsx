import React, { useState } from 'react';
import { getCloudinaryBlurUrl, getCloudinaryOptimizedUrl } from '../cloudinaryUtils';

export default function ImageWithBlur({ src, alt, className = '', style = {}, loading = 'lazy', ...props }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full">
      {/* Blur up: imagem borrada de fundo */}
      <img
        src={getCloudinaryBlurUrl(src)}
        alt=""
        className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-105 transition-opacity duration-500"
        style={{ opacity: loaded ? 0 : 1, zIndex: 1 }}
        aria-hidden="true"
        draggable={false}
      />
      {/* Imagem real com fade */}
      <img
        src={getCloudinaryOptimizedUrl(src)}
        alt={alt}
        className={`relative w-full h-full object-cover transition-opacity duration-700 ${className}`}
        style={{ ...style, opacity: loaded ? 1 : 0, zIndex: 2 }}
        onLoad={() => setLoaded(true)}
        draggable={false}
        loading={loading}
        {...props}
      />
    </div>
  );
} 
