import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  filterRenderableGalleryImages,
  getGalleryFallbackUrl,
  loadLocalImages,
} from '../src/localAssetsLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GALLERY_ROOT = path.join(__dirname, '..', 'public', 'images', 'galeria');
const GALLERY_FOLDERS = ['casamentos', 'infantil', 'femininos', 'pre-weding', 'noivas'];

function normalizeLegacyFamilyFromUrl(url) {
  return url
    .split('/')
    .pop()
    .replace(/\.avif$/i, '')
    .replace(/_[a-z0-9]{6,}$/i, '')
    .toLowerCase();
}

test('loadLocalImages entrega galerias coerentes com os arquivos publicados', () => {
  for (const folder of GALLERY_FOLDERS) {
    const fotos = loadLocalImages(folder);
    const urls = fotos.map((foto) => foto.url);
    const families = fotos.map((foto) => normalizeLegacyFamilyFromUrl(foto.url));
    const uniqueUrls = new Set(urls);
    const uniqueFamilies = new Set(families);
    const publishedFiles = fs
      .readdirSync(path.join(GALLERY_ROOT, folder))
      .filter((file) => file.endsWith('.avif'))
      .sort((left, right) => left.localeCompare(right))
      .map((file) => `/images/galeria/${folder}/${file}`);

    assert.ok(fotos.length > 0, `${folder} deveria ter fotos publicadas`);
    assert.equal(fotos.length, uniqueUrls.size, `${folder} nao deveria repetir URLs`);
    assert.equal(
      fotos.length,
      uniqueFamilies.size,
      `${folder} nao deveria repetir familias legadas`,
    );
    assert.ok(
      urls.every((url) => url.startsWith(`/images/galeria/${folder}/`) && url.endsWith('.avif')),
      `${folder} deveria expor apenas urls AVIF validas da galeria`,
    );
    assert.ok(
      publishedFiles.every((file) => file.startsWith(`/images/galeria/${folder}/`)),
      `${folder} deveria manter o padrao esperado de publicacao`,
    );
  }
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
