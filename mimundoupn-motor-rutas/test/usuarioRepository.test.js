/**
 * Pruebas del repositorio de usuarios (Práctica 12).
 * Se simula la conexión de db.js, incluida la transacción del registro.
 */
jest.mock('../persistence/db', () => {
  const request = { input: jest.fn(), query: jest.fn() };
  request.input.mockReturnValue(request);
  const transaccion = {
    begin: jest.fn(), commit: jest.fn(), rollback: jest.fn(),
    request: jest.fn(() => request),
  };
  const tipo = (nombre) => Object.assign(() => nombre, { nombre });
  return {
    sql: {
      VarChar: tipo('VarChar'), NVarChar: tipo('NVarChar'), Int: 'Int', DateTime: 'DateTime', Bit: 'Bit',
      ISOLATION_LEVEL: { SERIALIZABLE: 'SERIALIZABLE' },
      Transaction: jest.fn(() => transaccion),
    },
    conectarDB: jest.fn(),
    __request: request,
    __transaccion: transaccion,
  };
});

const db = require('../persistence/db');
const UsuarioRepository = require('../persistence/UsuarioRepository');
const { ErrorConflicto } = require('../control/errores');

const datos = { nombres: ' Ana ', apellidos: ' Lopez ', correo: ' ana@upn.pe ', contrasena: 'hash' };

beforeEach(() => {
  jest.clearAllMocks();
  db.conectarDB.mockResolvedValue({ request: () => db.__request });
  db.__request.input.mockReturnValue(db.__request);
});

describe('UsuarioRepository', () => {
  test('buscarPorCorreo quita espacios y devuelve el usuario encontrado', async () => {
    db.__request.query.mockResolvedValue({ recordset: [{ usuarioID: 1, correo: 'ana@upn.pe' }] });
    const usuario = await UsuarioRepository.buscarPorCorreo('  ana@upn.pe ');
    expect(db.__request.input).toHaveBeenCalledWith('correo', 'VarChar', 'ana@upn.pe');
    expect(usuario.usuarioID).toBe(1);
  });

  test('buscarPorCorreo devuelve null si el correo no existe', async () => {
    db.__request.query.mockResolvedValue({ recordset: [] });
    expect(await UsuarioRepository.buscarPorCorreo('nadie@upn.pe')).toBeNull();
  });

  test('registrarUsuario inserta dentro de una transacción y confirma', async () => {
    db.__request.query
      .mockResolvedValueOnce({ recordset: [] })              // correo libre
      .mockResolvedValueOnce({ recordset: [{ nuevoID: 8 }] }) // siguiente id
      .mockResolvedValueOnce({ rowsAffected: [1] });         // insert
    const usuario = await UsuarioRepository.registrarUsuario(datos);
    expect(usuario).toEqual({ usuarioID: 8, nombres: 'Ana', apellidos: 'Lopez', correo: 'ana@upn.pe', rolId: 1, rol: 'Estudiante' });
    expect(db.__transaccion.begin).toHaveBeenCalledWith('SERIALIZABLE');
    expect(db.__transaccion.commit).toHaveBeenCalled();
    expect(db.__transaccion.rollback).not.toHaveBeenCalled();
  });

  test('Correo duplicado durante el registro: ErrorConflicto (409) y se revierte la transacción', async () => {
    db.__request.query.mockResolvedValueOnce({ recordset: [{ usuarioID: 3 }] });
    await expect(UsuarioRepository.registrarUsuario(datos)).rejects.toBeInstanceOf(ErrorConflicto);
    expect(db.__transaccion.rollback).toHaveBeenCalled();
    expect(db.__transaccion.commit).not.toHaveBeenCalled();
  });

  test('Si falla el insert se revierte la transacción y se propaga el error', async () => {
    db.__request.query
      .mockResolvedValueOnce({ recordset: [] })
      .mockResolvedValueOnce({ recordset: [{ nuevoID: 9 }] })
      .mockRejectedValueOnce(new Error('fallo de insert'));
    await expect(UsuarioRepository.registrarUsuario(datos)).rejects.toThrow('fallo de insert');
    expect(db.__transaccion.rollback).toHaveBeenCalled();
  });

  test('Si no se pudo iniciar la transacción no se intenta revertir', async () => {
    db.__transaccion.begin.mockRejectedValueOnce(new Error('sin transacción'));
    await expect(UsuarioRepository.registrarUsuario(datos)).rejects.toThrow('sin transacción');
    expect(db.__transaccion.rollback).not.toHaveBeenCalled();
  });

  test.each([
    ['actualizarContrasena', [5, 'nuevo-hash'], [['usuarioID', 'Int', 5], ['contrasena', 'VarChar', 'nuevo-hash']]],
    ['guardarCorreoPersonalPendiente', [5, ' ana@gmail.com '], [['usuarioID', 'Int', 5], ['correoPersonal', 'NVarChar', 'ana@gmail.com']]],
    ['verificarCorreoPersonal', [5], [['usuarioID', 'Int', 5]]],
  ])('%s envía sus parámetros y devuelve true si actualizó una fila', async (metodo, args, parametros) => {
    db.__request.query.mockResolvedValue({ rowsAffected: [1] });
    expect(await UsuarioRepository[metodo](...args)).toBe(true);
    parametros.forEach((p) => expect(db.__request.input).toHaveBeenCalledWith(...p));
    expect(db.__request.query.mock.calls[0][0]).toContain('UPDATE dbo.USUARIO');
  });

  test('Una actualización que no modifica filas devuelve false', async () => {
    db.__request.query.mockResolvedValue({ rowsAffected: [0] });
    expect(await UsuarioRepository.verificarCorreoPersonal(99)).toBe(false);
  });
});
