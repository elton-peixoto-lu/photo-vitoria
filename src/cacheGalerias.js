// Cache em memória para as imagens das galerias
const galeriaCache = {};

export function getGaleriaCache(pasta) {
  return galeriaCache[pasta] || null;
}

export function setGaleriaCache(pasta, fotos) {
  galeriaCache[pasta] = fotos;
} 
