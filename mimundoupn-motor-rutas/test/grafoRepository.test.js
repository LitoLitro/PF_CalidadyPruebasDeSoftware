/**
 * Pruebas del repositorio del mapa (Práctica 12).
 * Se simula la conexión de db.js para probar la lógica sin una base de datos real.
 */
jest.mock('../persistence/db', () => {
  const request = { input: jest.fn(), query: jest.fn() };
  request.input.mockReturnValue(request);
  return {
    sql: { VarChar: 'VarChar' },
    conectarDB: jest.fn(),
    __request: request,
  };
});

const db = require('../persistence/db');
const grafoRepo = require('../persistence/GrafoRepository');
const Nodo = require('../entity/Nodo');

const filasNodos = [
  { id: 6, nombre: 'Entrada principal', x: '2.000000', y: '56.000000', tipo: 7 },
  { id: 7, nombre: 'Patio central', x: '46.000000', y: '56.000000', tipo: 5 },
  { id: 3, nombre: 'Laboratorio 1', x: '64.000000', y: '18.000000', tipo: 2 },
];
const filaAula = { codigo: 'LAB1', nombre: 'Laboratorio 1', nodoId: 3, bloque: 'Pabellón A', piso: 2, categoria: 'Laboratorio' };
const nodo = (id, nombre, x, y) => new Nodo(id, nombre, x, y, '1');
const errorBD = Object.assign(new Error('No se pudo conectar con la base de datos.'), { code: 'ERROR_BD' });

beforeEach(() => {
  jest.clearAllMocks();
  db.conectarDB.mockResolvedValue({ request: () => db.__request });
  db.__request.input.mockReturnValue(db.__request);
});

describe('GrafoRepository', () => {
  test('obtenerNodos convierte longitud/latitud (decimales) en números x/y', async () => {
    db.__request.query.mockResolvedValue({ recordset: filasNodos });
    const nodos = await grafoRepo.obtenerNodos();
    expect(nodos[0]).toBeInstanceOf(Nodo);
    expect(nodos[0]).toMatchObject({ id: 6, x: 2, y: 56, tipo: '7' });
  });

  test('obtenerAristas arma el grafo estrella con pesos en metros', async () => {
    const nodos = [nodo(6, 'Entrada principal', 2, 56), nodo(7, 'Patio central', 46, 56), nodo(3, 'Laboratorio 1', 64, 18)];
    const aristas = await grafoRepo.obtenerAristas(nodos);
    expect(aristas).toEqual([
      { origenId: 6, destinoId: 7, peso: 88 },
      { origenId: 7, destinoId: 3, peso: Math.round(Math.hypot(18, 38) * 2) },
    ]);
    expect(db.conectarDB).not.toHaveBeenCalled(); // reutiliza los nodos recibidos
  });

  test('Sin Entrada, el Patio se conecta con todos los demás espacios', async () => {
    const nodos = [nodo(7, 'Patio central', 46, 56), nodo(1, 'Aula 101', 8, 56), nodo(2, 'Aula 102', 22, 56)];
    const aristas = await grafoRepo.obtenerAristas(nodos);
    expect(aristas.map((a) => a.destinoId)).toEqual([1, 2]);
  });

  test('Sin Patio no se generan conexiones (el mapa carga sin rutas)', async () => {
    const nodos = [nodo(1, 'Aula 101', 8, 56), nodo(2, 'Aula 102', 22, 56)];
    expect(await grafoRepo.obtenerAristas(nodos)).toEqual([]);
  });

  test('Con menos de 2 nodos no se generan conexiones', async () => {
    expect(await grafoRepo.obtenerAristas([nodo(7, 'Patio central', 46, 56)])).toEqual([]);
  });

  test('Sin recibir nodos, obtenerAristas los consulta una vez', async () => {
    db.__request.query.mockResolvedValue({ recordset: filasNodos });
    const aristas = await grafoRepo.obtenerAristas();
    expect(db.__request.query).toHaveBeenCalledTimes(1);
    expect(aristas).toHaveLength(2);
  });

  test('Si SQL Server no responde, el error se propaga (no se oculta como lista vacía)', async () => {
    db.conectarDB.mockRejectedValue(errorBD);
    await expect(grafoRepo.obtenerAulas()).rejects.toMatchObject({ code: 'ERROR_BD' });
    await expect(grafoRepo.obtenerNodos()).rejects.toMatchObject({ code: 'ERROR_BD' });
    await expect(grafoRepo.obtenerAulaPorCodigo('LAB1')).rejects.toMatchObject({ code: 'ERROR_BD' });
  });

  test('obtenerAulaPorCodigo normaliza el código y lo envía como parámetro (evita inyección SQL)', async () => {
    db.__request.query.mockResolvedValue({ recordset: [filaAula] });
    const aula = await grafoRepo.obtenerAulaPorCodigo("  lab1' OR 1=1 --  ");
    expect(db.__request.input).toHaveBeenCalledWith('codigo', 'VarChar', "LAB1' OR 1=1 --");
    expect(db.__request.query.mock.calls[0][0]).toContain('@codigo');
    expect(db.__request.query.mock.calls[0][0]).not.toContain('OR 1=1');
    expect(aula.codigo).toBe('LAB1');
  });

  test('obtenerAulaPorCodigo devuelve null si no hay coincidencias', async () => {
    db.__request.query.mockResolvedValue({ recordset: [] });
    expect(await grafoRepo.obtenerAulaPorCodigo('G804')).toBeNull();
  });

  test('obtenerAulaPorCodigo con código vacío devuelve null sin consultar la base de datos', async () => {
    expect(await grafoRepo.obtenerAulaPorCodigo('   ')).toBeNull();
    expect(db.conectarDB).not.toHaveBeenCalled();
  });

  test('obtenerAulas devuelve todas las aulas sin filtro', async () => {
    db.__request.query.mockResolvedValue({ recordset: [filaAula] });
    const aulas = await grafoRepo.obtenerAulas();
    expect(aulas).toHaveLength(1);
    expect(db.__request.input).not.toHaveBeenCalled();
  });

  test.each([
    [0, 0, true],
    [100, 70, true],
    [50, 35, true],
    [-0.1, 35, false],
    [100.1, 35, false],
    [50, 70.1, false],
    [NaN, 35, false],
  ])('estaDentroDelCampus(%p, %p) = %p (incluye los bordes)', (x, y, esperado) => {
    expect(grafoRepo.estaDentroDelCampus(x, y)).toBe(esperado);
  });
});
