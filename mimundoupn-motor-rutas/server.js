/**
 * Punto de entrada del backend. Solo arma la aplicacion Express y conecta las piezas.
 * Tambien sirve la carpeta public/, asi que basta abrir http://localhost:3000
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const rutaRoutes = require('./boundary/rutaRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(rutaRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`MiMundoUPN listo: abre http://localhost:${PORT}`));
