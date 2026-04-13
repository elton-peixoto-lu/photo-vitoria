// Cache em memória para as imagens das galerias
const galeriaCache = {};

export function getGaleriaCache(pasta, signature) {
  const cacheEntry = galeriaCache[pasta];
  if (!cacheEntry) return null;

  if (Array.isArray(cacheEntry)) {
    return cacheEntry;
  }

  if (signature && cacheEntry.signature && cacheEntry.signature !== signature) {
    return null;
  }

  return cacheEntry.fotos || null;
}

export function setGaleriaCache(pasta, fotos, signature) {
  galeriaCache[pasta] = { fotos, signature };
}

export function clearGaleriaCache(pasta) {
  if (pasta) {
    delete galeriaCache[pasta];
    return;
  }

  Object.keys(galeriaCache).forEach((key) => {
    delete galeriaCache[key];
  });
}
