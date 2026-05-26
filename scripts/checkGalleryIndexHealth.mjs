#!/usr/bin/env node

const indexUrl = process.env.GALLERY_INDEX_URL || 'https://www.estudiovitoriafreitas.com.br/gallery-index.json';
const mediaBase = (process.env.GALLERY_MEDIA_BASE_URL || 'https://www.estudiovitoriafreitas.com.br').replace(/\/$/, '');

const response = await fetch(indexUrl, {
  headers: { Accept: 'application/json' },
  cache: 'no-store',
});

if (!response.ok) {
  console.error(`Falha ao ler index: HTTP ${response.status} (${indexUrl})`);
  process.exit(1);
}

const index = await response.json();
if (!index || typeof index !== 'object' || Array.isArray(index)) {
  console.error('gallery-index invalido: objeto esperado');
  process.exit(1);
}

const errors = [];
for (const [folder, files] of Object.entries(index)) {
  if (!Array.isArray(files)) {
    errors.push(`Pasta "${folder}" nao possui array de arquivos`);
    continue;
  }

  for (const file of files) {
    const filename = String(file || '').trim();
    if (!filename) {
      errors.push(`Entrada vazia em "${folder}"`);
      continue;
    }

    const url = `${mediaBase}/images/galeria/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (!res.ok) {
      errors.push(`${folder}/${filename} -> HTTP ${res.status}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Healthcheck falhou: ${errors.length} item(ns) com erro`);
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log('Healthcheck do gallery-index OK');
