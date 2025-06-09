const express = require('express');
const router = express.Router();
const cloudinary = require('./cloudinary.cjs');

// Lista imagens de uma pasta (galeria) com paginação, thumbs e metadados
router.get('/:pasta', async (req, res) => {
  try {
    const { pasta } = req.params;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    const maxResults = perPage;
    const nextCursor = req.query.nextCursor || undefined;

    // Cloudinary API: paginação via next_cursor
    let search = cloudinary.search
      .expression(`folder:"${pasta}"`)
      .sort_by('public_id','desc')
      .max_results(maxResults);

    if (nextCursor) search = search.next_cursor(nextCursor);

    const result = await search.execute();

    // Monta array de objetos com metadados e thumb
    const images = result.resources.map(img => ({
      url: img.secure_url,
      thumb: img.secure_url.replace('/upload/', '/upload/w_300/'),
      width: img.width,
      height: img.height,
      format: img.format,
      public_id: img.public_id
    }));

    res.json({
      total: result.total_count || images.length,
      page,
      perPage,
      nextCursor: result.next_cursor || null,
      images
    });
  } catch (err) {
    console.error('Erro Cloudinary:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 
