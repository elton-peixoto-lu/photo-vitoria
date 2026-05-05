#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Storage } from '@google-cloud/storage';
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
  watermarkEnabled: true,
  watermarkLogoPath: process.env.WATERMARK_LOGO_PATH || '',
  watermarkLogoUrl:
    process.env.WATERMARK_LOGO_URL ||
    'https://res.cloudinary.com/driuyeufs/image/upload/v1749126164/logo_ozilmf.png',
  watermarkOpacity: Number(process.env.WATERMARK_OPACITY || 0.24),
};

const INPUT_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);
const storage = new Storage();
let cachedWatermarkLogoBuffer = null;

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

async function listManifestFiles(config) {
  const manifestsDir = path.join(ROOT_DIR, 'uploads', 'manifests');
  if (!(await pathExists(manifestsDir))) return [];
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
      if (entry.name.toLowerCase().endsWith('.json')) {
        files.push(entryPath);
      }
    }
  }
  await walk(manifestsDir);
  return files.sort((a, b) => a.localeCompare(b));
}

async function materializeManifestsToPending(config) {
  const manifestFiles = await listManifestFiles(config);
  if (manifestFiles.length === 0) return 0;

  let hydrated = 0;
  for (const manifestPath of manifestFiles) {
    const raw = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);
    const folder = manifest?.folder;
    const files = Array.isArray(manifest?.files) ? manifest.files : [];

    if (!config.folders.includes(folder) || files.length === 0) {
      await fs.rm(manifestPath, { force: true });
      continue;
    }

    const pendingFolder = path.join(config.pendingDir, folder);
    await fs.mkdir(pendingFolder, { recursive: true });

    for (const file of files) {
      const bucket = String(file?.bucket || '').trim();
      const objectPath = String(file?.objectPath || '').trim();
      const originalName = String(file?.originalName || '').trim();
      if (!bucket || !objectPath || !originalName) continue;

      const safeFileName = sanitizeFileName(originalName);
      const destinationPath = path.join(pendingFolder, safeFileName);
      const tempPath = `${destinationPath}.download`;

      await storage.bucket(bucket).file(objectPath).download({ destination: tempPath });
      await fs.rename(tempPath, destinationPath);
      await storage.bucket(bucket).file(objectPath).delete({ ignoreNotFound: true });
      hydrated++;
    }

    await fs.rm(manifestPath, { force: true });
  }

  return hydrated;
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

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function loadWatermarkLogoBuffer(config) {
  if (cachedWatermarkLogoBuffer) {
    return cachedWatermarkLogoBuffer;
  }

  if (config.watermarkLogoPath) {
    try {
      cachedWatermarkLogoBuffer = await fs.readFile(config.watermarkLogoPath);
      return cachedWatermarkLogoBuffer;
    } catch (error) {
      console.warn(`Nao foi possivel ler WATERMARK_LOGO_PATH: ${error.message}`);
    }
  }

  if (config.watermarkLogoUrl) {
    try {
      const response = await fetch(config.watermarkLogoUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      cachedWatermarkLogoBuffer = Buffer.from(await response.arrayBuffer());
      return cachedWatermarkLogoBuffer;
    } catch (error) {
      console.warn(`Nao foi possivel baixar a logo da marca d'agua: ${error.message}`);
    }
  }

  return null;
}

async function createWatermarkOverlay(metadata, config) {
  const width = metadata.width || config.maxWidth;
  const height = metadata.height || config.maxHeight;
  const logoBuffer = await loadWatermarkLogoBuffer(config);

  if (logoBuffer) {
    const logoWidth = Math.max(120, Math.round(width * 0.16));
    const preparedLogo = await sharp(logoBuffer)
      .resize({ width: logoWidth, withoutEnlargement: true })
      .ensureAlpha()
      .modulate({ brightness: 1.02 })
      .linear(1, 0)
      .png()
      .toBuffer();

    const logoMetadata = await sharp(preparedLogo).metadata();
    const tileX = Math.max(logoWidth + 48, Math.round(width * 0.24));
    const tileY = Math.max((logoMetadata.height || logoWidth) + 56, Math.round(height * 0.22));
    const composites = [];

    for (let y = -Math.round(tileY * 0.35); y < height + tileY; y += tileY) {
      for (let x = -Math.round(tileX * 0.35); x < width + tileX; x += tileX) {
        composites.push({
          input: preparedLogo,
          left: x,
          top: y,
          blend: 'over',
          opacity: config.watermarkOpacity,
        });
      }
    }

    // Extra protection: add a stronger centered diagonal mark.
    const centerSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <text x="50%" y="50%" text-anchor="middle"
          fill="rgba(120,38,74,0.28)"
          font-size="${Math.max(28, Math.round(width * 0.04))}"
          font-family="Georgia, serif"
          font-weight="700"
          letter-spacing="8"
          transform="rotate(-22 ${Math.round(width / 2)} ${Math.round(height / 2)})">
          VITORIA FOTOGRAFIA
        </text>
      </svg>`,
    );
    composites.push({ input: centerSvg, left: 0, top: 0, blend: 'over' });

    return composites;
  }

  const text = escapeXml('VITORIA FOTOGRAFIA');
  const fontSize = Math.max(26, Math.round(width * 0.032));
  const stepY = Math.max(140, Math.round(height * 0.24));
  const rows = [];

  for (let y = 90; y < height + stepY; y += stepY) {
    rows.push(
      `<text x="50%" y="${y}" text-anchor="middle" fill="rgba(120, 38, 74, ${Math.min(
        config.watermarkOpacity + 0.03,
        0.18,
      )})" font-size="${fontSize}" font-family="Georgia, serif" letter-spacing="6" transform="rotate(-18 ${Math.round(
        width / 2,
      )} ${y})">${text}</text>`,
    );
  }

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${rows.join('')}</svg>`,
  );

  return [{ input: svg, left: 0, top: 0 }];
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

function normalizeLegacyFamily(name) {
  return name
    .replace(/\.avif$/i, '')
    .replace(/_[a-z0-9]{6,}$/i, '')
    .toLowerCase();
}

function compareLegacyFamilyPreference(leftName, rightName) {
  const leftHasLegacySuffix = /_[a-z0-9]{6,}\.avif$/i.test(leftName);
  const rightHasLegacySuffix = /_[a-z0-9]{6,}\.avif$/i.test(rightName);

  if (leftHasLegacySuffix !== rightHasLegacySuffix) {
    return leftHasLegacySuffix ? -1 : 1;
  }

  return compareFilePreference(leftName, rightName);
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

    const image = sharp(buffer)
      .rotate()
      .resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    const metadata = await image.metadata();
    if (config.watermarkEnabled) {
      const overlay = await createWatermarkOverlay(metadata, config);
      image.composite(overlay);
    }

    await image
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

  const remainingEntries = await fs.readdir(outputFolder, { withFileTypes: true });
  const familyToFiles = new Map();

  for (const entry of remainingEntries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.avif') {
      continue;
    }

    const familyKey = normalizeLegacyFamily(entry.name);
    if (!familyToFiles.has(familyKey)) {
      familyToFiles.set(familyKey, []);
    }

    familyToFiles.get(familyKey).push(entry.name);
  }

  for (const names of familyToFiles.values()) {
    if (names.length < 2) {
      continue;
    }

    const orderedNames = [...names].sort(compareLegacyFamilyPreference);
    const [, ...duplicates] = orderedNames;

    for (const duplicateName of duplicates) {
      await fs.rm(path.join(outputFolder, duplicateName));
      removed++;
      console.log(`[${folder}] duplicada por familia removida: ${duplicateName}`);
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
  const hydratedFromManifests = await materializeManifestsToPending(config);

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
    hydratedFromManifests,
  };

  console.log(
    `Resumo: ${summary.processed} processadas, ${summary.skipped} duplicadas ignoradas, ${summary.removedDuplicates} duplicadas removidas, ${summary.hydratedFromManifests} baixadas de manifesto`,
  );

  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runProcessPendingUploads().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
