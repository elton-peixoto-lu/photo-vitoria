import { getGaleriaCache, setGaleriaCache } from './cacheGalerias.js';

const INDEX_TTL_MS = 60 * 1000;
const DEFAULT_GALLERY_INDEX_URL = 'https://cdn.jsdelivr.net/gh/elton-peixoto-lu/photo-vitoria@master/gallery-index.json';
const DEFAULT_GALLERY_MEDIA_BASE_URL = 'https://cdn.jsdelivr.net/gh/elton-peixoto-lu/photo-vitoria@master/public/images/galeria';

let galleryIndexPromise = null;
let galleryIndexLoadedAt = 0;

function getViteEnv() {
  return (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
}

function getGalleryIndexUrl() {
  return String(getViteEnv().VITE_GALLERY_INDEX_URL || DEFAULT_GALLERY_INDEX_URL).trim();
}

function getGalleryMediaBaseUrl() {
  return String(getViteEnv().VITE_GALLERY_MEDIA_BASE_URL || DEFAULT_GALLERY_MEDIA_BASE_URL)
    .trim()
    .replace(/\/$/, '');
}

function buildGalleryAssetUrl(folder, filename) {
  return `${getGalleryMediaBaseUrl()}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
}

async function loadGalleryIndex() {
  if (galleryIndexPromise && Date.now() - galleryIndexLoadedAt < INDEX_TTL_MS) {
    return galleryIndexPromise;
  }

  const indexUrl = `${getGalleryIndexUrl()}?t=${Date.now()}`;
  galleryIndexPromise = (async () => {
    const response = await fetch(indexUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Falha ao carregar gallery-index.json: HTTP ${response.status}`);
    }

    const data = await response.json();
    galleryIndexLoadedAt = Date.now();
    return data;
  })().catch((error) => {
    galleryIndexPromise = null;
    galleryIndexLoadedAt = 0;
    throw error;
  });

  return galleryIndexPromise;
}

export function resolveGalleryImageUrl(image) {
  if (typeof image === 'string') return image;
  if (typeof image?.url === 'string') return image.url;
  return '';
}

export function getGalleryFallbackUrl(folder) {
  const label = encodeURIComponent(String(folder || 'galeria').replace(/-/g, ' '));
  return `data:image/svg+xml;utf8,`
    + `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1500'>`
    + `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>`
    + `<stop offset='0%' stop-color='%23ffe4ef'/>`
    + `<stop offset='100%' stop-color='%23fffbe9'/>`
    + `</linearGradient></defs>`
    + `<rect width='1200' height='1500' fill='url(%23g)'/>`
    + `<text x='50%25' y='50%25' text-anchor='middle' font-family='Arial,sans-serif' font-size='42' fill='%23c35a86'>${label}</text>`
    + `</svg>`;
}

export function filterRenderableGalleryImages(images = [], folder = 'galeria') {
  const seenUrls = new Set();

  return images
    .filter((image) => {
      const url = resolveGalleryImageUrl(image);
      if (!url || seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    })
    .map((image, index) => {
      if (typeof image === 'string') {
        return {
          url: image,
          thumb: image,
          public_id: `safe_${folder}_${index}`,
        };
      }

      return {
        ...image,
        url: resolveGalleryImageUrl(image),
        public_id: image?.public_id || `safe_${folder}_${index}`,
      };
    });
}

export async function loadGalleryImages(folder) {
  const cached = getGaleriaCache(folder, 'jsdelivr');
  if (cached && cached.length > 0) {
    return filterRenderableGalleryImages(cached, folder);
  }

  try {
    const index = await loadGalleryIndex();
    const files = Array.isArray(index?.[folder]) ? index[folder] : [];

    const images = files.map((filename, idx) => {
      const url = buildGalleryAssetUrl(folder, filename);
      return {
        url,
        thumb: url,
        public_id: `cdn_${folder}_${idx}`,
      };
    });

    const safe = filterRenderableGalleryImages(images, folder);
    setGaleriaCache(folder, safe, 'jsdelivr');
    return safe;
  } catch (error) {
    console.error(`Erro ao carregar galeria ${folder} via jsDelivr:`, error);
    return [];
  }
}

export function getCircuitBreakerStats() {
  return { state: 'DISABLED', failureCount: 0, lastFailureTime: null };
}

export function resetCircuitBreaker() {
  return;
}
