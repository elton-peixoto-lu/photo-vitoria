const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'driuyeufs',
  api_key: '314164983519914',
  api_secret: 'tQHEoDNzZHKkUglZlYyk1Aomvo0',
});

module.exports = cloudinary; 
