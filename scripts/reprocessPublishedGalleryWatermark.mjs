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
const WATERMARK_OPACITY = Number(process.env.WATERMARK_OPACITY || 0.1);

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
  const text = 'VITORIA FOTOGRAFIA';
  const accent = 'vitoria';
  const diagonalFontSize = Math.max(52, Math.round(width * 0.072));
  const cornerFontSize = Math.max(18, Math.round(width * 0.02));
  const centerX = Math.round(width / 2);
  const centerY = Math.round(height / 2);

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <g opacity="${WATERMARK_OPACITY}">
        <text
          x="${centerX}"
          y="${centerY}"
          text-anchor="middle"
          fill="#7a264a"
          font-size="${diagonalFontSize}"
          font-family="Georgia, 'Times New Roman', serif"
          font-style="italic"
          font-weight="600"
          letter-spacing="5"
          transform="rotate(-22 ${centerX} ${centerY})"
        >${text}</text>
      </g>
      <g opacity="0.09">
        <text
          x="${Math.round(width * 0.08)}"
          y="${Math.round(height * 0.92)}"
          fill="#7a264a"
          font-size="${cornerFontSize}"
          font-family="Georgia, 'Times New Roman', serif"
          font-style="italic"
          letter-spacing="3"
        >${accent}</text>
        <text
          x="${Math.round(width * 0.72)}"
          y="${Math.round(height * 0.12)}"
          fill="#7a264a"
          font-size="${cornerFontSize}"
          font-family="Georgia, 'Times New Roman', serif"
          font-style="italic"
          letter-spacing="3"
        >${accent}</text>
      </g>
    </svg>`,
  );

  return [{ input: svg, left: 0, top: 0, blend: 'over' }];
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
