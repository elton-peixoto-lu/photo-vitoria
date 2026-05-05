import express from 'express';
import { Storage } from '@google-cloud/storage';
import path from 'path';

const app = express();
const storage = new Storage();
const port = process.env.PORT || 8080;
const bucketName = process.env.GALLERY_BUCKET || 'photo-vitoria-site-prod';
const bucket = storage.bucket(bucketName);

app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
app.get('/images/*', async (req, res) => {
  try {
    const objectPath = req.path.replace(/^\//, '');
    if (!objectPath.startsWith('images/galeria/')) return res.status(403).send('forbidden');
    const file = bucket.file(objectPath);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).send('not found');

    const ext = path.extname(objectPath).toLowerCase();
    const ct = ext === '.avif' ? 'image/avif' : ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    file.createReadStream()
      .on('error', () => res.status(500).end())
      .pipe(res);
  } catch {
    res.status(500).send('error');
  }
});

app.listen(port, () => console.log(`media gateway on ${port}`));
