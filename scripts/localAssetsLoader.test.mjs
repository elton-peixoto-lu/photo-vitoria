import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterRenderableGalleryImages,
  getGalleryFallbackUrl,
  loadLocalImages,
} from '../src/localAssetsLoader.js';

function normalizeLegacyFamilyFromUrl(url) {
  return url
    .split('/')
    .pop()
    .replace(/\.avif$/i, '')
    .replace(/_[a-z0-9]{6,}$/i, '')
    .toLowerCase();
}

test('loadLocalImages entrega apenas variantes canonicas por familia', () => {
  const fotos = loadLocalImages('infantil');
  const families = fotos.map((foto) => normalizeLegacyFamilyFromUrl(foto.url));
  const uniqueFamilies = new Set(families);

  assert.equal(fotos.length, uniqueFamilies.size);
  assert.equal(fotos.length, 9);
});

test('filterRenderableGalleryImages remove urls vazias e duplicadas', () => {
  const imagens = filterRenderableGalleryImages([
    { url: '/images/galeria/infantil/foto-1.avif', public_id: 'a' },
    { url: '/images/galeria/infantil/foto-1.avif', public_id: 'b' },
    '',
    { url: '' },
    '/images/galeria/infantil/foto-2.avif',
  ], 'infantil');

  assert.deepEqual(
    imagens.map((imagem) => imagem.url),
    [
      '/images/galeria/infantil/foto-1.avif',
      '/images/galeria/infantil/foto-2.avif',
    ],
  );
});

test('getGalleryFallbackUrl usa fallback generico estavel', () => {
  assert.equal(
    getGalleryFallbackUrl('infantil'),
    '/images/fallback.avif?gallery=infantil',
  );
});
