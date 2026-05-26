import React, { useEffect, useState } from 'react';

function toRasterCandidate(url) {
  if (!url) return '';
  if (/\.avif(\?.*)?$/i.test(url)) {
    return url.replace(/\.avif(\?.*)?$/i, '.jpg$1');
  }
  return url;
}

export default function SafeImageWithBlur({ src, fallback, alt, className = '', style = {}, loading = 'lazy', ...props }) {
  const [error, setError] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const imgSrc = error ? fallback : src;
  const hasRenderableSource = Boolean(imgSrc || fallback);
  const fallbackRaster = '/images/fallback.jpg';
  const rasterSrc = toRasterCandidate(imgSrc) || fallback || fallbackRaster;
  const isAvifSource = /\.avif(\?.*)?$/i.test(String(imgSrc || ''));

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
        src={rasterSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-105 transition-opacity duration-500"
        style={{ opacity: loaded ? 0 : 1, zIndex: 1 }}
        aria-hidden="true"
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        onError={handleError}
      />
      {/* Imagem real com fade */}
      <picture>
        {isAvifSource && <source srcSet={imgSrc} type="image/avif" />}
        <img
          src={rasterSrc}
          alt={alt}
          className={`relative w-full h-full object-cover transition-opacity duration-700 ${className}`}
          style={{ ...style, opacity: loaded ? 1 : 0, zIndex: 2 }}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          loading={loading}
          {...props}
        />
      </picture>
    </div>
  );
}
