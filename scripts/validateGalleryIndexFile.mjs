#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const [galleryDirArg, indexFileArg] = process.argv.slice(2);

if (!galleryDirArg || !indexFileArg) {
  console.error('Uso: node scripts/validateGalleryIndexFile.mjs <galleryDir> <indexFile>');
  process.exit(1);
}

const galleryDir = path.resolve(galleryDirArg);
const indexFile = path.resolve(indexFileArg);

function isHidden(name) {
  return String(name || '').startsWith('.');
}

const raw = await fs.readFile(indexFile, 'utf8');
const parsed = JSON.parse(raw);

if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
  console.error('gallery-index invalido: objeto esperado');
  process.exit(1);
}

let problems = 0;

for (const [folder, files] of Object.entries(parsed)) {
  if (!Array.isArray(files)) {
    console.error(`gallery-index invalido: pasta "${folder}" nao e array`);
    problems += 1;
    continue;
  }

  const seen = new Set();
  for (const filename of files) {
    if (typeof filename !== 'string' || !filename.trim()) {
      console.error(`Entrada invalida em "${folder}": nome vazio/invalido`);
      problems += 1;
      continue;
    }
    if (isHidden(filename)) {
      console.error(`Entrada oculta indevida em "${folder}": ${filename}`);
      problems += 1;
      continue;
    }
    if (seen.has(filename)) {
      console.error(`Duplicado em "${folder}": ${filename}`);
      problems += 1;
      continue;
    }
    seen.add(filename);

    const abs = path.join(galleryDir, folder, filename);
    try {
      const stat = await fs.stat(abs);
      if (!stat.isFile() || stat.size <= 0) {
        console.error(`Arquivo invalido no disco: ${folder}/${filename}`);
        problems += 1;
      }
    } catch {
      console.error(`Arquivo ausente no disco: ${folder}/${filename}`);
      problems += 1;
    }
  }
}

if (problems > 0) {
  console.error(`Falha na validacao do gallery-index: ${problems} problema(s)`);
  process.exit(1);
}

console.log('gallery-index valido');
