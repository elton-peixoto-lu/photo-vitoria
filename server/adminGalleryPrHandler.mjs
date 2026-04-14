/* global Buffer, process */
import crypto from 'crypto';

const ALLOWED_FOLDERS = new Set(['casamentos', 'infantil', 'femininos', 'pre-weding', 'noivas']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);
const MAX_FILES = 20;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

let jwksCache = null;

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function base64UrlDecode(value) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function parseJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token invalido');

  return {
    header: JSON.parse(base64UrlDecode(parts[0]).toString('utf8')),
    payload: JSON.parse(base64UrlDecode(parts[1]).toString('utf8')),
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: base64UrlDecode(parts[2]),
  };
}

async function getJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

async function getKeycloakJwks(issuer) {
  if (jwksCache?.issuer === issuer && jwksCache.expiresAt > Date.now()) {
    return jwksCache.keys;
  }

  const response = await fetch(`${issuer}/protocol/openid-connect/certs`);
  if (!response.ok) throw new Error('Falha ao buscar JWKS do Keycloak');

  const data = await response.json();
  jwksCache = {
    issuer,
    keys: data.keys || [],
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  return jwksCache.keys;
}

function hasAllowedRole(payload, clientId, allowedRoles) {
  if (allowedRoles.length === 0) return true;

  const roles = new Set([
    ...(payload.realm_access?.roles || []),
    ...(payload.resource_access?.[clientId]?.roles || []),
  ]);

  return allowedRoles.some((role) => roles.has(role));
}

async function verifyKeycloakToken(token) {
  const issuer = process.env.KEYCLOAK_ISSUER;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  if (!issuer || !clientId) throw new Error('Keycloak nao configurado');

  const { header, payload, signingInput, signature } = parseJwt(token);
  if (header.alg !== 'RS256') throw new Error('Algoritmo de token nao suportado');
  if (payload.iss !== issuer) throw new Error('Issuer invalido');

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp <= now) throw new Error('Token expirado');
  if (payload.nbf && payload.nbf > now) throw new Error('Token ainda nao valido');

  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud].filter(Boolean);
  if (!audience.includes(clientId) && payload.azp !== clientId) {
    throw new Error('Cliente Keycloak invalido');
  }

  const allowedRoles = (process.env.KEYCLOAK_ALLOWED_ROLES || '')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);

  if (!hasAllowedRole(payload, clientId, allowedRoles)) {
    throw new Error('Usuario sem permissao');
  }

  const keys = await getKeycloakJwks(issuer);
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('Chave publica nao encontrada');

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const verified = crypto.verify('RSA-SHA256', Buffer.from(signingInput), publicKey, signature);
  if (!verified) throw new Error('Assinatura invalida');

  return payload;
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
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
    if (!token) return json(res, 401, { error: 'Token ausente' });

    const keycloakUser = await verifyKeycloakToken(token);
    const body = await getJsonBody(req);
    validatePayload(body);

    const pr = await createGalleryPullRequest({
      folder: body.folder,
      files: body.files,
      userName: keycloakUser.name || keycloakUser.preferred_username || keycloakUser.email,
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
