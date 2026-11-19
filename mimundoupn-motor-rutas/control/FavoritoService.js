const favoritoRepo = require('../persistence/FavoritoRepository');
const grafoRepo = require('../persistence/GrafoRepository');
const ErrorNegocio = require('./ErrorNegocio');

async function listar(usuario) {
  return favoritoRepo.listarPorUsuario(usuario.usuarioID);
}

// Guarda como favorita la ruta hacia un ambiente (identificado por su codigo)
async function guardar(usuario, datos) {
  const codigo = String((datos && datos.codigo) || '').trim().toUpperCase();
  if (!codigo) {
    throw new ErrorNegocio(400, 'DATOS_INVALIDOS', 'Indica el ambiente de destino de la ruta.');
  }

  const aula = await grafoRepo.obtenerAulaPorCodigo(codigo);
  if (!aula) {
    throw new ErrorNegocio(404, 'AULA_NO_ENCONTRADA', `El ambiente "${codigo}" no existe.`);
  }

  const nombre = String((datos && datos.nombre) || '').trim() || `Ruta a ${aula.nombre}`;
  if (nombre.length > 100) {
    throw new ErrorNegocio(400, 'DATOS_INVALIDOS', 'El nombre de la ruta admite como máximo 100 caracteres.');
  }

  if (await favoritoRepo.existe(usuario.usuarioID, aula.nodoId)) {
    throw new ErrorNegocio(409, 'FAVORITO_DUPLICADO', `Ya tienes guardada una ruta hacia ${aula.nombre}.`);
  }

  const favorito = await favoritoRepo.crear(usuario.usuarioID, aula.nodoId, nombre);
  favorito.codigo = aula.codigo;
  favorito.ambiente = aula.nombre;
  return favorito;
}

async function eliminar(usuario, favoritoId) {
  const id = Number(favoritoId);
  const borrado = Number.isInteger(id) && await favoritoRepo.eliminar(id, usuario.usuarioID);
  if (!borrado) {
    throw new ErrorNegocio(404, 'FAVORITO_NO_ENCONTRADO', 'La ruta favorita no existe.');
  }
  return { id };
}

module.exports = { listar, guardar, eliminar };
