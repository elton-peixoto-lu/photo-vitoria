import React, { useEffect, useState } from 'react';

export default function SafeImageWithBlur({ src, fallback, alt, className = '', style = {}, loading = 'lazy', ...props }) {
  const [error, setError] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const imgSrc = error ? fallback : src;
  const hasRenderableSource = Boolean(imgSrc || fallback);

  useEffect(() => {
    setError(false);
    setFailed(false);
    setLoaded(false);
    setTriedFallback(false);
  }, [src, fallback]);

  const handleError = () => {
    if (!error && fallback && src !== fallback && !triedFallback) {
      setError(true);
      setTriedFallback(true);
      setLoaded(false);
      return;
    }

    setFailed(true);
    setLoaded(true);
  };

  if (!hasRenderableSource || failed) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-pink-100 to-white" aria-hidden="true" />
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Blur up: imagem borrada de fundo */}
      <img
        src={imgSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-105 transition-opacity duration-500"
        style={{ opacity: loaded ? 0 : 1, zIndex: 1 }}
        aria-hidden="true"
        draggable={false}
        onError={handleError}
      />
      {/* Imagem real com fade */}
      <img
        src={imgSrc}
        alt={alt}
        className={`relative w-full h-full object-cover transition-opacity duration-700 ${className}`}
        style={{ ...style, opacity: loaded ? 1 : 0, zIndex: 2 }}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        draggable={false}
        loading={loading}
        {...props}
      />
    </div>
  );
} 
