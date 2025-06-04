const express = require('express');
const router = express.Router();
const cloudinary = require('./cloudinary.cjs');

// Lista imagens de uma pasta (galeria)
router.get('/:pasta', async (req, res) => {
  try {
    const { pasta } = req.params;
    const result = await cloudinary.search
      .expression(`folder:"${pasta}"`)
      .sort_by('public_id','desc')
      .max_results(50)
      .execute();
    res.json(result.resources.map(img => img.secure_url));
  } catch (err) {
    console.error('Erro Cloudinary:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 
