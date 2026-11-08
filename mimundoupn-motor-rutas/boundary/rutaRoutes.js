/**
 * BOUNDARY
 * Endpoints HTTP de la API. Traduce los resultados y errores a respuestas HTTP.
 */
const express = require('express');
const RutaService = require('../control/RutaService');
const MapaService = require('../control/MapaService');

const router = express.Router();

// Convierte un error en una respuesta HTTP con un mensaje claro para el usuario
function responderError(res, ruta, error, mensajePorDefecto) {
  console.error(`Error en ${ruta}:`, error);
  if (error.code === 'ERROR_BD') {
    return res.status(503).json({ error: 'ERROR_BD', mensaje: 'No se pudo conectar con la base de datos.' });
  }
  return res.status(500).json({ error: 'ERROR_INTERNO', mensaje: mensajePorDefecto });
}

// Envuelve un manejador async para no repetir try/catch en cada ruta
const manejar = (ruta, mensajePorDefecto, accion) => async (req, res) => {
  try {
    await accion(req, res);
  } catch (error) {
    responderError(res, ruta, error, mensajePorDefecto);
  }
};

router.get('/api/aulas', manejar('/api/aulas', 'No se pudo obtener la lista de aulas.', async (req, res) => {
  res.json(await MapaService.listarAulas());
}));

router.get('/api/mapa', manejar('/api/mapa', 'No se pudo obtener el mapa.', async (req, res) => {
  res.json(await MapaService.obtenerMapa());
}));

router.post('/api/rutas', manejar('/api/rutas', 'Ocurrió un error al calcular la ruta.', async (req, res) => {
  const { origenX, origenY, codigoAulaDestino } = req.body || {};
  const resultado = await RutaService.generarRuta({ origenX, origenY, codigoAulaDestino });
  res.status(resultado.error ? 400 : 200).json(resultado);
}));

module.exports = router;
