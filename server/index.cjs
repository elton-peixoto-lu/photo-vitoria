require('dotenv').config();
const express = require('express');
const cors = require('cors');
const galeriaRoutes = require('./galeriaRoutes.cjs');
const edgeConfigRoutes = require('./edgeConfigRoutes.cjs');

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://photo-vitoria.vercel.app',
  'https://estudiovitoriafreitas.com.br',
  'https://www.estudiovitoriafreitas.com.br'
];
app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origin (ex: ferramentas internas)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use('/api/galeria', galeriaRoutes);
app.use('/api/config', edgeConfigRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`)); 
