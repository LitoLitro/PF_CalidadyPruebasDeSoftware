

const sql = require('mssql/msnodesqlv8');
const Nodo = require('../entity/Nodo');
const Arista = require('../entity/Arista');
const Aula = require('../entity/Aula');

// Configuración de SQL Server
const dbConfig = {
  connectionString:
    'Driver={ODBC Driver 18 for SQL Server};Server=ADMI\\SQLEXPRESS;Database=BDGeolo;Uid=Adrian;Pwd=1234;Encrypt=no;TrustServerCertificate=yes;'
};

// Límites del plano
const LIMITES_CAMPUS = {
  xMin: 0,
  xMax: 100,
  yMin: 0,
  yMax: 70
};

class GrafoRepository {
  constructor() {
    this.METROS_POR_UNIDAD = 2;
    this.poolPromise = null;
  }

  // Obtener o reutilizar la conexión con SQL Server
  async obtenerConexion() {
    if (!this.poolPromise) {
      this.poolPromise = sql.connect(dbConfig).catch(error => {
        this.poolPromise = null;
        throw error;
      });
    }

    return this.poolPromise;
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

  // Consulta reutilizable para obtener aulas y espacios
  async consultarAulas(codigo = null) {
    const pool = await this.obtenerConexion();
    const request = pool.request();

    let filtro = '';

    if (codigo !== null) {
      request.input('codigo', sql.VarChar, codigo);
      filtro = 'AND UPPER(e.codigo) = @codigo';
    }

    const result = await request.query(`
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
      WHERE e.estado = 1
      ${filtro}
      ORDER BY e.codigo
    `);

    return result.recordset.map(registro =>
      this.mapearAula(registro)
    );
  }

  // 1. Obtener nodos
  async obtenerNodos() {
    try {
      const pool = await this.obtenerConexion();

      const result = await pool.request().query(`
        SELECT
          espacioId AS id,
          nombre,
          longitud AS x,
          latitud AS y,
          tipoEspacioId AS tipo
        FROM ESPACIO
        WHERE estado = 1
      `);

      return result.recordset.map(registro =>
        new Nodo(
          registro.id,
          registro.nombre,
          Number(registro.x),
          Number(registro.y),
          String(registro.tipo)
        )
      );

    } catch (error) {
      console.error('Error al obtener nodos:', error);
      return [];
    }
  }

  // 2. Obtener conexiones entre nodos
  async obtenerAristas() {
    const nodos = await this.obtenerNodos();
    const aristas = [];

    if (nodos.length < 2) {
      return aristas;
    }

    const patio = nodos.find(n =>
      n.nombre.toLowerCase().includes('patio')
    );

    const entrada = nodos.find(n =>
      n.nombre.toLowerCase().includes('entrada')
    );

    const calcularDistancia = (a, b) => {
      const distancia = Math.hypot(
        b.x - a.x,
        b.y - a.y
      );

      return Math.round(
        distancia * this.METROS_POR_UNIDAD
      );
    };

    if (entrada && patio) {
      aristas.push(
        new Arista(
          entrada.id,
          patio.id,
          calcularDistancia(entrada, patio)
        )
      );
    }

    if (patio) {
      nodos.forEach(nodo => {
        if (
          nodo.id !== patio.id &&
          (!entrada || nodo.id !== entrada.id)
        ) {
          aristas.push(
            new Arista(
              patio.id,
              nodo.id,
              calcularDistancia(patio, nodo)
            )
          );
        }
      });
    }

    return aristas;
  }

  // 3. Obtener todas las aulas y espacios
  async obtenerAulas() {
    try {
      return await this.consultarAulas();

    } catch (error) {
      console.error('Error al obtener aulas:', error);
      return [];
    }
  }

  // 4. Buscar aula por código
  async obtenerAulaPorCodigo(codigo) {
    try {
      const buscado = String(codigo || '')
        .trim()
        .toUpperCase();

      if (!buscado) {
        return null;
      }

      const resultado = await this.consultarAulas(buscado);

      return resultado.length > 0
        ? resultado[0]
        : null;

    } catch (error) {
      console.error('Error al buscar aula:', error);
      return null;
    }
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
