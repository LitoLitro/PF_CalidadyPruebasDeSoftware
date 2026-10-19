/**
 * PERSISTENCIA
 * Por ahora usa datos de prueba en memoria, tal como se definio en el punto 3
 * del informe ("datos de prueba minimos para validar el flujo principal").
 *
 * IMPORTANTE: el plano, los ambientes y las distancias de este archivo son
 * DE DEMOSTRACION. Reemplazalos por los reales de tu campus (por ejemplo,
 * digitalizandolos desde el prototipo de Figma).
 *
 * Cuando conectes SQL Server de verdad, cambias la IMPLEMENTACION interna de
 * estos metodos (usando el paquete "mssql"), pero no su firma: la capa de
 * Control nunca se entera de donde vienen los datos.
 */
const Nodo = require('../entity/Nodo');
const Arista = require('../entity/Arista');
const Aula = require('../entity/Aula');

// Cada unidad del plano equivale a 2 metros (el plano mide 100 x 70 unidades).
const METROS_POR_UNIDAD = 2;

// --- Nodos: puntos del grafo (id, nombre, x, y, tipo) ---
const nodos = [
  new Nodo(1, 'Entrada principal', 8, 56, 'ingreso'),
  new Nodo(2, 'Hall de ingreso', 22, 56, 'pasillo'),
  new Nodo(3, 'Patio central', 46, 56, 'patio'),
  new Nodo(4, 'Pasillo Bloque A', 46, 36, 'pasillo'),
  new Nodo(5, 'Escalera A', 46, 18, 'pasillo'),
  new Nodo(6, 'Laboratorio de Redes', 64, 18, 'aula'),
  new Nodo(7, 'Laboratorio de Software', 28, 18, 'aula'),
  new Nodo(8, 'Biblioteca', 18, 36, 'servicio'),
  new Nodo(9, 'Cafetería', 62, 56, 'servicio'),
  new Nodo(10, 'Pasillo Bloque B', 80, 56, 'pasillo'),
  new Nodo(11, 'Aula B101', 80, 38, 'aula'),
  new Nodo(12, 'Aula B102', 94, 38, 'aula'),
  new Nodo(13, 'Auditorio', 94, 58, 'servicio'),
  new Nodo(14, 'Aula A201', 64, 36, 'aula'),
];

// --- Aristas: tramos transitables. El peso (metros) se calcula con la
// distancia entre los dos nodos, para que plano y distancias no se contradigan.
function conectar(idA, idB) {
  const a = nodos.find((n) => n.id === idA);
  const b = nodos.find((n) => n.id === idB);
  const metros = Math.round(Math.hypot(a.x - b.x, a.y - b.y) * METROS_POR_UNIDAD);
  return new Arista(idA, idB, metros);
}

const aristas = [
  [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [5, 7],
  [4, 8], [2, 8], [3, 9], [9, 10], [10, 11], [11, 12],
  [10, 13], [12, 13], [4, 14],
].map(([a, b]) => conectar(a, b));

// --- Ambientes registrados (codigo, nombre, nodoId, bloque, piso, categoria) ---
const aulas = [
  new Aula('A301', 'Laboratorio de Redes', 6, 'Bloque A', 3, 'Laboratorio'),
  new Aula('A302', 'Laboratorio de Software', 7, 'Bloque A', 3, 'Laboratorio'),
  new Aula('A201', 'Aula 201', 14, 'Bloque A', 2, 'Aula'),
  new Aula('B101', 'Aula 101', 11, 'Bloque B', 1, 'Aula'),
  new Aula('B102', 'Aula 102', 12, 'Bloque B', 1, 'Aula'),
  new Aula('BIB', 'Biblioteca', 8, 'Bloque A', 1, 'Servicio'),
  new Aula('CAF', 'Cafetería', 9, 'Patio central', null, 'Servicio'),
  new Aula('AUD', 'Auditorio', 13, 'Bloque B', 1, 'Servicio'),
];

// Limite del area que el sistema cubre (criterio de aceptacion "fuera de rango")
const LIMITES_CAMPUS = { xMin: 0, xMax: 100, yMin: 0, yMax: 70 };

class GrafoRepository {
  constructor() {
    this.METROS_POR_UNIDAD = METROS_POR_UNIDAD;
  }

  obtenerNodos() {
    return nodos;
  }

  obtenerAristas() {
    return aristas;
  }

  obtenerAulas() {
    return aulas;
  }

  obtenerAulaPorCodigo(codigo) {
    const buscado = String(codigo === undefined || codigo === null ? '' : codigo)
      .trim()
      .toUpperCase();
    return aulas.find((a) => a.codigo.toUpperCase() === buscado) || null;
  }

  obtenerLimites() {
    return LIMITES_CAMPUS;
  }

  estaDentroDelCampus(x, y) {
    return (
      x >= LIMITES_CAMPUS.xMin &&
      x <= LIMITES_CAMPUS.xMax &&
      y >= LIMITES_CAMPUS.yMin &&
      y <= LIMITES_CAMPUS.yMax
    );
  }

  // --- Cuando conectes SQL Server, los metodos de arriba quedarian asi: ---
  //
  // const sql = require('mssql');
  // const config = { user: '...', password: '...', server: '...', database: 'MiMundoUPN' };
  //
  // async obtenerNodos() {
  //   const pool = await sql.connect(config);
  //   const result = await pool.request().query('SELECT id, nombre, x, y, tipo FROM Nodo');
  //   return result.recordset.map((r) => new Nodo(r.id, r.nombre, r.x, r.y, r.tipo));
  // }
}

module.exports = new GrafoRepository();
