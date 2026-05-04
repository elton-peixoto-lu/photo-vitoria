/* global Buffer, process */
import crypto from 'crypto';
import admin from 'firebase-admin';

// Inicializar Firebase Admin se ainda não estiver inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

async function verifyFirebaseToken(token) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Opcional: Verificar se o e-mail está na lista de administradores permitidos
    // Para simplificar, permitimos qualquer usuário autenticado por enquanto,
    // já que o login no front-end já restringe quem pode entrar.
    return decodedToken;
  } catch (error) {
    console.error('Erro ao verificar token do Firebase:', error);
    throw new Error('Sessão inválida ou expirada');
  }
}

const ALLOWED_FOLDERS = new Set(['casamentos', 'infantil', 'femininos', 'pre-weding', 'noivas']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);
const MAX_FILES = 50;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

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
    const bytes = Buffer.byteLength(file.contentBase64, 'base64');
    totalBytes += bytes;
    sanitizeFileName(file.name);
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error('Lote muito grande. Envie ate 10MB por vez.');
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
      'O workflow de fotos pendentes deve processar os arquivos deste PR.',
    ].join('\n'),
  });

  return pr;
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
