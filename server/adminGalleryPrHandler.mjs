/* global Buffer, process */
import crypto from 'crypto';
import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';

// Inicializar Firebase Admin se ainda não estiver inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: String(process.env.FIREBASE_AUTH_PROJECT_ID || 'photo-vitoria').trim(),
  });
}

const storage = new Storage();

async function verifyFirebaseToken(token) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    const normalizedEmail = String(decodedToken.email || '').trim().toLowerCase();
    const allowedEmails = String(process.env.ADMIN_ALLOWED_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (!normalizedEmail || decodedToken.email_verified !== true) {
      throw new Error('Usuario sem permissao');
    }

    if (allowedEmails.length > 0 && !allowedEmails.includes(normalizedEmail)) {
      throw new Error('Usuario sem permissao');
    }

    return decodedToken;
  } catch (error) {
    console.error('Erro ao verificar token do Firebase:', error);
    if (error?.message === 'Usuario sem permissao') {
      throw error;
    }
    throw new Error('Sessão inválida ou expirada');
  }
}

async function verifyTurnstileToken(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new Error('TURNSTILE_SECRET_KEY nao configurada');
  }

  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (remoteIp) form.set('remoteip', remoteIp);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  });

  if (!response.ok) {
    throw new Error('Falha na validacao do Turnstile');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error('Desafio de seguranca invalido');
  }
}

const ALLOWED_FOLDERS = new Set(['casamentos', 'infantil', 'femininos', 'pre-weding', 'noivas']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/tiff',
  'image/x-tiff',
]);
const MAX_FILES = 50;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const SIGNED_UPLOAD_URL_EXPIRATION_SECONDS = Number(process.env.SIGNED_UPLOAD_URL_EXPIRATION_SECONDS || 15 * 60);
const OBJECT_VALIDATION_RETRIES = Number(process.env.OBJECT_VALIDATION_RETRIES || 5);
const OBJECT_VALIDATION_DELAY_MS = Number(process.env.OBJECT_VALIDATION_DELAY_MS || 800);

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function getJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function sanitizeFileName(fileName) {
  if (typeof fileName !== 'string' || !fileName.includes('.')) {
    throw new Error('Nome de arquivo invalido');
  }

  const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
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

  const hash = crypto.randomBytes(4).toString('hex');
  return `${Date.now()}-${baseName || 'foto'}-${hash}${extension}`;
}

function requireUploadBucket() {
  const bucketName = String(process.env.UPLOAD_TEMP_BUCKET || '').trim();
  if (!bucketName) {
    throw new Error('UPLOAD_TEMP_BUCKET nao configurado');
  }
  return bucketName;
}

function buildTempObjectPath(folder, originalFileName) {
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new Error('Galeria invalida');
  }

  const safeName = sanitizeFileName(originalFileName);
  return `incoming/${folder}/${safeName}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureUploadedObjectExists(bucketName, objectPath, expectedSize) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectPath);
  let lastError = null;

  for (let attempt = 1; attempt <= OBJECT_VALIDATION_RETRIES; attempt += 1) {
    try {
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error('Objeto ainda nao encontrado no bucket temporario');
      }

      const [metadata] = await file.getMetadata();
      const size = Number(metadata?.size || 0);

      if (!Number.isFinite(size) || size <= 0) {
        throw new Error('Objeto temporario vazio ou invalido');
      }

      if (Number.isFinite(expectedSize) && expectedSize > 0 && size !== expectedSize) {
        throw new Error(`Tamanho inesperado no bucket temporario (${size} != ${expectedSize})`);
      }

      return {
        size,
        contentType: metadata?.contentType || '',
        generation: metadata?.generation || '',
      };
    } catch (error) {
      lastError = error;
      if (attempt < OBJECT_VALIDATION_RETRIES) {
        await sleep(OBJECT_VALIDATION_DELAY_MS);
      }
    }
  }

  throw lastError || new Error('Falha ao validar upload no bucket temporario');
}

async function github(method, path, body) {
  const token = process.env.GITHUB_UPLOAD_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error('Token do GitHub nao configurado');

  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'photo-vitoria-admin-upload',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || `Erro GitHub HTTP ${response.status}`);
  }

  return data;
}

function validatePayload(body) {
  const folder = body.folder;
  const files = body.files || [];

  if (!ALLOWED_FOLDERS.has(folder)) throw new Error('Galeria invalida');
  if (!Array.isArray(files) || files.length === 0) throw new Error('Envie pelo menos uma foto');
  if (files.length > MAX_FILES) throw new Error(`Limite de ${MAX_FILES} fotos por envio`);

  let totalBytes = 0;
  for (const file of files) {
    if (!file.name || !file.contentBase64) throw new Error('Arquivo invalido');
    if (typeof file.contentBase64 !== 'string' || !/^[A-Za-z0-9+/=\r\n]+$/.test(file.contentBase64)) {
      throw new Error(`Conteudo base64 invalido: ${file.name || 'arquivo'}`);
    }
    if (file.type && !ALLOWED_MIME_TYPES.has(String(file.type).toLowerCase())) {
      throw new Error(`Mime type nao permitido: ${file.name}`);
    }

    const bytes = Buffer.byteLength(file.contentBase64, 'base64');
    if (bytes <= 0) throw new Error(`Arquivo vazio: ${file.name}`);
    totalBytes += bytes;
    sanitizeFileName(file.name);
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error('Lote muito grande. Envie ate 10MB por vez.');
  }
}

function validateSignedUploadPayload(body) {
  const folder = body?.folder;
  const fileName = body?.fileName;
  const contentType = String(body?.contentType || '').toLowerCase();

  if (!ALLOWED_FOLDERS.has(folder)) throw new Error('Galeria invalida');
  if (!fileName) throw new Error('Nome de arquivo ausente');
  sanitizeFileName(fileName);

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    throw new Error(`Mime type nao permitido: ${fileName}`);
  }
}

async function createGalleryPullRequest({ folder, files, userName }) {
  const repo = process.env.GITHUB_REPO || 'elton-peixoto-lu/photo-vitoria';
  const baseBranch = process.env.GITHUB_BASE_BRANCH || 'master';
  const branchName = `gallery-upload/${folder}/${Date.now()}`;

  const baseRef = await github('GET', `/repos/${repo}/git/ref/heads/${baseBranch}`);
  await github('POST', `/repos/${repo}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: baseRef.object.sha,
  });

  for (const file of files) {
    const safeName = sanitizeFileName(file.name);
    await github('PUT', `/repos/${repo}/contents/uploads/pendentes/${folder}/${safeName}`, {
      message: `Add pending ${folder} photo: ${safeName}`,
      content: file.contentBase64,
      branch: branchName,
    });
  }

  const pr = await github('POST', `/repos/${repo}/pulls`, {
    title: `Adicionar fotos em ${folder}`,
    head: branchName,
    base: baseBranch,
    body: [
      `Upload enviado pelo portal admin por ${userName || 'usuario autenticado'}.`,
      '',
      `Escopo permitido: uploads/pendentes/${folder}/`,
      '',
      'O workflow de fotos pendentes deve processar os arquivos deste PR.',
    ].join('\n'),
  });

  return pr;
}

async function createGalleryManifestPullRequest({ folder, uploads, userName }) {
  const repo = process.env.GITHUB_REPO || 'elton-peixoto-lu/photo-vitoria';
  const baseBranch = process.env.GITHUB_BASE_BRANCH || 'master';
  const branchName = `gallery-upload/${folder}/${Date.now()}`;

  const baseRef = await github('GET', `/repos/${repo}/git/ref/heads/${baseBranch}`);
  await github('POST', `/repos/${repo}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: baseRef.object.sha,
  });

  const manifestId = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const manifestPath = `uploads/manifests/${folder}/${manifestId}.json`;
  const manifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    folder,
    uploadedBy: userName || 'usuario autenticado',
    source: 'admin-portal',
    files: uploads,
  };

  await github('PUT', `/repos/${repo}/contents/${manifestPath}`, {
    message: `Add upload manifest for ${folder}: ${manifestId}`,
    content: Buffer.from(JSON.stringify(manifest, null, 2), 'utf8').toString('base64'),
    branch: branchName,
  });

  const pr = await github('POST', `/repos/${repo}/pulls`, {
    title: `Adicionar fotos em ${folder}`,
    head: branchName,
    base: baseBranch,
    body: [
      `Upload enviado pelo portal admin por ${userName || 'usuario autenticado'}.`,
      '',
      `Escopo permitido: uploads/manifests/${folder}/`,
      '',
      'O workflow de fotos pendentes deve baixar os arquivos do bucket temporario, processar e publicar.',
    ].join('\n'),
  });

  return pr;
}

async function invokeImageWorker(manifest) {
  const workerUrl = String(process.env.IMAGE_WORKER_URL || '').trim();
  if (!workerUrl) {
    throw new Error('IMAGE_WORKER_URL nao configurada');
  }

  const workerToken = String(process.env.IMAGE_WORKER_TOKEN || '').trim();
  if (!workerToken) {
    throw new Error('IMAGE_WORKER_TOKEN nao configurado');
  }

  const response = await fetch(`${workerUrl.replace(/\/$/, '')}/process-manifest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${workerToken}`,
    },
    body: JSON.stringify({ manifest }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.error || 'Falha ao processar imagem no worker');
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
    if (!token) return json(res, 401, { error: 'Token ausente' });

    const firebaseUser = await verifyFirebaseToken(token);
    const body = await getJsonBody(req);
    validatePayload(body);

    const pr = await createGalleryPullRequest({
      folder: body.folder,
      files: body.files,
      userName: firebaseUser.name || firebaseUser.email,
    });

    return json(res, 200, {
      pullRequestUrl: pr.html_url,
      pullRequestNumber: pr.number,
    });
  } catch (error) {
    const message = error?.message || 'Erro inesperado';
    const statusCode = message.includes('Token') || message.includes('Usuario sem permissao') ? 401 : 400;
    return json(res, statusCode, { error: message });
  }
}

export async function turnstileVerifyHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await getJsonBody(req);
    const token = body?.token;
    if (!token) return json(res, 400, { error: 'Token ausente' });

    await verifyTurnstileToken(token, req.headers['x-forwarded-for'] || req.socket?.remoteAddress);
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 403, { error: error?.message || 'Falha na validacao de seguranca' });
  }
}

export async function signedUploadUrlHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
    if (!token) return json(res, 401, { error: 'Token ausente' });

    await verifyFirebaseToken(token);

    const body = await getJsonBody(req);
    validateSignedUploadPayload(body);

    const bucketName = requireUploadBucket();
    const objectPath = buildTempObjectPath(body.folder, body.fileName);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectPath);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + SIGNED_UPLOAD_URL_EXPIRATION_SECONDS * 1000,
      contentType: body.contentType,
    });

    return json(res, 200, {
      bucket: bucketName,
      objectPath,
      uploadUrl,
      expiresInSeconds: SIGNED_UPLOAD_URL_EXPIRATION_SECONDS,
      method: 'PUT',
      headers: {
        'Content-Type': body.contentType,
      },
    });
  } catch (error) {
    const message = error?.message || 'Erro inesperado';
    const statusCode =
      message.includes('Token') ||
      message.includes('Usuario sem permissao')
        ? 401
        : 400;
    return json(res, statusCode, { error: message });
  }
}

export async function createManifestPullRequestHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
    if (!token) return json(res, 401, { error: 'Token ausente' });

    const firebaseUser = await verifyFirebaseToken(token);
    const body = await getJsonBody(req);
    const folder = body?.folder;
    const uploads = Array.isArray(body?.uploads) ? body.uploads : [];

    if (!ALLOWED_FOLDERS.has(folder)) throw new Error('Galeria invalida');
    if (uploads.length === 0) throw new Error('Envie pelo menos um item');
    if (uploads.length > MAX_FILES) throw new Error(`Limite de ${MAX_FILES} fotos por envio`);

    const bucketName = requireUploadBucket();
    const normalizedUploads = uploads.map((item) => {
      const objectPath = String(item?.objectPath || '').trim();
      const originalName = String(item?.originalName || '').trim();
      const contentType = String(item?.contentType || '').toLowerCase().trim();
      const parsedSize = Number(item?.size);
      const size = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : null;

      if (!objectPath.startsWith(`incoming/${folder}/`)) {
        throw new Error('Objeto fora do escopo permitido');
      }
      if (!originalName) throw new Error('Nome original ausente');
      sanitizeFileName(originalName);
      if (!ALLOWED_MIME_TYPES.has(contentType)) {
        throw new Error(`Mime type nao permitido: ${originalName}`);
      }

      return {
        bucket: bucketName,
        objectPath,
        originalName,
        contentType,
        size,
      };
    });

    for (const upload of normalizedUploads) {
      await ensureUploadedObjectExists(upload.bucket, upload.objectPath, upload.size);
    }

    const result = await invokeImageWorker({
      version: 1,
      createdAt: new Date().toISOString(),
      folder,
      uploadedBy: firebaseUser.name || firebaseUser.email,
      source: 'admin-portal',
      files: normalizedUploads,
    });

    return json(res, 200, {
      ok: true,
      folder,
      processed: result.processed || 0,
      skipped: result.skipped || 0,
      removedDuplicates: result.removedDuplicates || 0,
      publishedFiles: result.publishedFiles || [],
    });
  } catch (error) {
    const message = error?.message || 'Erro inesperado';
    const statusCode =
      message.includes('Token') ||
      message.includes('Usuario sem permissao')
        ? 401
        : 400;
    return json(res, statusCode, { error: message });
  }
}
