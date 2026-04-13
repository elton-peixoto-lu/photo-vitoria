#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const CONFIG = {
  pendingDir: path.join(ROOT_DIR, 'uploads', 'pendentes'),
  publicDir: path.join(ROOT_DIR, 'public', 'images', 'galeria'),
  loaderFile: path.join(ROOT_DIR, 'src', 'localAssetsLoader.js'),
  maxWidth: 1200,
  maxHeight: 1800,
  quality: 85,
};

const FOLDERS = ['casamentos', 'infantil', 'femininos', 'pre-weding', 'noivas'];
const INPUT_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensurePendingFolders() {
  await fs.mkdir(CONFIG.pendingDir, { recursive: true });

  for (const folder of FOLDERS) {
    const folderPath = path.join(CONFIG.pendingDir, folder);
    await fs.mkdir(folderPath, { recursive: true });
    await fs.writeFile(path.join(folderPath, '.gitkeep'), '');
  }
}

async function listImageFiles(folderPath) {
  const files = [];

  async function walk(currentPath) {
    if (!(await pathExists(currentPath))) return;

    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (INPUT_EXTENSIONS.has(extension)) {
        files.push(entryPath);
      }
    }
  }

  await walk(folderPath);
  return files.sort((a, b) => a.localeCompare(b));
}

function slugify(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const slug = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);

  return slug || 'foto';
}

async function createOutputName(inputPath) {
  const buffer = await fs.readFile(inputPath);
  const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 10);
  return {
    buffer,
    fileName: `${slugify(inputPath)}-${hash}.avif`,
  };
}

async function processPendingFolder(folder) {
  const pendingFolder = path.join(CONFIG.pendingDir, folder);
  const outputFolder = path.join(CONFIG.publicDir, folder);
  const inputFiles = await listImageFiles(pendingFolder);

  if (inputFiles.length === 0) {
    console.log(`[${folder}] sem fotos pendentes`);
    return { processed: 0, skipped: 0 };
  }

  await fs.mkdir(outputFolder, { recursive: true });

  let processed = 0;
  let skipped = 0;

  for (const inputFile of inputFiles) {
    const { buffer, fileName } = await createOutputName(inputFile);
    const outputPath = path.join(outputFolder, fileName);

    if (await pathExists(outputPath)) {
      skipped++;
      await fs.rm(inputFile);
      console.log(`[${folder}] ja existia: ${fileName}`);
      continue;
    }

    await sharp(buffer)
      .rotate()
      .resize(CONFIG.maxWidth, CONFIG.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .avif({
        quality: CONFIG.quality,
        effort: 4,
      })
      .toFile(outputPath);

    processed++;
    await fs.rm(inputFile);
    console.log(`[${folder}] processada: ${path.basename(inputFile)} -> ${fileName}`);
  }

  return { processed, skipped };
}

async function buildLocalMapping() {
  const mapping = {};

  for (const folder of FOLDERS) {
    const folderPath = path.join(CONFIG.publicDir, folder);
    if (!(await pathExists(folderPath))) {
      mapping[folder] = [];
      continue;
    }

    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    mapping[folder] = entries
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.avif')
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  }

  return mapping;
}

async function updateLocalMapping() {
  const content = await fs.readFile(CONFIG.loaderFile, 'utf8');
  const mapping = await buildLocalMapping();
  const mappingCode = `const LOCAL_IMAGES_MAP = ${JSON.stringify(mapping, null, 2)};`;
  const updatedContent = content.replace(/const LOCAL_IMAGES_MAP = \{[\s\S]*?\};/, mappingCode);

  if (updatedContent === content) {
    console.log('Mapeamento local ja estava atualizado');
    return;
  }

  if (!updatedContent.includes(mappingCode)) {
    throw new Error('Nao foi possivel atualizar LOCAL_IMAGES_MAP');
  }

  await fs.writeFile(CONFIG.loaderFile, updatedContent, 'utf8');
  console.log('Mapeamento local atualizado');
}

async function main() {
  await ensurePendingFolders();

  let totalProcessed = 0;
  let totalSkipped = 0;

  for (const folder of FOLDERS) {
    const result = await processPendingFolder(folder);
    totalProcessed += result.processed;
    totalSkipped += result.skipped;
  }

  await updateLocalMapping();

  console.log(`Resumo: ${totalProcessed} processadas, ${totalSkipped} duplicadas ignoradas`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
