#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const [galleryDirArg, outputArg] = process.argv.slice(2);

if (!galleryDirArg || !outputArg) {
  console.error('Uso: node scripts/generateGalleryIndex.mjs <galleryDir> <outputFile>');
  process.exit(1);
}

const galleryDir = path.resolve(galleryDirArg);
const outputFile = path.resolve(outputArg);

async function buildGalleryIndex(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const index = {};

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const folderName = entry.name;
    const folderPath = path.join(rootDir, folderName);
    const folderEntries = await fs.readdir(folderPath, { withFileTypes: true });

    index[folderName] = folderEntries
      .filter((item) => item.isFile() && !item.name.startsWith('.'))
      .map((item) => item.name)
      .sort((left, right) => left.localeCompare(right));
  }

  return index;
}

const index = await buildGalleryIndex(galleryDir);
await fs.writeFile(outputFile, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(`gallery-index gerado em ${outputFile}`);
