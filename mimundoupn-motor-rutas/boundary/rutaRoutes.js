/**
 * BOUNDARY
 * Expone HU01 al exterior como endpoints HTTP. Esta capa solo traduce
 * HTTP <-> llamadas a Control; no contiene logica de negocio propia.
 */
const express = require('express');
const router = express.Router();
const RutaService = require('../control/RutaService');
const MapaService = require('../control/MapaService');

// Lista de ambientes registrados (para el buscador)
// 👇 Ahora es async porque MapaService consulta la BD
router.get('/api/aulas', async (req, res) => {
  try {
    const aulas = await MapaService.listarAulas();
    res.json(aulas);
  } catch (error) {
    console.error("Error en /api/aulas:", error);
    res.status(500).json({ error: 'ERROR_INTERNO', mensaje: 'No se pudo obtener la lista de aulas.' });
  }
});

// Plano del campus: nodos, tramos y limites (para dibujar el mapa)
// 👇 Ahora es async porque MapaService consulta la BD
router.get('/api/mapa', async (req, res) => {
  try {
    const mapa = await MapaService.obtenerMapa();
    res.json(mapa);
  } catch (error) {
    console.error("Error en /api/mapa:", error);
    res.status(500).json({ error: 'ERROR_INTERNO', mensaje: 'No se pudo obtener el mapa.' });
  }
});

// HU01: generar la ruta mas corta hacia un aula
// 👇 Ahora es async y usa await
router.post('/api/rutas', async (req, res) => {
  try {
    const { origenX, origenY, codigoAulaDestino } = req.body || {};

    const resultado = await RutaService.generarRuta({ origenX, origenY, codigoAulaDestino });

    if (resultado.error) {
      return res.status(400).json(resultado);
    }
    res.json(resultado);
  } catch (error) {
    console.error("Error en /api/rutas:", error);
    res.status(500).json({ error: 'ERROR_INTERNO', mensaje: 'Ocurrió un error al calcular la ruta.' });
  }
});

module.exports = router;