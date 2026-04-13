#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

export const DEFAULT_CONFIG = {
  pendingDir: path.join(ROOT_DIR, 'uploads', 'pendentes'),
  publicDir: path.join(ROOT_DIR, 'public', 'images', 'galeria'),
  loaderFile: path.join(ROOT_DIR, 'src', 'localAssetsLoader.js'),
  maxWidth: 1200,
  maxHeight: 1800,
  quality: 85,
  folders: ['casamentos', 'infantil', 'femininos', 'pre-weding', 'noivas'],
};

const INPUT_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensurePendingFolders(config) {
  await fs.mkdir(config.pendingDir, { recursive: true });

  for (const folder of config.folders) {
    const folderPath = path.join(config.pendingDir, folder);
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
  return files.sort((leftPath, rightPath) => leftPath.localeCompare(rightPath));
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

function compareFilePreference(leftName, rightName) {
  const generatedPattern = /-[0-9a-f]{10}\.avif$/i;
  const leftGenerated = generatedPattern.test(leftName);
  const rightGenerated = generatedPattern.test(rightName);

  if (leftGenerated !== rightGenerated) {
    return leftGenerated ? -1 : 1;
  }

  if (leftName.length !== rightName.length) {
    return rightName.length - leftName.length;
  }

  return leftName.localeCompare(rightName);
}

export async function processPendingFolder(folder, config) {
  const pendingFolder = path.join(config.pendingDir, folder);
  const outputFolder = path.join(config.publicDir, folder);
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
      .resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .avif({
        quality: config.quality,
        effort: 4,
      })
      .toFile(outputPath);

    processed++;
    await fs.rm(inputFile);
    console.log(`[${folder}] processada: ${path.basename(inputFile)} -> ${fileName}`);
  }

  return { processed, skipped };
}

export async function dedupeOutputFolder(folder, config) {
  const outputFolder = path.join(config.publicDir, folder);
  if (!(await pathExists(outputFolder))) {
    return 0;
  }

  const entries = await fs.readdir(outputFolder, { withFileTypes: true });
  const hashToFiles = new Map();

  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.avif') {
      continue;
    }

    const filePath = path.join(outputFolder, entry.name);
    const buffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha1').update(buffer).digest('hex');

    if (!hashToFiles.has(hash)) {
      hashToFiles.set(hash, []);
    }

    hashToFiles.get(hash).push(entry.name);
  }

  let removed = 0;

  for (const names of hashToFiles.values()) {
    if (names.length < 2) {
      continue;
    }

    const orderedNames = [...names].sort(compareFilePreference);
    const [, ...duplicates] = orderedNames;

    for (const duplicateName of duplicates) {
      await fs.rm(path.join(outputFolder, duplicateName));
      removed++;
      console.log(`[${folder}] duplicada removida: ${duplicateName}`);
    }
  }

  return removed;
}

async function buildLocalMapping(config) {
  const mapping = {};

  for (const folder of config.folders) {
    const folderPath = path.join(config.publicDir, folder);
    if (!(await pathExists(folderPath))) {
      mapping[folder] = [];
      continue;
    }

    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    mapping[folder] = entries
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.avif')
      .map((entry) => entry.name)
      .sort((leftName, rightName) => leftName.localeCompare(rightName));
  }

  return mapping;
}

export async function updateLocalMapping(config) {
  const content = await fs.readFile(config.loaderFile, 'utf8');
  const mapping = await buildLocalMapping(config);
  const mappingCode = `const LOCAL_IMAGES_MAP = ${JSON.stringify(mapping, null, 2)};`;
  const updatedContent = content.replace(/const LOCAL_IMAGES_MAP = \{[\s\S]*?\};/, mappingCode);

  if (updatedContent === content) {
    console.log('Mapeamento local ja estava atualizado');
    return false;
  }

  if (!updatedContent.includes(mappingCode)) {
    throw new Error('Nao foi possivel atualizar LOCAL_IMAGES_MAP');
  }

  await fs.writeFile(config.loaderFile, updatedContent, 'utf8');
  console.log('Mapeamento local atualizado');
  return true;
}

export async function runProcessPendingUploads(config = DEFAULT_CONFIG) {
  await ensurePendingFolders(config);

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalRemovedDuplicates = 0;

  for (const folder of config.folders) {
    const result = await processPendingFolder(folder, config);
    totalProcessed += result.processed;
    totalSkipped += result.skipped;
    totalRemovedDuplicates += await dedupeOutputFolder(folder, config);
  }

  await updateLocalMapping(config);

  const summary = {
    processed: totalProcessed,
    skipped: totalSkipped,
    removedDuplicates: totalRemovedDuplicates,
  };

  console.log(
    `Resumo: ${summary.processed} processadas, ${summary.skipped} duplicadas ignoradas, ${summary.removedDuplicates} duplicadas removidas`,
  );

  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runProcessPendingUploads().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
