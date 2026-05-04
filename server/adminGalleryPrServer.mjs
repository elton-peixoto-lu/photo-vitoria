import express from 'express';
import galleryPrHandler, { turnstileVerifyHandler } from './adminGalleryPrHandler.mjs';

const app = express();
const port = process.env.PORT || 8080;
const allowedOrigins = (process.env.ADMIN_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json({ limit: '12mb' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

function health(req, res) {
  res.json({ ok: true });
}

app.get('/', health);
app.get('/healthz', health);

app.post('/api/admin/gallery-pr', galleryPrHandler);
app.post('/api/admin/turnstile-verify', turnstileVerifyHandler);

app.listen(port, () => {
  console.log(`Admin gallery API listening on ${port}`);
});
