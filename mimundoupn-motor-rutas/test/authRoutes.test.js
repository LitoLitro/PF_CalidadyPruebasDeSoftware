/**
 * Pruebas de la API de autenticación con Supertest (Práctica 12).
 * Se simula AuthService para comprobar los códigos HTTP y el manejo de la sesión.
 */
jest.mock('../control/AuthService', () => ({ registrar: jest.fn(), iniciarSesion: jest.fn() }));
jest.mock('../control/RutaService', () => ({ generarRuta: jest.fn() }));
jest.mock('../control/MapaService', () => ({ listarAulas: jest.fn(), obtenerMapa: jest.fn() }));

const request = require('supertest');
const app = require('../app');
const AuthService = require('../control/AuthService');
const { ErrorValidacion, ErrorCredenciales, ErrorConflicto } = require('../control/errores');

const estudiante = { usuarioID: 1, nombres: 'Ana', correo: 'ana@upn.pe', rolId: 1, rol: 'Estudiante' };
const docente = { ...estudiante, rolId: 2, rol: 'Docente' };
const errorBD = Object.assign(new Error('No se pudo conectar con la base de datos.'), { code: 'ERROR_BD' });
const login = (agente, cuerpo) => agente.post('/api/login').send(cuerpo);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/registro', () => {
  test('Registro correcto: 200 e inicia la sesión', async () => {
    AuthService.registrar.mockResolvedValue(estudiante);
    const agente = request.agent(app);
    const res = await agente.post('/api/registro').send({ correo: 'ana@upn.pe' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ correcto: true, usuario: estudiante });
    const sesion = await agente.get('/api/sesion');
    expect(sesion.body).toEqual({ autenticado: true, usuario: estudiante });
  });

  test('Datos inválidos: 400 con el mensaje de validación', async () => {
    AuthService.registrar.mockRejectedValue(new ErrorValidacion('Completa todos los campos del registro.'));
    const res = await request(app).post('/api/registro').send({});
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe('Completa todos los campos del registro.');
  });

  test('Correo duplicado: 409 sin depender del texto del mensaje', async () => {
    AuthService.registrar.mockRejectedValue(new ErrorConflicto('Cualquier texto'));
    const res = await request(app).post('/api/registro').send({});
    expect(res.status).toBe(409);
  });

  test('Base de datos caída: 503 sin mostrar el error técnico', async () => {
    AuthService.registrar.mockRejectedValue(errorBD);
    const res = await request(app).post('/api/registro').send({});
    expect(res.status).toBe(503);
    expect(res.body.mensaje).toBe('No se pudo conectar con la base de datos.');
  });

  test('Error inesperado: 500 con mensaje genérico (no expone detalles internos)', async () => {
    AuthService.registrar.mockRejectedValue(new Error('detalle interno de SQL'));
    const res = await request(app).post('/api/registro').send({});
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toBe('No se pudo registrar la cuenta.');
  });
});

describe('POST /api/login', () => {
  test.each([
    [{ contrasena: 'x', tipoUsuario: '1' }, 'Completa todos los campos.'],
    [{ correo: 'a@upn.pe', contrasena: 'x', tipoUsuario: 'invitado' }, 'Selecciona un tipo de usuario válido.'],
  ])('Datos incompletos o tipo inválido: 400 (%#)', async (cuerpo, mensaje) => {
    const res = await request(app).post('/api/login').send(cuerpo);
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toBe(mensaje);
    expect(AuthService.iniciarSesion).not.toHaveBeenCalled();
  });

  test('Login correcto de estudiante: 200 y la sesión queda activa', async () => {
    AuthService.iniciarSesion.mockResolvedValue(estudiante);
    const agente = request.agent(app);
    const res = await login(agente, { correo: 'ana@upn.pe', contrasena: 'Clave123', tipoUsuario: '1' });
    expect(res.status).toBe(200);
    expect((await agente.get('/api/sesion')).status).toBe(200);
  });

  test('Login correcto de docente como administrativo: 200', async () => {
    AuthService.iniciarSesion.mockResolvedValue(docente);
    const res = await login(request(app), { correo: 'doc@upn.pe', contrasena: 'Clave123', tipoUsuario: 'administrativo' });
    expect(res.status).toBe(200);
  });

  test.each([
    ['estudiante que elige administrativo', estudiante, 'administrativo'],
    ['docente que elige estudiante', docente, '1'],
  ])('Tipo que no corresponde al rol (%s): 403', async (_caso, usuario, tipoUsuario) => {
    AuthService.iniciarSesion.mockResolvedValue(usuario);
    const res = await login(request(app), { correo: 'a@upn.pe', contrasena: 'Clave123', tipoUsuario });
    expect(res.status).toBe(403);
  });

  test('Credenciales incorrectas: 401', async () => {
    AuthService.iniciarSesion.mockRejectedValue(new ErrorCredenciales());
    const res = await login(request(app), { correo: 'a@upn.pe', contrasena: 'mal', tipoUsuario: '1' });
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toBe('Correo o contraseña incorrectos.');
  });

  test('Base de datos caída: 503 (antes respondía 401 con el error técnico)', async () => {
    AuthService.iniciarSesion.mockRejectedValue(errorBD);
    const res = await login(request(app), { correo: 'a@upn.pe', contrasena: 'Clave123', tipoUsuario: '1' });
    expect(res.status).toBe(503);
  });

  test('El login genera un identificador de sesión nuevo (evita la fijación de sesión)', async () => {
    AuthService.iniciarSesion.mockResolvedValue(estudiante);
    const agente = request.agent(app);
    AuthService.registrar.mockResolvedValue(estudiante);
    const primera = await agente.post('/api/registro').send({});
    const segunda = await login(agente, { correo: 'ana@upn.pe', contrasena: 'Clave123', tipoUsuario: '1' });
    const cookie = (r) => String(r.headers['set-cookie']).split(';')[0];
    expect(cookie(segunda)).not.toBe(cookie(primera));
  });
});

describe('Sesión', () => {
  test('GET /api/sesion sin iniciar sesión: 401', async () => {
    const res = await request(app).get('/api/sesion');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ autenticado: false });
  });

  test('POST /api/logout cierra la sesión', async () => {
    AuthService.iniciarSesion.mockResolvedValue(estudiante);
    const agente = request.agent(app);
    await login(agente, { correo: 'ana@upn.pe', contrasena: 'Clave123', tipoUsuario: '1' });
    const res = await agente.post('/api/logout');
    expect(res.body.correcto).toBe(true);
    expect((await agente.get('/api/sesion')).status).toBe(401);
  });
});
