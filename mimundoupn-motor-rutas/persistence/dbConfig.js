/**
 * PERSISTENCIA - Configuración de la conexión a SQL Server.
 * Los datos se leen del archivo .env (no se sube a GitHub).
 * Copia .env.example como .env y completa los datos de tu PC.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

// Arma la cadena de conexión ODBC a partir de las variables de entorno.
// Si DB_USER está definido se usa autenticación de SQL Server; si no, la de Windows.
function crearCadenaConexion(env = process.env) {
  const partes = [
    `Driver={${env.DB_DRIVER || 'ODBC Driver 18 for SQL Server'}}`,
    `Server=${env.DB_SERVER || 'localhost'},${env.DB_PORT || 1433}`,
    `Database=${env.DB_NAME || 'BDGeolo'}`,
  ];
  if (env.DB_USER) {
    partes.push(`Uid=${env.DB_USER}`, `Pwd=${env.DB_PASSWORD || ''}`);
  } else {
    partes.push('Trusted_Connection=yes');
  }
  partes.push('Encrypt=no', 'TrustServerCertificate=yes');
  return partes.join(';') + ';';
}

module.exports = { crearCadenaConexion };
