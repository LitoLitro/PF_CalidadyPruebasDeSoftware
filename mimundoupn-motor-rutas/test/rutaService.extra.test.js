/**
 * Escenarios adicionales de RutaService (Práctica 12).
 * Cubren las ramas que no tenían prueba: ubicación inválida, sin ruta,
 * tramo desde la ubicación del usuario y error de base de datos.
 */
jest.mock('../persistence/GrafoRepository', () => ({
  METROS_POR_UNIDAD: 2,
  obtenerAulaPorCodigo: jest.fn(),
  obtenerNodos: jest.fn(),
  obtenerAristas: jest.fn(),
  estaDentroDelCampus: jest.fn(),
}));

const Nodo = require('../entity/Nodo');
const Arista = require('../entity/Arista');
const Aula = require('../entity/Aula');
const grafoRepo = require('../persistence/GrafoRepository');
const { generarRuta } = require('../control/RutaService');

const entrada = new Nodo(1, 'Entrada principal', 10, 50, '7');
const patio = new Nodo(2, 'Patio central', 40, 50, '5');
const lab = new Nodo(3, 'Laboratorio 1', 40, 20, '2');
const aislada = new Nodo(4, 'Aula sin conexión', 90, 60, '1');
const nodos = [entrada, patio, lab, aislada];
const aristas = [new Arista(1, 2, 60), new Arista(2, 3, 60)];

const aulaLab = new Aula('LAB1', 'Laboratorio 1', 3, 'Pabellón A', 2, 'Laboratorio');
const aulaAislada = new Aula('A999', 'Aula sin conexión', 4, 'Pabellón A', 1, 'Aula');

beforeEach(() => {
  jest.clearAllMocks();
  grafoRepo.estaDentroDelCampus.mockReturnValue(true);
  grafoRepo.obtenerNodos.mockResolvedValue(nodos);
  grafoRepo.obtenerAristas.mockResolvedValue(aristas);
});

describe('RutaService - escenarios adicionales', () => {
  test.each([
    ['vacío', '', 50],
    ['texto', 'abc', 50],
    ['nulo', 10, null],
  ])('Origen %s devuelve UBICACION_INVALIDA', async (_caso, origenX, origenY) => {
    const r = await generarRuta({ origenX, origenY, codigoAulaDestino: 'LAB1' });
    expect(r.error).toBe('UBICACION_INVALIDA');
    expect(grafoRepo.obtenerAulaPorCodigo).not.toHaveBeenCalled();
  });

  test('Aula sin conexión en el grafo devuelve SIN_RUTA', async () => {
    grafoRepo.obtenerAulaPorCodigo.mockResolvedValue(aulaAislada);
    const r = await generarRuta({ origenX: 10, origenY: 50, codigoAulaDestino: 'A999' });
    expect(r.error).toBe('SIN_RUTA');
  });

  test('Usuario lejos de un nodo: la ruta empieza en "Tu ubicación"', async () => {
    grafoRepo.obtenerAulaPorCodigo.mockResolvedValue(aulaLab);
    const r = await generarRuta({ origenX: 10, origenY: 60, codigoAulaDestino: 'LAB1' });
    expect(r.ruta[0]).toEqual({ x: 10, y: 60, nombre: 'Tu ubicación' });
    expect(r.tramos[0]).toEqual({ desde: 'Tu ubicación', hasta: 'Entrada principal', metros: 20 });
    expect(r.distanciaTotal).toBe(60 + 60 + 20);
    expect(r.minutos).toBe(2);
  });

  test('Usuario sobre un nodo: no se agrega tramo de acceso', async () => {
    grafoRepo.obtenerAulaPorCodigo.mockResolvedValue(aulaLab);
    const r = await generarRuta({ origenX: 10, origenY: 50, codigoAulaDestino: 'LAB1' });
    expect(r.ruta.map((p) => p.nombre)).toEqual(['Entrada principal', 'Patio central', 'Laboratorio 1']);
    expect(r.tramos).toHaveLength(2);
    expect(r.distanciaTotal).toBe(120);
  });

  test('Origen igual al destino: distancia 0 y 0 minutos', async () => {
    grafoRepo.obtenerAulaPorCodigo.mockResolvedValue(aulaLab);
    const r = await generarRuta({ origenX: 40, origenY: 20, codigoAulaDestino: 'LAB1' });
    expect(r.distanciaTotal).toBe(0);
    expect(r.minutos).toBe(0);
  });

  test('Los nodos se consultan una sola vez y se reutilizan para las aristas', async () => {
    grafoRepo.obtenerAulaPorCodigo.mockResolvedValue(aulaLab);
    await generarRuta({ origenX: 10, origenY: 50, codigoAulaDestino: 'LAB1' });
    expect(grafoRepo.obtenerNodos).toHaveBeenCalledTimes(1);
    expect(grafoRepo.obtenerAristas).toHaveBeenCalledWith(nodos);
  });

  test('Si la base de datos falla, el error se propaga (no se oculta como "aula no encontrada")', async () => {
    const errorBD = Object.assign(new Error('BD caída'), { code: 'ERROR_BD' });
    grafoRepo.obtenerAulaPorCodigo.mockRejectedValue(errorBD);
    await expect(generarRuta({ origenX: 10, origenY: 50, codigoAulaDestino: 'LAB1' })).rejects.toMatchObject({
      code: 'ERROR_BD',
    });
  });
});
