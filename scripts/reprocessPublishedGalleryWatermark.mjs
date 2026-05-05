#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const GALLERY_DIR = path.join(ROOT_DIR, 'public', 'images', 'galeria');
const WATERMARK_LOGO_PATH =
  process.env.WATERMARK_LOGO_PATH || path.join(ROOT_DIR, 'assets', 'watermark-logo.svg');
const WATERMARK_OPACITY = Number(process.env.WATERMARK_OPACITY || 0.24);

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
  return fs.readFile(WATERMARK_LOGO_PATH);
}

async function createOverlayForImage(width, height, logoBuffer) {
  const logoWidth = Math.max(120, Math.round(width * 0.16));
  const preparedLogo = await sharp(logoBuffer)
    .resize({ width: logoWidth, withoutEnlargement: true })
    .ensureAlpha()
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
        opacity: WATERMARK_OPACITY,
      });
    }
  }

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
