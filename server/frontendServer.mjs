import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 8080;
const distDir = path.join(__dirname, '..', 'dist');
const turnstileSecretKey = String(process.env.TURNSTILE_SECRET_KEY || '').trim();

app.use(express.json({ limit: '1mb' }));

app.use(
  express.static(distDir, {
    maxAge: '1h',
    index: false,
  }),
);

app.post('/api/turnstile/verify', async (req, res) => {
  try {
    if (!turnstileSecretKey) {
      return res.status(503).json({ ok: false, message: 'Turnstile indisponivel.' });
    }

    const token = String(req.body?.token || '').trim();
    if (!token) {
      return res.status(400).json({ ok: false, message: 'Token ausente.' });
    }

    const form = new URLSearchParams();
    form.set('secret', turnstileSecretKey);
    form.set('response', token);

    const forwardedFor = String(req.headers['x-forwarded-for'] || '').trim();
    if (forwardedFor) {
      form.set('remoteip', forwardedFor.split(',')[0].trim());
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });

    if (!response.ok) {
      return res.status(502).json({ ok: false, message: 'Falha ao validar Turnstile.' });
    }

    const data = await response.json();
    if (!data.success) {
      return res.status(403).json({ ok: false, message: 'Validacao de seguranca negada.' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, message: 'Erro ao validar seguranca.' });
  }
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`frontend gateway on ${port}`);
});
