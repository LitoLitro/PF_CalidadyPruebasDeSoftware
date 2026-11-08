/**
 * Pruebas de la API del mapa y las rutas con Supertest (Práctica 12).
 * Se simulan los servicios para comprobar los códigos HTTP y las respuestas.
 */
jest.mock('../control/RutaService', () => ({ generarRuta: jest.fn() }));
jest.mock('../control/MapaService', () => ({ listarAulas: jest.fn(), obtenerMapa: jest.fn() }));
jest.mock('../control/AuthService', () => ({ registrar: jest.fn(), iniciarSesion: jest.fn() }));

const request = require('supertest');
const app = require('../app');
const RutaService = require('../control/RutaService');
const MapaService = require('../control/MapaService');

const errorBD = Object.assign(new Error('BD caída'), { code: 'ERROR_BD' });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('API REST', () => {
  test('GET /api/aulas responde 200 con la lista de aulas', async () => {
    MapaService.listarAulas.mockResolvedValue([{ codigo: 'LAB1' }]);
    const res = await request(app).get('/api/aulas');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ codigo: 'LAB1' }]);
  });

  test('GET /api/mapa responde 200 con nodos, aristas y límites', async () => {
    MapaService.obtenerMapa.mockResolvedValue({ nodos: [], aristas: [], limites: { xMax: 100 } });
    const res = await request(app).get('/api/mapa');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('limites.xMax', 100);
  });

  test('POST /api/rutas responde 200 cuando se genera la ruta', async () => {
    RutaService.generarRuta.mockResolvedValue({ distanciaTotal: 120, minutos: 2 });
    const res = await request(app).post('/api/rutas').send({ origenX: 2, origenY: 56, codigoAulaDestino: 'LAB1' });
    expect(res.status).toBe(200);
    expect(RutaService.generarRuta).toHaveBeenCalledWith({ origenX: 2, origenY: 56, codigoAulaDestino: 'LAB1' });
  });

  test('POST /api/rutas responde 400 cuando el aula no existe (CA2)', async () => {
    RutaService.generarRuta.mockResolvedValue({ error: 'AULA_NO_ENCONTRADA', mensaje: 'No encontrada' });
    const res = await request(app).post('/api/rutas').send({ origenX: 2, origenY: 56, codigoAulaDestino: 'G804' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('AULA_NO_ENCONTRADA');
  });

  test('POST /api/rutas sin cuerpo no rompe el servidor', async () => {
    RutaService.generarRuta.mockResolvedValue({ error: 'UBICACION_INVALIDA', mensaje: '' });
    const res = await request(app).post('/api/rutas');
    expect(res.status).toBe(400);
  });

  test.each([
    ['GET', '/api/aulas', () => MapaService.listarAulas],
    ['GET', '/api/mapa', () => MapaService.obtenerMapa],
    ['POST', '/api/rutas', () => RutaService.generarRuta],
  ])('DEF-03: %s %s responde 503 ERROR_BD si la base de datos falla', async (metodo, ruta, servicio) => {
    servicio().mockRejectedValue(errorBD);
    const res = metodo === 'GET' ? await request(app).get(ruta) : await request(app).post(ruta).send({});
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'ERROR_BD', mensaje: 'No se pudo conectar con la base de datos.' });
  });

  test('Una ruta /api inexistente responde 404 en formato JSON', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.correcto).toBe(false);
  });

  test('Un error inesperado responde 500 ERROR_INTERNO', async () => {
    MapaService.listarAulas.mockRejectedValue(new Error('inesperado'));
    const res = await request(app).get('/api/aulas');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('ERROR_INTERNO');
  });
});
