import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 8080;
const distDir = path.join(__dirname, '..', 'dist');

app.use(
  express.static(distDir, {
    maxAge: '1h',
    index: false,
  }),
);

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`frontend gateway on ${port}`);
});
