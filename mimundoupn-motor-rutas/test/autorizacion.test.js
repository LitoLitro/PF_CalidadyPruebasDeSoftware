// Pruebas de API: el CRUD solo es accesible para el rol Administrador (validado en el backend)
jest.mock('../control/AuthService', () => ({ iniciarSesion: jest.fn(), registrar: jest.fn() }));
jest.mock('../control/AmbienteService', () => ({
  listar: jest.fn(), obtener: jest.fn(), catalogos: jest.fn(), crear: jest.fn(),
  actualizar: jest.fn(), actualizarHorarios: jest.fn(), eliminar: jest.fn(),
}));
jest.mock('../control/FavoritoService', () => ({ listar: jest.fn(), guardar: jest.fn(), eliminar: jest.fn() }));
jest.mock('../control/MapaService', () => ({ listarAulas: jest.fn(), obtenerMapa: jest.fn() }));
jest.mock('../persistence/GrafoRepository', () => ({}));

const request = require('supertest');
const app = require('../app');
const AuthService = require('../control/AuthService');
const AmbienteService = require('../control/AmbienteService');
const FavoritoService = require('../control/FavoritoService');
const ErrorNegocio = require('../control/ErrorNegocio');
const { requiereRol } = require('../boundary/autorizacion');

const USUARIOS = {
  estudiante: { usuarioID: 1, nombres: 'Juan', rolId: 1, rol: 'Estudiante', tipo: '1' },
  docente: { usuarioID: 2, nombres: 'María', rolId: 2, rol: 'Docente', tipo: 'administrativo' },
  colaborador: { usuarioID: 6, nombres: 'Luis', rolId: 3, rol: 'Colaborador', tipo: 'administrativo' },
  admin: { usuarioID: 5, nombres: 'Administrador', rolId: 4, rol: 'Administrador', tipo: 'administrativo' },
};

// Inicia sesion y devuelve un agente que conserva la cookie
async function sesionComo(clave) {
  const { tipo, ...usuario } = USUARIOS[clave];
  AuthService.iniciarSesion.mockResolvedValueOnce(usuario);
  const agente = request.agent(app);
  await agente.post('/api/login')
    .send({ correo: `${clave}@upn.edu.pe`, contrasena: 'Clave1234', tipoUsuario: tipo })
    .expect(200);
  return agente;
}

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());
beforeEach(() => jest.clearAllMocks());

describe('Middleware requiereRol', () => {
  const res = () => {
    const r = {};
    r.status = jest.fn(() => r);
    r.json = jest.fn(() => r);
    return r;
  };

  test('Sin sesión responde 401', () => {
    const r = res(); const next = jest.fn();
    requiereRol(4)({ session: {} }, r, next);
    expect(r.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('Con otro rol responde 403', () => {
    const r = res(); const next = jest.fn();
    requiereRol(4)({ session: { usuario: { rolId: 1 } } }, r, next);
    expect(r.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('Con el rol permitido continúa', () => {
    const r = res(); const next = jest.fn();
    requiereRol(1, 2, 3)({ session: { usuario: { rolId: '3' } } }, r, next);
    expect(next).toHaveBeenCalled();
    expect(r.status).not.toHaveBeenCalled();
  });
});

describe('API /api/admin (CRUD de ambientes)', () => {

  test('Sin sesión: 401 y no llega a la capa Control', async () => {
    await request(app).get('/api/admin/ambientes').expect(401);
    await request(app).post('/api/admin/ambientes').send({ codigo: 'X1' }).expect(401);
    await request(app).delete('/api/admin/ambientes/3').expect(401);
    expect(AmbienteService.listar).not.toHaveBeenCalled();
    expect(AmbienteService.crear).not.toHaveBeenCalled();
    expect(AmbienteService.eliminar).not.toHaveBeenCalled();
  });

  test.each(['estudiante', 'docente', 'colaborador'])('Rol %s: 403 en todas las operaciones', async (clave) => {
    const agente = await sesionComo(clave);
    await agente.get('/api/admin/ambientes').expect(403);
    await agente.get('/api/admin/catalogos').expect(403);
    await agente.post('/api/admin/ambientes').send({ codigo: 'X1' }).expect(403);
    await agente.put('/api/admin/ambientes/3').send({ codigo: 'X1' }).expect(403);
    await agente.put('/api/admin/ambientes/3/horarios').send({ horarios: [] }).expect(403);
    const r = await agente.delete('/api/admin/ambientes/3').expect(403);
    expect(r.body.error).toBe('SIN_PERMISO');
    expect(AmbienteService.crear).not.toHaveBeenCalled();
    expect(AmbienteService.actualizar).not.toHaveBeenCalled();
    expect(AmbienteService.eliminar).not.toHaveBeenCalled();
  });

  test('Administrador: lista, crea, edita, cambia horarios y elimina', async () => {
    const agente = await sesionComo('admin');
    AmbienteService.listar.mockResolvedValue([{ id: 1, codigo: 'A101' }]);
    AmbienteService.crear.mockResolvedValue({ id: 20, codigo: 'B104' });
    AmbienteService.actualizar.mockResolvedValue({ id: 20, codigo: 'B104' });
    AmbienteService.actualizarHorarios.mockResolvedValue({ id: 20 });
    AmbienteService.eliminar.mockResolvedValue({ id: 20, codigo: 'B104' });

    const lista = await agente.get('/api/admin/ambientes').expect(200);
    expect(lista.body).toHaveLength(1);

    const datos = { codigo: 'B104', nombre: 'Salón 04', conexiones: [{ destinoId: 13 }] };
    await agente.post('/api/admin/ambientes').send(datos).expect(201);
    expect(AmbienteService.crear).toHaveBeenCalledWith(datos);

    await agente.put('/api/admin/ambientes/20').send(datos).expect(200);
    expect(AmbienteService.actualizar).toHaveBeenCalledWith('20', datos);

    const horarios = [{ diaSem: 1, apertura: '08:00', cierre: '12:00' }];
    await agente.put('/api/admin/ambientes/20/horarios').send({ horarios }).expect(200);
    expect(AmbienteService.actualizarHorarios).toHaveBeenCalledWith('20', horarios);

    await agente.delete('/api/admin/ambientes/20').expect(200);
    expect(AmbienteService.eliminar).toHaveBeenCalledWith('20');
  });

  test('Administrador: los errores de negocio conservan su código HTTP', async () => {
    const agente = await sesionComo('admin');
    AmbienteService.crear.mockRejectedValue(new ErrorNegocio(409, 'CODIGO_DUPLICADO', 'Ya existe un ambiente con el código A101.'));
    const r = await agente.post('/api/admin/ambientes').send({ codigo: 'A101' }).expect(409);
    expect(r.body).toMatchObject({ correcto: false, error: 'CODIGO_DUPLICADO' });

    AmbienteService.listar.mockRejectedValue(new Error('fallo SQL'));
    const r2 = await agente.get('/api/admin/ambientes').expect(500);
    expect(r2.body.mensaje).not.toContain('SQL');
  });

  test('Tras cerrar sesión se vuelve a exigir autenticación', async () => {
    const agente = await sesionComo('admin');
    await agente.post('/api/logout').expect(200);
    await agente.get('/api/admin/ambientes').expect(401);
  });
});

describe('API /api/favoritos', () => {

  test('Sin sesión: 401', async () => {
    await request(app).get('/api/favoritos').expect(401);
  });

  test.each(['estudiante', 'docente', 'colaborador'])('Rol %s: puede guardar, ver y borrar', async (clave) => {
    const agente = await sesionComo(clave);
    const { usuarioID } = USUARIOS[clave];
    FavoritoService.listar.mockResolvedValue([{ id: 1, codigo: 'A102' }]);
    FavoritoService.guardar.mockResolvedValue({ id: 1, codigo: 'A102' });
    FavoritoService.eliminar.mockResolvedValue({ id: 1 });

    await agente.post('/api/favoritos').send({ codigo: 'A102' }).expect(201);
    expect(FavoritoService.guardar).toHaveBeenCalledWith(expect.objectContaining({ usuarioID }), { codigo: 'A102' });

    const lista = await agente.get('/api/favoritos').expect(200);
    expect(lista.body).toHaveLength(1);
    expect(FavoritoService.listar).toHaveBeenCalledWith(expect.objectContaining({ usuarioID }));

    await agente.delete('/api/favoritos/1').expect(200);
    expect(FavoritoService.eliminar).toHaveBeenCalledWith(expect.objectContaining({ usuarioID }), '1');
  });

  test('El usuario se toma de la sesión, no del cuerpo de la petición', async () => {
    const agente = await sesionComo('estudiante');
    FavoritoService.guardar.mockResolvedValue({ id: 1 });
    await agente.post('/api/favoritos').send({ codigo: 'A102', usuarioID: 999 }).expect(201);
    expect(FavoritoService.guardar.mock.calls[0][0].usuarioID).toBe(1);
  });

  test('Favorito ajeno o inexistente: 404', async () => {
    const agente = await sesionComo('estudiante');
    FavoritoService.eliminar.mockRejectedValue(new ErrorNegocio(404, 'FAVORITO_NO_ENCONTRADO', 'La ruta favorita no existe.'));
    await agente.delete('/api/favoritos/50').expect(404);
  });
});

describe('Inicio de sesión del Administrador', () => {
  test('El rol 4 entra como personal administrativo', async () => {
    const agente = await sesionComo('admin');
    const r = await agente.get('/api/sesion').expect(200);
    expect(r.body.usuario.rol).toBe('Administrador');
  });
});
