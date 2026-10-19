
jest.mock('../persistence/GrafoRepository', () => ({
  METROS_POR_UNIDAD: 1,
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

describe('HU01 - Pruebas de Aceptación', () => {

  const nodoOrigen = new Nodo(1, 'Entrada principal', 10, 50, 'ingreso');
  const nodoDestino = new Nodo(2, 'Aula 101', 40, 30, 'aula');
  const nodosMock = [nodoOrigen, nodoDestino];
  const aristasMock = [new Arista(1, 2, 50)];
  const aulaMock = new Aula('A101', 'Aula 101', 2, 'Bloque A', 1, 'Aula');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CA1: Generación de Ruta
  test('CA1: Genera la ruta más corta cuando el aula existe y el origen es válido', async () => {

    grafoRepo.obtenerAulaPorCodigo.mockResolvedValue(aulaMock);
    grafoRepo.obtenerNodos.mockResolvedValue(nodosMock);
    grafoRepo.obtenerAristas.mockResolvedValue(aristasMock);
    grafoRepo.estaDentroDelCampus.mockReturnValue(true);

    const resultado = await generarRuta({
      origenX: 10,
      origenY: 50,
      codigoAulaDestino: 'A101',
    });

    expect(resultado.error).toBeUndefined();
    expect(resultado.aula.codigo).toBe('A101');
    expect(resultado.distanciaTotal).toBeGreaterThan(0);
    expect(resultado.ruta.length).toBeGreaterThanOrEqual(2);
    expect(resultado.minutos).toBeGreaterThanOrEqual(1);
  });

  // CA2: Aula no existe

  test('CA2: Retorna AULA_NO_ENCONTRADA cuando el código no existe', async () => {
    grafoRepo.obtenerAulaPorCodigo.mockResolvedValue(null); 
    grafoRepo.estaDentroDelCampus.mockReturnValue(true);

    const resultado = await generarRuta({
      origenX: 10,
      origenY: 50,
      codigoAulaDestino: 'NOEXISTE',
    });

    expect(resultado.error).toBe('AULA_NO_ENCONTRADA');
    expect(resultado.mensaje).toContain('NOEXISTE');
  });

  // CA3: Fuera de Rango
  
  test('CA3: Retorna FUERA_DE_RANGO cuando el origen está fuera del campus', async () => {
    grafoRepo.estaDentroDelCampus.mockReturnValue(false); 
    const resultado = await generarRuta({
      origenX: 5000,
      origenY: 5000,
      codigoAulaDestino: 'A101',
    });

    expect(resultado.error).toBe('FUERA_DE_RANGO');
  });
});