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
router.get('/api/aulas', (req, res) => {
  res.json(MapaService.listarAulas());
});

// Plano del campus: nodos, tramos y limites (para dibujar el mapa)
router.get('/api/mapa', (req, res) => {
  res.json(MapaService.obtenerMapa());
});

// HU01: generar la ruta mas corta hacia un aula
router.post('/api/rutas', (req, res) => {
  const { origenX, origenY, codigoAulaDestino } = req.body || {};

  const resultado = RutaService.generarRuta({ origenX, origenY, codigoAulaDestino });

  if (resultado.error) {
    return res.status(400).json(resultado);
  }
  res.json(resultado);
});

module.exports = router;
