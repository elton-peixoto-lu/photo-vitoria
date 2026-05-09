#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const GALLERY_DIR = process.env.GALLERY_DIR || path.join(ROOT_DIR, 'public', 'images', 'galeria');
const WATERMARK_LOGO_PATH =
  process.env.WATERMARK_LOGO_PATH || path.join(ROOT_DIR, 'assets', 'watermark-logo.png');
const WATERMARK_OPACITY = Number(process.env.WATERMARK_OPACITY || 0.026);

async function listAvifFiles(dir) {
  const out = [];
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.avif')) {
        out.push(full);
      }
    }
  }
  await walk(dir);
  return out.sort((a, b) => a.localeCompare(b));
}

async function loadLogoBuffer() {
  const rawLogoBuffer = await fs.readFile(WATERMARK_LOGO_PATH);
  const { data, info } = await sharp(rawLogoBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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

async function createOverlayForImage(width, height, logoBuffer) {
  const horizontalPadding = Math.max(12, Math.round(width * 0.05));
  const verticalPadding = Math.max(12, Math.round(height * 0.05));
  const centerMaxWidth = Math.max(1, width - horizontalPadding * 2);
  const centerMaxHeight = Math.max(1, height - verticalPadding * 2);
  const accentMaxWidth = Math.max(1, Math.round(width * 0.16));
  const accentMaxHeight = Math.max(1, Math.round(height * 0.12));

  const centerTargetWidth = Math.min(centerMaxWidth, Math.max(86, Math.round(width * 0.18)));
  const accentTargetWidth = Math.min(accentMaxWidth, Math.max(56, Math.round(width * 0.1)));

  const centerLogo = await sharp(logoBuffer, { density: 288 })
    .resize({
      width: centerTargetWidth,
      height: centerMaxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha(WATERMARK_OPACITY)
    .rotate(-15, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
    .ensureAlpha(Math.min(WATERMARK_OPACITY * 0.4, 0.01))
    .png()
    .toBuffer({ resolveWithObject: true });

  const centerLeft = Math.max(0, Math.round((width - centerLogo.info.width) / 2));
  const centerTop = Math.max(0, Math.round((height - centerLogo.info.height) / 2));
  const topRightLeft = Math.max(0, width - accentLogo.info.width - horizontalPadding);
  const topRightTop = Math.max(0, verticalPadding);
  const bottomLeftLeft = Math.max(0, horizontalPadding);
  const bottomLeftTop = Math.max(0, height - accentLogo.info.height - verticalPadding);

  return [
    { input: centerLogo.data, left: centerLeft, top: centerTop, blend: 'over' },
    { input: accentLogo.data, left: topRightLeft, top: topRightTop, blend: 'over' },
    { input: accentLogo.data, left: bottomLeftLeft, top: bottomLeftTop, blend: 'over' },
  ];
}

async function main() {
  const files = await listAvifFiles(GALLERY_DIR);
  const logoBuffer = await loadLogoBuffer();

  let processed = 0;
  for (const filePath of files) {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 1800;

    const overlays = await createOverlayForImage(width, height, logoBuffer);

    const tempPath = `${filePath}.tmp`;
    await image
      .composite(overlays)
      .avif({ quality: 85, effort: 4 })
      .toFile(tempPath);

    await fs.rename(tempPath, filePath);
    processed++;
    if (processed % 25 === 0) {
      console.log(`Reprocessadas ${processed}/${files.length}`);
    }
  }

  console.log(`Concluido: ${processed} imagens reprocessadas com marca d'agua.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
