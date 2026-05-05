import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import test from 'node:test';
import sharp from 'sharp';

import { runProcessPendingUploads } from './processPendingUploads.mjs';

const FOLDERS = ['casamentos', 'infantil', 'femininos', 'pre-weding', 'noivas'];

async function createFixtureRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'photo-vitoria-uploads-'));
}

async function writeLoaderStub(loaderFile) {
  await fs.mkdir(path.dirname(loaderFile), { recursive: true });
  await fs.writeFile(
    loaderFile,
    `const LOCAL_IMAGES_MAP = {};\nexport { LOCAL_IMAGES_MAP };\n`,
    'utf8',
  );
}

async function createImage(filePath, color) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toFile(filePath);
}

test('processa nova foto e remove duplicadas por conteudo do mapa final', async (t) => {
  const rootDir = await createFixtureRoot();
  const pendingDir = path.join(rootDir, 'uploads', 'pendentes');
  const publicDir = path.join(rootDir, 'public', 'images', 'galeria');
  const loaderFile = path.join(rootDir, 'src', 'localAssetsLoader.js');

  await writeLoaderStub(loaderFile);

  for (const folder of FOLDERS) {
    await fs.mkdir(path.join(publicDir, folder), { recursive: true });
  }

  await createImage(path.join(pendingDir, 'infantil', 'Nova Foto.png'), '#ff6699');
  await createImage(path.join(publicDir, 'femininos', 'existente-a.avif'), '#3366ff');
  await createImage(path.join(publicDir, 'femininos', 'existente-b.avif'), '#3366ff');

  const summary = await runProcessPendingUploads({
    pendingDir,
    publicDir,
    loaderFile,
    maxWidth: 1200,
    maxHeight: 1800,
    quality: 85,
    watermarkEnabled: false,
    folders: FOLDERS,
  });

  assert.equal(summary.processed, 1);
  assert.equal(summary.removedDuplicates, 1);

  const infantilFiles = await fs.readdir(path.join(publicDir, 'infantil'));
  assert.equal(infantilFiles.length, 1);
  assert.match(infantilFiles[0], /^nova-foto-[a-f0-9]{10}\.avif$/);

  const femininosFiles = await fs.readdir(path.join(publicDir, 'femininos'));
  assert.deepEqual(femininosFiles, ['existente-a.avif']);

  const pendingInfantilFiles = await fs.readdir(path.join(pendingDir, 'infantil'));
  assert.deepEqual(pendingInfantilFiles, ['.gitkeep']);

  const loaderContent = await fs.readFile(loaderFile, 'utf8');
  assert.match(loaderContent, /nova-foto-[a-f0-9]{10}\.avif/);
  assert.match(loaderContent, /existente-a\.avif/);
  assert.doesNotMatch(loaderContent, /existente-b\.avif/);

  await t.test('cleanup', async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
  });
});

test('remove duplicadas legadas por familia e mantem a variante com sufixo', async (t) => {
  const rootDir = await createFixtureRoot();
  const pendingDir = path.join(rootDir, 'uploads', 'pendentes');
  const publicDir = path.join(rootDir, 'public', 'images', 'galeria');
  const loaderFile = path.join(rootDir, 'src', 'localAssetsLoader.js');

  await writeLoaderStub(loaderFile);

  for (const folder of FOLDERS) {
    await fs.mkdir(path.join(publicDir, folder), { recursive: true });
  }

  await createImage(path.join(publicDir, 'casamentos', 'foto-base.avif'), '#8844ff');
  await createImage(path.join(publicDir, 'casamentos', 'foto-base_ab12cd34.avif'), '#33cc99');

  const summary = await runProcessPendingUploads({
    pendingDir,
    publicDir,
    loaderFile,
    maxWidth: 1200,
    maxHeight: 1800,
    quality: 85,
    watermarkEnabled: false,
    folders: FOLDERS,
  });

  assert.equal(summary.processed, 0);
  assert.equal(summary.removedDuplicates, 1);

  const casamentosFiles = await fs.readdir(path.join(publicDir, 'casamentos'));
  assert.deepEqual(casamentosFiles, ['foto-base_ab12cd34.avif']);

  const loaderContent = await fs.readFile(loaderFile, 'utf8');
  assert.match(loaderContent, /foto-base_ab12cd34\.avif/);
  assert.doesNotMatch(loaderContent, /foto-base\.avif/);

  await t.test('cleanup', async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
  });
});
