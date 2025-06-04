require('dotenv').config();
const express = require('express');
const cors = require('cors');
const galeriaRoutes = require('./galeriaRoutes.cjs');

const app = express();
app.use(cors());
app.use('/api/galeria', galeriaRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`)); 
