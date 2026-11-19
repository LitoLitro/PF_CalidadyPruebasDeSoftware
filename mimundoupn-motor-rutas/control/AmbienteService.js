const grafoRepo = require('../persistence/GrafoRepository');
const ambienteRepo = require('../persistence/AmbienteRepository');
const Ambiente = require('../entity/Ambiente');
const ErrorNegocio = require('./ErrorNegocio');
const { nodoMasCercano } = require('./RutaService');
const { validarHorarios } = require('./HorarioService');

// Tipos que sostienen el grafo y no se pueden eliminar
const TIPO_PATIO = 5;
const TIPO_INGRESO = 7;
const PESO_MAXIMO = 10000;

const invalido = (mensaje) => new ErrorNegocio(400, 'DATOS_INVALIDOS', mensaje);

function enteroOpcional(valor, campo, minimo) {
  if (valor === undefined || valor === null || valor === '') return null;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < minimo) throw invalido(`${campo} debe ser un número entero mayor o igual a ${minimo}.`);
  return n;
}

// Distancia en metros entre dos puntos del plano
function calcularPeso(a, b) {
  return Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) * grafoRepo.METROS_POR_UNIDAD));
}

// Valida los datos del formulario y devuelve un Ambiente normalizado
function validarDatos(datos, catalogos) {
  const d = datos || {};
  const codigo = String(d.codigo || '').trim().toUpperCase();
  const nombre = String(d.nombre || '').trim();
  const ubiDesc = String(d.ubiDesc || '').trim() || null;

  if (!codigo) throw invalido('El código es obligatorio.');
  if (!/^[A-Z0-9-]{1,50}$/.test(codigo)) throw invalido('El código solo admite letras, números y guiones (máximo 50).');
  if (!nombre) throw invalido('El nombre es obligatorio.');
  if (nombre.length > 50) throw invalido('El nombre admite como máximo 50 caracteres.');
  if (ubiDesc && ubiDesc.length > 250) throw invalido('La descripción admite como máximo 250 caracteres.');

  const tipoEspacioId = enteroOpcional(d.tipoEspacioId, 'El tipo', 1);
  if (tipoEspacioId === null || !catalogos.tipos.some((t) => t.id === tipoEspacioId)) {
    throw invalido('Selecciona un tipo de ambiente válido.');
  }
  const pabellonId = enteroOpcional(d.pabellonId, 'El pabellón', 1);
  if (pabellonId !== null && !catalogos.pabellones.some((p) => p.id === pabellonId)) {
    throw invalido('El pabellón seleccionado no existe.');
  }
  const piso = enteroOpcional(d.piso, 'El piso', 1) || 1;
  const capacidad = enteroOpcional(d.capacidad, 'La capacidad', 0);

  const x = Number(d.x);
  const y = Number(d.y);
  if (d.x === '' || d.y === '' || d.x == null || d.y == null || !grafoRepo.estaDentroDelCampus(x, y)) {
    throw invalido('La ubicación (x, y) debe estar dentro de los límites del campus.');
  }

  return new Ambiente({ codigo, nombre, pabellonId, piso, tipoEspacioId, x, y, capacidad, ubiDesc });
}

/*
  Construye las aristas del ambiente. Cada conexion indica el nodo vecino y,
  opcionalmente, un peso en metros; si no se indica, se usa la distancia real.
  Si no se envia ninguna conexion, se conecta al nodo mas cercano.
*/
function construirConexiones(punto, conexiones, nodos, idPropio = null) {
  const vecinos = nodos.filter((n) => n.id !== idPropio);
  if (vecinos.length === 0) return [];

  let lista = Array.isArray(conexiones) ? conexiones : [];
  if (conexiones !== undefined && conexiones !== null && !Array.isArray(conexiones)) {
    throw invalido('Las conexiones deben enviarse como una lista.');
  }
  if (lista.length === 0) {
    lista = [{ destinoId: nodoMasCercano(vecinos, punto.x, punto.y).nodo.id }];
  }

  const porId = new Map(vecinos.map((n) => [n.id, n]));
  const usados = new Set();

  return lista.map((c) => {
    const destinoId = Number(typeof c === 'object' && c !== null ? c.destinoId : c);
    const destino = porId.get(destinoId);
    if (!destino) throw invalido(`El nodo de conexión ${destinoId} no existe o no está activo.`);
    if (usados.has(destinoId)) throw invalido(`La conexión con "${destino.nombre}" está repetida.`);
    usados.add(destinoId);

    const pesoIndicado = c && typeof c === 'object' ? c.peso : undefined;
    let peso;
    if (pesoIndicado === undefined || pesoIndicado === null || pesoIndicado === '') {
      peso = calcularPeso(punto, destino);
    } else {
      peso = Number(pesoIndicado);
      if (!Number.isInteger(peso) || peso < 1 || peso > PESO_MAXIMO) {
        throw invalido(`La distancia hacia "${destino.nombre}" debe ser un entero entre 1 y ${PESO_MAXIMO} m.`);
      }
    }
    return { destinoId, peso };
  });
}

async function obtenerOFallar(id) {
  const n = Number(id);
  const ambiente = Number.isInteger(n) ? await ambienteRepo.obtenerPorId(n) : null;
  if (!ambiente) throw new ErrorNegocio(404, 'AMBIENTE_NO_ENCONTRADO', 'El ambiente no existe o fue eliminado.');
  return ambiente;
}

async function verificarCodigoLibre(codigo, excluirId = null) {
  if (await ambienteRepo.existeCodigo(codigo, excluirId)) {
    throw new ErrorNegocio(409, 'CODIGO_DUPLICADO', `Ya existe un ambiente con el código ${codigo}.`);
  }
}

async function listar() {
  return ambienteRepo.listar();
}

async function obtener(id) {
  const ambiente = await obtenerOFallar(id);
  ambiente.conexiones = await ambienteRepo.listarConexiones(ambiente.id);
  ambiente.horarios = (await ambienteRepo.listarHorarios(ambiente.id))
    .map((h) => ({ diaSem: h.diaSem, apertura: h.apertura, cierre: h.cierre }));
  return ambiente;
}

async function catalogos() {
  return ambienteRepo.listarCatalogos();
}

async function crear(datos) {
  const ambiente = validarDatos(datos, await ambienteRepo.listarCatalogos());
  const horarios = validarHorarios(datos.horarios);
  await verificarCodigoLibre(ambiente.codigo);

  const nodos = await grafoRepo.obtenerNodos();
  const conexiones = construirConexiones(ambiente, datos.conexiones, nodos);

  const id = await ambienteRepo.crear(ambiente, conexiones, horarios);
  return obtener(id);
}

async function actualizar(id, datos) {
  const actual = await obtenerOFallar(id);
  const ambiente = validarDatos(datos, await ambienteRepo.listarCatalogos());
  await verificarCodigoLibre(ambiente.codigo, actual.id);

  const horarios = datos.horarios === undefined ? null : validarHorarios(datos.horarios);

  let conexiones = null;
  const seMovio = actual.x !== ambiente.x || actual.y !== ambiente.y;
  if (datos.conexiones !== undefined) {
    conexiones = construirConexiones(ambiente, datos.conexiones, await grafoRepo.obtenerNodos(), actual.id);
  } else if (seMovio) {
    // Se mantienen los mismos vecinos pero con la distancia de la nueva ubicacion
    const vecinos = (await ambienteRepo.listarConexiones(actual.id)).map((c) => ({ destinoId: c.destinoId }));
    conexiones = construirConexiones(ambiente, vecinos, await grafoRepo.obtenerNodos(), actual.id);
  }

  const ok = await ambienteRepo.actualizar(actual.id, ambiente, conexiones, horarios);
  if (!ok) throw new ErrorNegocio(404, 'AMBIENTE_NO_ENCONTRADO', 'El ambiente no existe o fue eliminado.');
  return obtener(actual.id);
}

async function actualizarHorarios(id, horarios) {
  const actual = await obtenerOFallar(id);
  await ambienteRepo.reemplazarHorarios(actual.id, validarHorarios(horarios));
  return obtener(actual.id);
}

async function eliminar(id) {
  const actual = await obtenerOFallar(id);
  if ([TIPO_PATIO, TIPO_INGRESO].includes(Number(actual.tipoEspacioId))) {
    throw new ErrorNegocio(409, 'AMBIENTE_PROTEGIDO',
      `"${actual.nombre}" es un punto central del recorrido y no se puede eliminar.`);
  }
  await ambienteRepo.eliminar(actual.id);
  return { id: actual.id, codigo: actual.codigo };
}

module.exports = {
  listar, obtener, catalogos, crear, actualizar, actualizarHorarios, eliminar,
  validarDatos, construirConexiones, calcularPeso
};
