#!/usr/bin/env node
import { runProcessPendingUploads } from './processPendingUploads.mjs';

const raw = process.argv[2];
if (!raw) {
  console.error('Missing worker config payload');
  process.exit(1);
}

const input = JSON.parse(raw);
const summary = await runProcessPendingUploads({
  pendingDir: input.pendingDir,
  manifestsDir: input.manifestsDir,
  publicDir: input.publicDir,
  loaderFile: input.loaderFile,
  branchName: input.branchName,
  maxWidth: 1200,
  maxHeight: 1800,
  quality: 85,
  folders: ['casamentos', 'infantil', 'femininos', 'pre-weding', 'noivas'],
  watermarkEnabled: true,
  watermarkLogoPath: input.watermarkLogoPath,
  watermarkLogoUrl: '',
  watermarkOpacity: 0.009,
  requireWatermark: input.requireWatermark !== false,
});

console.log(JSON.stringify(summary));
