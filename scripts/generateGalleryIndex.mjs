#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const GALLERY_DIR = path.join(ROOT_DIR, 'public', 'images', 'galeria');

async function main() {
  const index = {};
  const folders = await fs.readdir(GALLERY_DIR, { withFileTypes: true });

  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    const folderPath = path.join(GALLERY_DIR, folder.name);
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    index[folder.name] = files
      .filter((file) => file.isFile() && !file.name.startsWith('.'))
      .map((file) => file.name)
      .sort((left, right) => left.localeCompare(right));
  }

  process.stdout.write(`${JSON.stringify(index, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
