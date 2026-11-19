// Validacion de sesion y rol en el servidor (no depende de ocultar botones)
const { ROL } = require('../entity/Rol');

function requiereSesion(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({
      correcto: false,
      error: 'NO_AUTENTICADO',
      mensaje: 'Debes iniciar sesión para continuar.'
    });
  }
  return next();
}

function requiereRol(...rolesPermitidos) {
  return (req, res, next) => requiereSesion(req, res, () => {
    const rolId = Number(req.session.usuario.rolId);
    if (!rolesPermitidos.includes(rolId)) {
      return res.status(403).json({
        correcto: false,
        error: 'SIN_PERMISO',
        mensaje: 'No tienes permiso para realizar esta acción.'
      });
    }
    return next();
  });
}

const soloAdministrador = requiereRol(ROL.ADMINISTRADOR);
const soloComunidad = requiereRol(ROL.ESTUDIANTE, ROL.DOCENTE, ROL.COLABORADOR);

// Traduce errores de Control a respuestas HTTP
function responderError(res, error, contexto) {
  if (error && error.name === 'ErrorNegocio') {
    return res.status(error.status).json({
      correcto: false,
      error: error.codigo,
      mensaje: error.message
    });
  }
  console.error(`Error en ${contexto}:`, error);
  return res.status(500).json({
    correcto: false,
    error: 'ERROR_INTERNO',
    mensaje: 'Ocurrió un error interno en el servidor.'
  });
}

module.exports = { requiereSesion, requiereRol, soloAdministrador, soloComunidad, responderError };
