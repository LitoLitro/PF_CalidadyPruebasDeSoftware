/**
 * Pruebas de la conexión a la base de datos (Práctica 12).
 * Se simula el driver de SQL Server para no necesitar una base de datos real.
 */
jest.mock('mssql/msnodesqlv8', () => {
  const connect = jest.fn();
  const ConnectionPool = jest.fn(() => ({ connect }));
  return { ConnectionPool, __connect: connect };
});

const { crearCadenaConexion } = require('../persistence/dbConfig');

describe('dbConfig - cadena de conexión desde .env', () => {
  test('Por defecto usa localhost, BDGeolo y autenticación de Windows', () => {
    const cadena = crearCadenaConexion({});
    expect(cadena).toContain('Driver={ODBC Driver 18 for SQL Server}');
    expect(cadena).toContain('Server=localhost,1433');
    expect(cadena).toContain('Database=BDGeolo');
    expect(cadena).toContain('Trusted_Connection=yes');
    expect(cadena).not.toContain('LAPTOP-');
  });

  test('Usa el servidor, puerto y driver definidos en .env', () => {
    const cadena = crearCadenaConexion({ DB_SERVER: 'MI-PC\\SQLEXPRESS', DB_PORT: '1434', DB_DRIVER: 'ODBC Driver 17 for SQL Server' });
    expect(cadena).toContain('Server=MI-PC\\SQLEXPRESS,1434');
    expect(cadena).toContain('Driver={ODBC Driver 17 for SQL Server}');
  });

  test('Con DB_USER usa autenticación de SQL Server en lugar de la de Windows', () => {
    const cadena = crearCadenaConexion({ DB_USER: 'sa', DB_PASSWORD: 'clave' });
    expect(cadena).toContain('Uid=sa;Pwd=clave');
    expect(cadena).not.toContain('Trusted_Connection');
  });
});

describe('db - conexión única', () => {
  let sql;
  let db;

  beforeEach(() => {
    jest.resetModules();
    sql = require('mssql/msnodesqlv8');
    sql.ConnectionPool.mockClear();
    sql.__connect.mockReset();
    db = require('../persistence/db');
  });

  test('Reutiliza el mismo pool en llamadas sucesivas', async () => {
    const pool = { request: jest.fn() };
    sql.__connect.mockResolvedValue(pool);
    const a = await db.conectarDB();
    const b = await db.conectarDB();
    expect(a).toBe(pool);
    expect(b).toBe(pool);
    expect(sql.ConnectionPool).toHaveBeenCalledTimes(1);
  });

  test('Si la conexión falla lanza ErrorBaseDatos y permite reintentar', async () => {
    sql.__connect.mockRejectedValueOnce(new Error('Login failed')).mockResolvedValueOnce({ ok: true });
    await expect(db.conectarDB()).rejects.toBeInstanceOf(db.ErrorBaseDatos);
    await expect(db.conectarDB()).resolves.toEqual({ ok: true });
    expect(sql.ConnectionPool).toHaveBeenCalledTimes(2);
  });

  test('El ErrorBaseDatos conserva la causa original', async () => {
    const causa = new Error('Login failed');
    sql.__connect.mockRejectedValue(causa);
    await expect(db.conectarDB()).rejects.toMatchObject({ code: 'ERROR_BD', causa });
  });
});
