/**
 * PERSISTENCIA - Conexión única a SQL Server para todo el sistema.
 * GrafoRepository y UsuarioRepository comparten esta misma conexión.
 */
const sql = require('mssql/msnodesqlv8');
const { crearCadenaConexion } = require('./dbConfig');

/** La base de datos no respondió o la conexión falló. */
class ErrorBaseDatos extends Error {
  constructor(causa) {
    super('No se pudo conectar con la base de datos.');
    this.name = 'ErrorBaseDatos';
    this.code = 'ERROR_BD';
    this.causa = causa;
  }
}

let poolPromise = null;

// Reutiliza el mismo pool de conexiones; si la conexión falla, permite reintentar.
async function conectarDB() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool({ connectionString: crearCadenaConexion() });
    poolPromise = pool.connect().catch((error) => {
      poolPromise = null;
      throw new ErrorBaseDatos(error);
    });
  }
  return poolPromise;
}

module.exports = { sql, conectarDB, ErrorBaseDatos };
