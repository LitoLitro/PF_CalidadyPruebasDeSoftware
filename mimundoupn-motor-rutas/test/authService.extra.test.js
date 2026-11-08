/**
 * Escenarios adicionales del servicio de autenticación (Práctica 12).
 * Cubren las ramas sin prueba: límites de longitud, migración de contraseñas
 * antiguas y el tipo de error que recibe la capa Boundary.
 */
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('../persistence/UsuarioRepository', () => ({
  buscarPorCorreo: jest.fn(),
  registrarUsuario: jest.fn(),
  actualizarContrasena: jest.fn(),
}));

const bcrypt = require('bcrypt');
const UsuarioRepository = require('../persistence/UsuarioRepository');
const AuthService = require('../control/AuthService');
const { ErrorValidacion, ErrorCredenciales, ErrorConflicto } = require('../control/errores');

const registroValido = { nombres: 'Ana', apellidos: 'Lopez', correo: 'ana@upn.pe', contrasena: 'Clave123', tipoUsuario: '1' };
const usuarioBD = (extra = {}) => ({
  usuarioID: 4, nombres: 'Ana', apellidos: 'Lopez', correo: 'ana@upn.pe', rolId: 1, estado: 1, contraseña: '$2b$12$hash', ...extra,
});

beforeEach(() => jest.clearAllMocks());

describe('AuthService - escenarios adicionales', () => {
  test.each([
    ['nombres', { nombres: 'A'.repeat(101) }, 'Los nombres o apellidos superan el límite permitido.'],
    ['apellidos', { apellidos: 'L'.repeat(101) }, 'Los nombres o apellidos superan el límite permitido.'],
    ['correo', { correo: `${'a'.repeat(95)}@upn.pe` }, 'El correo supera el límite permitido.'],
  ])('Rechaza %s con más de 100 caracteres', async (_campo, cambio, mensaje) => {
    await expect(AuthService.registrar({ ...registroValido, ...cambio })).rejects.toThrow(mensaje);
    expect(UsuarioRepository.buscarPorCorreo).not.toHaveBeenCalled();
  });

  test('Los errores de validación son ErrorValidacion (HTTP 400)', async () => {
    await expect(AuthService.registrar({})).rejects.toMatchObject({ estadoHttp: 400 });
    await expect(AuthService.registrar({})).rejects.toBeInstanceOf(ErrorValidacion);
  });

  test('Correo ya registrado es ErrorConflicto (HTTP 409)', async () => {
    UsuarioRepository.buscarPorCorreo.mockResolvedValue(usuarioBD());
    await expect(AuthService.registrar(registroValido)).rejects.toBeInstanceOf(ErrorConflicto);
  });

  test('El registro guarda la contraseña cifrada con bcrypt (costo 12), nunca en texto plano', async () => {
    UsuarioRepository.buscarPorCorreo.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hash-generado');
    await AuthService.registrar(registroValido);
    expect(UsuarioRepository.registrarUsuario).toHaveBeenCalledWith(expect.objectContaining({ contrasena: 'hash-generado' }));
  });

  test('Credenciales incorrectas son ErrorCredenciales (HTTP 401)', async () => {
    UsuarioRepository.buscarPorCorreo.mockResolvedValue(null);
    await expect(AuthService.iniciarSesion('x@upn.pe', 'Clave123')).rejects.toBeInstanceOf(ErrorCredenciales);
  });

  test('Cuenta antigua con contraseña en texto plano: inicia sesión y se migra a bcrypt', async () => {
    UsuarioRepository.buscarPorCorreo.mockResolvedValue(usuarioBD({ contraseña: 'Clave123' }));
    bcrypt.hash.mockResolvedValue('hash-migrado');
    const usuario = await AuthService.iniciarSesion('ana@upn.pe', 'Clave123');
    expect(usuario.rol).toBe('Estudiante');
    expect(UsuarioRepository.actualizarContrasena).toHaveBeenCalledWith(4, 'hash-migrado');
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test('Cuenta antigua con contraseña incorrecta: se rechaza y no se migra', async () => {
    UsuarioRepository.buscarPorCorreo.mockResolvedValue(usuarioBD({ contraseña: 'Clave123' }));
    await expect(AuthService.iniciarSesion('ana@upn.pe', 'otra')).rejects.toThrow('Correo o contraseña incorrectos.');
    expect(UsuarioRepository.actualizarContrasena).not.toHaveBeenCalled();
  });

  test('El correo se busca sin espacios', async () => {
    UsuarioRepository.buscarPorCorreo.mockResolvedValue(usuarioBD());
    bcrypt.compare.mockResolvedValue(true);
    await AuthService.iniciarSesion('  ana@upn.pe  ', 'Clave123');
    expect(UsuarioRepository.buscarPorCorreo).toHaveBeenCalledWith('ana@upn.pe');
  });

  test.each([[2, 'Docente'], [3, 'Administrador']])('Rol %i se devuelve como %s', async (rolId, rol) => {
    UsuarioRepository.buscarPorCorreo.mockResolvedValue(usuarioBD({ rolId }));
    bcrypt.compare.mockResolvedValue(true);
    expect((await AuthService.iniciarSesion('ana@upn.pe', 'Clave123')).rol).toBe(rol);
  });

  test('La respuesta del login no incluye la contraseña', async () => {
    UsuarioRepository.buscarPorCorreo.mockResolvedValue(usuarioBD());
    bcrypt.compare.mockResolvedValue(true);
    const usuario = await AuthService.iniciarSesion('ana@upn.pe', 'Clave123');
    expect(usuario).not.toHaveProperty('contraseña');
  });
});
