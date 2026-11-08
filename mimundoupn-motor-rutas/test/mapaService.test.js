/**
 * Pruebas de MapaService (Práctica 12).
 */
jest.mock('../persistence/GrafoRepository', () => ({
  obtenerNodos: jest.fn(),
  obtenerAristas: jest.fn(),
  obtenerAulas: jest.fn(),
  obtenerLimites: jest.fn(),
}));

const grafoRepo = require('../persistence/GrafoRepository');
const { listarAulas, obtenerMapa } = require('../control/MapaService');

beforeEach(() => jest.clearAllMocks());

describe('MapaService', () => {
  test('obtenerMapa devuelve nodos, aristas y límites con una sola consulta de nodos', async () => {
    const nodos = [{ id: 1 }];
    grafoRepo.obtenerNodos.mockResolvedValue(nodos);
    grafoRepo.obtenerAristas.mockResolvedValue([{ origenId: 1, destinoId: 2, peso: 10 }]);
    grafoRepo.obtenerLimites.mockReturnValue({ xMin: 0, xMax: 100, yMin: 0, yMax: 70 });

    const mapa = await obtenerMapa();

    expect(grafoRepo.obtenerNodos).toHaveBeenCalledTimes(1);
    expect(grafoRepo.obtenerAristas).toHaveBeenCalledWith(nodos);
    expect(mapa).toEqual({
      nodos,
      aristas: [{ origenId: 1, destinoId: 2, peso: 10 }],
      limites: { xMin: 0, xMax: 100, yMin: 0, yMax: 70 },
    });
  });

  test('listarAulas devuelve las aulas del repositorio', async () => {
    grafoRepo.obtenerAulas.mockResolvedValue([{ codigo: 'BIB' }]);
    expect(await listarAulas()).toEqual([{ codigo: 'BIB' }]);
  });
});
