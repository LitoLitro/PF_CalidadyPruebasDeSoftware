jest.mock('../persistence/GrafoRepository', () => ({
  METROS_POR_UNIDAD: 2,
  obtenerNodos: jest.fn(),
  obtenerAristas: jest.fn(),
  obtenerAulaPorCodigo: jest.fn(),
  estaDentroDelCampus: jest.fn((x, y) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 100 && y >= 0 && y <= 70),
}));

jest.mock('../persistence/AmbienteRepository', () => ({
  listar: jest.fn(),
  obtenerPorId: jest.fn(),
  existeCodigo: jest.fn(),
  listarConexiones: jest.fn(),
  listarHorarios: jest.fn(),
  listarCatalogos: jest.fn(),
  crear: jest.fn(),
  actualizar: jest.fn(),
  reemplazarHorarios: jest.fn(),
  eliminar: jest.fn(),
}));

const grafoRepo = require('../persistence/GrafoRepository');
const ambienteRepo = require('../persistence/AmbienteRepository');
const Nodo = require('../entity/Nodo');
const Arista = require('../entity/Arista');
const Ambiente = require('../entity/Ambiente');
const AmbienteService = require('../control/AmbienteService');
const { dijkstra } = require('../control/RutaService');

const catalogos = {
  tipos: [{ id: 1, nombre: 'Aula' }, { id: 3, nombre: 'Servicio' }, { id: 5, nombre: 'Patio' }, { id: 7, nombre: 'Ingreso' }],
  pabellones: [{ id: 1, nombre: 'Pabellón A' }, { id: 2, nombre: 'Pabellón B' }],
};

const patio = new Nodo(13, 'Patio Central', 50, 35, '5');
const entrada = new Nodo(14, 'Entrada Principal', 50, 68, '7');
const b101 = new Nodo(3, 'Salón 01', 29, 10, '1');
const nodos = [patio, entrada, b101];

const datosValidos = {
  codigo: ' b104 ',
  nombre: 'Salón 04',
  tipoEspacioId: '1',
  pabellonId: '2',
  piso: '1',
  capacidad: '35',
  x: 53,
  y: 10,
};

describe('CRUD de ambientes - validación de datos', () => {

  test('Normaliza un ambiente válido', () => {
    const a = AmbienteService.validarDatos(datosValidos, catalogos);
    expect(a).toBeInstanceOf(Ambiente);
    expect(a.codigo).toBe('B104');
    expect(a.pabellonId).toBe(2);
    expect(a.capacidad).toBe(35);
    expect(a.x).toBe(53);
  });

  test.each([
    [{ codigo: '' }, 'El código es obligatorio.'],
    [{ codigo: 'B 104' }, 'solo admite letras, números y guiones'],
    [{ nombre: '   ' }, 'El nombre es obligatorio.'],
    [{ nombre: 'x'.repeat(51) }, 'máximo 50 caracteres'],
    [{ tipoEspacioId: 99 }, 'tipo de ambiente válido'],
    [{ pabellonId: 9 }, 'El pabellón seleccionado no existe.'],
    [{ piso: 0 }, 'El piso debe ser un número entero'],
    [{ capacidad: -5 }, 'La capacidad debe ser un número entero'],
    [{ x: 150 }, 'dentro de los límites del campus'],
    [{ y: '' }, 'dentro de los límites del campus'],
  ])('Rechaza datos inválidos %#', (cambio, mensaje) => {
    expect(() => AmbienteService.validarDatos({ ...datosValidos, ...cambio }, catalogos)).toThrow(mensaje);
  });

  test('El pabellón es opcional (área común)', () => {
    const a = AmbienteService.validarDatos({ ...datosValidos, pabellonId: '' }, catalogos);
    expect(a.pabellonId).toBeNull();
  });
});

describe('CRUD de ambientes - aristas y pesos', () => {

  test('El peso es la distancia en metros (unidades x METROS_POR_UNIDAD)', () => {
    expect(AmbienteService.calcularPeso({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(10);
    expect(AmbienteService.calcularPeso({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(1);
  });

  test('Calcula el peso de las conexiones indicadas sin distancia', () => {
    const c = AmbienteService.construirConexiones({ x: 50, y: 10 }, [{ destinoId: 13 }], nodos);
    expect(c).toEqual([{ destinoId: 13, peso: 50 }]);
  });

  test('Respeta la distancia indicada por el administrador', () => {
    const c = AmbienteService.construirConexiones({ x: 50, y: 10 }, [{ destinoId: 13, peso: 60 }, 3], nodos);
    expect(c).toEqual([{ destinoId: 13, peso: 60 }, { destinoId: 3, peso: 42 }]);
  });

  test('Sin conexiones se une al nodo más cercano', () => {
    const c = AmbienteService.construirConexiones({ x: 30, y: 12 }, [], nodos);
    expect(c).toEqual([{ destinoId: 3, peso: 4 }]);
  });

  test('No permite conectarse consigo mismo', () => {
    expect(() => AmbienteService.construirConexiones({ x: 30, y: 12 }, [{ destinoId: 3 }], nodos, 3))
      .toThrow('no existe o no está activo');
  });

  test('Rechaza conexiones repetidas, inexistentes o con peso inválido', () => {
    expect(() => AmbienteService.construirConexiones({ x: 1, y: 1 }, [13, 13], nodos)).toThrow('repetida');
    expect(() => AmbienteService.construirConexiones({ x: 1, y: 1 }, [99], nodos)).toThrow('no existe');
    expect(() => AmbienteService.construirConexiones({ x: 1, y: 1 }, [{ destinoId: 13, peso: 0 }], nodos))
      .toThrow('entero entre 1 y 10000');
    expect(() => AmbienteService.construirConexiones({ x: 1, y: 1 }, 'patio', nodos)).toThrow('como una lista');
  });

  test('Dijkstra usa el nuevo nodo y sus aristas', () => {
    const nuevo = new Nodo(20, 'Salón 04', 53, 10, '1');
    const conexiones = AmbienteService.construirConexiones(nuevo, [{ destinoId: 13 }], nodos);
    const aristas = [
      new Arista(13, 14, 66),
      new Arista(13, 3, 65),
      ...conexiones.map((c) => new Arista(nuevo.id, c.destinoId, c.peso)),
    ];
    const r = dijkstra([...nodos, nuevo], aristas, 14, 20);
    expect(r.ruta).toEqual([14, 13, 20]);
    expect(r.distanciaTotal).toBe(66 + conexiones[0].peso);
  });
});

describe('CRUD de ambientes - operaciones', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    ambienteRepo.listarCatalogos.mockResolvedValue(catalogos);
    ambienteRepo.existeCodigo.mockResolvedValue(false);
    ambienteRepo.listarConexiones.mockResolvedValue([]);
    ambienteRepo.listarHorarios.mockResolvedValue([]);
    grafoRepo.obtenerNodos.mockResolvedValue(nodos);
  });

  test('Crear: guarda el ambiente con sus aristas y horarios', async () => {
    ambienteRepo.crear.mockResolvedValue(20);
    ambienteRepo.obtenerPorId.mockResolvedValue(new Ambiente({ id: 20, codigo: 'B104', nombre: 'Salón 04', tipoEspacioId: 1, x: 53, y: 10 }));

    const creado = await AmbienteService.crear({
      ...datosValidos,
      conexiones: [{ destinoId: 13 }, { destinoId: 3, peso: 30 }],
      horarios: [{ diaSem: 1, apertura: '08:00', cierre: '12:00' }],
    });

    const [ambiente, conexiones, horarios] = ambienteRepo.crear.mock.calls[0];
    expect(ambiente.codigo).toBe('B104');
    expect(conexiones).toEqual([{ destinoId: 13, peso: 50 }, { destinoId: 3, peso: 30 }]);
    expect(horarios).toEqual([{ diaSem: 1, apertura: '08:00', cierre: '12:00' }]);
    expect(creado.id).toBe(20);
  });

  test('Crear: rechaza un código duplicado con 409', async () => {
    ambienteRepo.existeCodigo.mockResolvedValue(true);
    await expect(AmbienteService.crear(datosValidos)).rejects.toMatchObject({ status: 409, codigo: 'CODIGO_DUPLICADO' });
    expect(ambienteRepo.crear).not.toHaveBeenCalled();
  });

  test('Crear: un horario inválido no llega a la base de datos', async () => {
    await expect(AmbienteService.crear({ ...datosValidos, horarios: [{ diaSem: 1, apertura: '12:00', cierre: '08:00' }] }))
      .rejects.toMatchObject({ status: 400 });
    expect(ambienteRepo.crear).not.toHaveBeenCalled();
  });

  test('Editar: si cambia la ubicación recalcula los pesos de sus conexiones', async () => {
    ambienteRepo.obtenerPorId.mockResolvedValue(new Ambiente({ id: 3, codigo: 'B101', nombre: 'Salón 01', tipoEspacioId: 1, x: 29, y: 10 }));
    ambienteRepo.listarConexiones.mockResolvedValue([{ destinoId: 13, peso: 65 }]);
    ambienteRepo.actualizar.mockResolvedValue(true);

    await AmbienteService.actualizar(3, { ...datosValidos, codigo: 'B101', x: 50, y: 15 });

    const [id, , conexiones, horarios] = ambienteRepo.actualizar.mock.calls[0];
    expect(id).toBe(3);
    expect(conexiones).toEqual([{ destinoId: 13, peso: 40 }]);
    expect(horarios).toBeNull(); // no se enviaron: no se tocan
  });

  test('Editar: sin cambios de ubicación ni conexiones no reescribe aristas', async () => {
    ambienteRepo.obtenerPorId.mockResolvedValue(new Ambiente({ id: 3, codigo: 'B101', nombre: 'Salón 01', tipoEspacioId: 1, x: 53, y: 10 }));
    ambienteRepo.actualizar.mockResolvedValue(true);

    await AmbienteService.actualizar(3, { ...datosValidos, codigo: 'B101' });
    expect(ambienteRepo.actualizar.mock.calls[0][2]).toBeNull();
  });

  test('Editar: ambiente inexistente responde 404', async () => {
    ambienteRepo.obtenerPorId.mockResolvedValue(null);
    await expect(AmbienteService.actualizar(99, datosValidos)).rejects.toMatchObject({ status: 404 });
    await expect(AmbienteService.actualizar('abc', datosValidos)).rejects.toMatchObject({ status: 404 });
  });

  test('Horarios: se reemplazan desde el CRUD', async () => {
    ambienteRepo.obtenerPorId.mockResolvedValue(new Ambiente({ id: 2, codigo: 'A102', nombre: 'Biblioteca', tipoEspacioId: 3, x: 14, y: 42 }));
    await AmbienteService.actualizarHorarios(2, [{ diaSem: 6, apertura: '09:00', cierre: '13:00' }]);
    expect(ambienteRepo.reemplazarHorarios).toHaveBeenCalledWith(2, [{ diaSem: 6, apertura: '09:00', cierre: '13:00' }]);
  });

  test('Eliminar: baja lógica de un ambiente', async () => {
    ambienteRepo.obtenerPorId.mockResolvedValue(new Ambiente({ id: 3, codigo: 'B101', nombre: 'Salón 01', tipoEspacioId: 1, x: 29, y: 10 }));
    ambienteRepo.eliminar.mockResolvedValue(true);
    await expect(AmbienteService.eliminar(3)).resolves.toEqual({ id: 3, codigo: 'B101' });
    expect(ambienteRepo.eliminar).toHaveBeenCalledWith(3);
  });

  test('Eliminar: el Patio Central y la Entrada están protegidos', async () => {
    ambienteRepo.obtenerPorId.mockResolvedValue(new Ambiente({ id: 13, codigo: 'PATIO', nombre: 'Patio Central', tipoEspacioId: 5, x: 50, y: 35 }));
    await expect(AmbienteService.eliminar(13)).rejects.toMatchObject({ status: 409, codigo: 'AMBIENTE_PROTEGIDO' });
    expect(ambienteRepo.eliminar).not.toHaveBeenCalled();
  });
});
