const express = require('express');
const router = express.Router();
const FavoritoService = require('../control/FavoritoService');
const { soloComunidad, responderError } = require('./autorizacion');

// Rutas favoritas: estudiantes, docentes y colaboradores
router.use('/api/favoritos', soloComunidad);

router.get('/api/favoritos', async (req, res) => {
  try {
    return res.json(await FavoritoService.listar(req.session.usuario));
  } catch (error) {
    return responderError(res, error, 'listar favoritos');
  }
});

router.post('/api/favoritos', async (req, res) => {
  try {
    return res.status(201).json(await FavoritoService.guardar(req.session.usuario, req.body || {}));
  } catch (error) {
    return responderError(res, error, 'guardar favorito');
  }
});

router.delete('/api/favoritos/:id', async (req, res) => {
  try {
    return res.json(await FavoritoService.eliminar(req.session.usuario, req.params.id));
  } catch (error) {
    return responderError(res, error, 'eliminar favorito');
  }
});

module.exports = router;
