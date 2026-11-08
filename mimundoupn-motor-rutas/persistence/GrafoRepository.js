/**
 * PERSISTENCIA
 * Consulta los espacios del campus en SQL Server y arma el grafo para Dijkstra.
 * Usa la conexión compartida de db.js.
 */
const { sql, conectarDB } = require('./db');
const Nodo = require('../entity/Nodo');
const Arista = require('../entity/Arista');
const Aula = require('../entity/Aula');

// Límites del plano
const LIMITES_CAMPUS = {
  xMin: 0,
  xMax: 100,
  yMin: 0,
  yMax: 70
};

const SQL_NODOS = `
  SELECT
    espacioId AS id,
    nombre,
    longitud AS x,
    latitud AS y,
    tipoEspacioId AS tipo
  FROM ESPACIO
  WHERE estado = 1`;

const SQL_AULAS = `
  SELECT
    e.codigo,
    e.nombre,
    e.espacioId AS nodoId,
    p.nombre AS bloque,
    e.piso,
    t.nombre AS categoria
  FROM ESPACIO e
  INNER JOIN PABELLON p
    ON e.pabellonId = p.pabellonId
  INNER JOIN TIPO_ESPACIO t
    ON e.tipoEspacioId = t.tipoEspacioId
  WHERE e.estado = 1`;

const normalizarCodigo = (codigo) => String(codigo || '').trim().toUpperCase();
const buscarPorNombre = (nodos, texto) => nodos.find((n) => n.nombre.toLowerCase().includes(texto));

class GrafoRepository {
  constructor() {
    this.METROS_POR_UNIDAD = 2;
  }

  // Convertir un registro SQL en objeto Aula
  mapearAula(registro) {
    return new Aula(
      registro.codigo,
      registro.nombre,
      registro.nodoId,
      registro.bloque,
      registro.piso,
      registro.categoria
    );
  }

  // Consulta reutilizable para obtener aulas y espacios.
  // Los errores de conexión ya no se ocultan: se propagan como ErrorBaseDatos.
  async consultarAulas(codigo = null) {
    const pool = await conectarDB();
    const request = pool.request();
    let filtro = '';

    if (codigo !== null) {
      request.input('codigo', sql.VarChar, codigo);
      filtro = 'AND UPPER(e.codigo) = @codigo';
    }

    const result = await request.query(`${SQL_AULAS} ${filtro} ORDER BY e.codigo`);
    return result.recordset.map((registro) => this.mapearAula(registro));
  }

  // 1. Obtener nodos
  async obtenerNodos() {
    const pool = await conectarDB();
    const result = await pool.request().query(SQL_NODOS);

    return result.recordset.map((registro) =>
      new Nodo(registro.id, registro.nombre, Number(registro.x), Number(registro.y), String(registro.tipo))
    );
  }

  calcularDistancia(a, b) {
    return Math.round(Math.hypot(b.x - a.x, b.y - a.y) * this.METROS_POR_UNIDAD);
  }

  // 2. Obtener conexiones entre nodos (grafo estrella con centro en el Patio).
  // Recibe los nodos ya consultados para no repetir la consulta a la base de datos.
  async obtenerAristas(nodos) {
    const lista = nodos || (await this.obtenerNodos());
    const patio = buscarPorNombre(lista, 'patio');
    if (lista.length < 2 || !patio) return [];

    const entrada = buscarPorNombre(lista, 'entrada');
    const aristas = [];

    if (entrada) {
      aristas.push(new Arista(entrada.id, patio.id, this.calcularDistancia(entrada, patio)));
    }

    lista
      .filter((nodo) => nodo !== patio && nodo !== entrada)
      .forEach((nodo) => aristas.push(new Arista(patio.id, nodo.id, this.calcularDistancia(patio, nodo))));

    return aristas;
  }

  // 3. Obtener todas las aulas y espacios
  async obtenerAulas() {
    return this.consultarAulas();
  }

  // 4. Buscar aula por código
  async obtenerAulaPorCodigo(codigo) {
    const buscado = normalizarCodigo(codigo);
    if (!buscado) return null;

    const resultado = await this.consultarAulas(buscado);
    return resultado.length > 0 ? resultado[0] : null;
  }

  // 5. Obtener límites del campus
  obtenerLimites() {
    return LIMITES_CAMPUS;
  }

  // 6. Validar coordenadas
  estaDentroDelCampus(x, y) {
    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      x >= LIMITES_CAMPUS.xMin &&
      x <= LIMITES_CAMPUS.xMax &&
      y >= LIMITES_CAMPUS.yMin &&
      y <= LIMITES_CAMPUS.yMax
    );
  }
}

module.exports = new GrafoRepository();
