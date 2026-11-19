const express = require('express');
const router = express.Router();
const AmbienteService = require('../control/AmbienteService');
const { soloAdministrador, responderError } = require('./autorizacion');

// Todo /api/admin exige sesion con rol Administrador
router.use('/api/admin', soloAdministrador);

const manejar = (contexto, accion) => async (req, res) => {
  try {
    const { status = 200, datos } = await accion(req);
    return res.status(status).json(datos);
  } catch (error) {
    return responderError(res, error, contexto);
  }
};

router.get('/api/admin/catalogos', manejar('catalogos', async () =>
  ({ datos: await AmbienteService.catalogos() })));

router.get('/api/admin/ambientes', manejar('listar ambientes', async () =>
  ({ datos: await AmbienteService.listar() })));

router.get('/api/admin/ambientes/:id', manejar('obtener ambiente', async (req) =>
  ({ datos: await AmbienteService.obtener(req.params.id) })));

router.post('/api/admin/ambientes', manejar('crear ambiente', async (req) =>
  ({ status: 201, datos: await AmbienteService.crear(req.body || {}) })));

router.put('/api/admin/ambientes/:id', manejar('actualizar ambiente', async (req) =>
  ({ datos: await AmbienteService.actualizar(req.params.id, req.body || {}) })));

router.put('/api/admin/ambientes/:id/horarios', manejar('actualizar horarios', async (req) =>
  ({ datos: await AmbienteService.actualizarHorarios(req.params.id, (req.body || {}).horarios) })));

router.delete('/api/admin/ambientes/:id', manejar('eliminar ambiente', async (req) =>
  ({ datos: await AmbienteService.eliminar(req.params.id) })));

module.exports = router;
