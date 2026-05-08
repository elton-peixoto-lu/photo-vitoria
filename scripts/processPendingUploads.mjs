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
  manifestsDir: path.join(ROOT_DIR, 'uploads', 'manifests'),
  publicDir: path.join(ROOT_DIR, 'public', 'images', 'galeria'),
  loaderFile: path.join(ROOT_DIR, 'src', 'localAssetsLoader.js'),
  maxWidth: 1200,
  maxHeight: 1800,
  quality: 85,
  folders: ['casamentos', 'infantil', 'femininos', 'pre-weding', 'noivas'],
  watermarkEnabled: true,
  watermarkLogoPath:
    process.env.WATERMARK_LOGO_PATH || path.join(ROOT_DIR, 'assets', 'watermark-logo.png'),
  watermarkLogoUrl: process.env.WATERMARK_LOGO_URL || '',
  watermarkOpacity: Number(process.env.WATERMARK_OPACITY || 0.04),
  requireWatermark: process.env.REQUIRE_WATERMARK !== 'false',
};

const INPUT_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);
const storage = new Storage();
let cachedWatermarkLogoBuffer = null;

async function buildTransparentWatermarkLogoBuffer(logoBuffer) {
  const { data, info } = await sharp(logoBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const output = Buffer.from(data);
  const background = { r: 246, g: 222, b: 222 };

  for (let index = 0; index < output.length; index += info.channels) {
    const dr = output[index] - background.r;
    const dg = output[index + 1] - background.g;
    const db = output[index + 2] - background.b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    if (distance < 26) {
      output[index + 3] = 0;
      continue;
    }

    if (distance < 40) {
      output[index + 3] = Math.round(((distance - 26) / 14) * 255);
    }
  }

  return sharp(output, { raw: info }).trim().png().toBuffer();
}

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

function sanitizeFileName(fileName) {
  if (typeof fileName !== 'string' || !fileName.includes('.')) {
    throw new Error('Nome de arquivo invalido');
  }

  const extension = path.extname(fileName).toLowerCase();
  if (!INPUT_EXTENSIONS.has(extension)) {
    throw new Error(`Formato nao permitido: ${fileName}`);
  }

  const baseName = fileName
    .slice(0, -extension.length)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  const hash = crypto.createHash('sha1').update(fileName).digest('hex').slice(0, 8);
  return `${Date.now()}-${baseName || 'foto'}-${hash}${extension}`;
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
  const manifestsDir = config.manifestsDir || path.join(ROOT_DIR, 'uploads', 'manifests');
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

async function loadWatermarkLogoBuffer(config) {
  if (cachedWatermarkLogoBuffer) {
    return cachedWatermarkLogoBuffer;
  }

  if (config.watermarkLogoPath) {
    try {
      const rawLogoBuffer = await fs.readFile(config.watermarkLogoPath);
      cachedWatermarkLogoBuffer = await buildTransparentWatermarkLogoBuffer(rawLogoBuffer);
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

      const rawLogoBuffer = Buffer.from(await response.arrayBuffer());
      cachedWatermarkLogoBuffer = await buildTransparentWatermarkLogoBuffer(rawLogoBuffer);
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
  if (config.requireWatermark && !logoBuffer) {
    throw new Error(
      "Marca d'agua obrigatoria: configure WATERMARK_LOGO_PATH ou WATERMARK_LOGO_URL com logo valida.",
    );
  }

  const horizontalPadding = Math.max(12, Math.round(width * 0.05));
  const verticalPadding = Math.max(12, Math.round(height * 0.05));
  const centerMaxWidth = Math.max(1, width - horizontalPadding * 2);
  const centerMaxHeight = Math.max(1, height - verticalPadding * 2);
  const accentMaxWidth = Math.max(1, Math.round(width * 0.16));
  const accentMaxHeight = Math.max(1, Math.round(height * 0.12));

  const centerTargetWidth = Math.min(centerMaxWidth, Math.max(110, Math.round(width * 0.26)));
  const accentTargetWidth = Math.min(accentMaxWidth, Math.max(56, Math.round(width * 0.1)));

  const centerLogo = await sharp(logoBuffer, { density: 288 })
    .resize({
      width: centerTargetWidth,
      height: centerMaxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha(config.watermarkOpacity)
    .rotate(-16, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({
      width: centerMaxWidth,
      height: centerMaxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  const accentLogo = await sharp(logoBuffer, { density: 288 })
    .resize({
      width: accentTargetWidth,
      height: accentMaxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha(Math.min(config.watermarkOpacity * 0.45, 0.016))
    .png()
    .toBuffer({ resolveWithObject: true });

  const centerLeft = Math.max(0, Math.round((width - centerLogo.info.width) / 2));
  const centerTop = Math.max(0, Math.round((height - centerLogo.info.height) / 2));
  const topRightLeft = Math.max(0, width - accentLogo.info.width - horizontalPadding);
  const topRightTop = Math.max(0, verticalPadding);
  const bottomLeftLeft = Math.max(0, horizontalPadding);
  const bottomLeftTop = Math.max(0, height - accentLogo.info.height - verticalPadding);

  return [
    { input: centerLogo.data, left: centerLeft, top: centerTop },
    { input: accentLogo.data, left: topRightLeft, top: topRightTop },
    { input: accentLogo.data, left: bottomLeftLeft, top: bottomLeftTop },
  ];
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

    const prepared = sharp(buffer)
      .rotate()
      .resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    const { data: preparedBuffer, info: preparedInfo } = await prepared
      .png()
      .toBuffer({ resolveWithObject: true });

    const image = sharp(preparedBuffer);
    const metadata = {
      width: preparedInfo.width,
      height: preparedInfo.height,
    };
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
