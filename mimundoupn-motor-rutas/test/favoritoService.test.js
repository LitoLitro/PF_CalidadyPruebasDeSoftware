jest.mock('../persistence/FavoritoRepository', () => ({
  listarPorUsuario: jest.fn(),
  existe: jest.fn(),
  crear: jest.fn(),
  eliminar: jest.fn(),
}));

jest.mock('../persistence/GrafoRepository', () => ({
  obtenerAulaPorCodigo: jest.fn(),
}));

const favoritoRepo = require('../persistence/FavoritoRepository');
const grafoRepo = require('../persistence/GrafoRepository');
const Aula = require('../entity/Aula');
const Favorito = require('../entity/Favorito');
const FavoritoService = require('../control/FavoritoService');

describe('Rutas favoritas', () => {
  const alumno = { usuarioID: 7, rolId: 1 };
  const biblioteca = new Aula('A102', 'Biblioteca', 2, 'Pabellón A', 1, 'Servicio');

  beforeEach(() => {
    jest.clearAllMocks();
    grafoRepo.obtenerAulaPorCodigo.mockResolvedValue(biblioteca);
    favoritoRepo.existe.mockResolvedValue(false);
    favoritoRepo.crear.mockImplementation(async (u, e, n) => new Favorito(1, u, e, n, new Date()));
  });

  test('Lista solo los favoritos del usuario en sesión', async () => {
    favoritoRepo.listarPorUsuario.mockResolvedValue([]);
    await FavoritoService.listar(alumno);
    expect(favoritoRepo.listarPorUsuario).toHaveBeenCalledWith(7);
  });

  test('Guarda la ruta hacia un ambiente con nombre por defecto', async () => {
    const fav = await FavoritoService.guardar(alumno, { codigo: 'a102' });
    expect(grafoRepo.obtenerAulaPorCodigo).toHaveBeenCalledWith('A102');
    expect(favoritoRepo.crear).toHaveBeenCalledWith(7, 2, 'Ruta a Biblioteca');
    expect(fav.codigo).toBe('A102');
    expect(fav.ambiente).toBe('Biblioteca');
  });

  test('Guarda con un nombre personalizado', async () => {
    await FavoritoService.guardar(alumno, { codigo: 'A102', nombre: '  Para estudiar ' });
    expect(favoritoRepo.crear).toHaveBeenCalledWith(7, 2, 'Para estudiar');
  });

  test('Rechaza un destino vacío o inexistente', async () => {
    await expect(FavoritoService.guardar(alumno, {})).rejects.toMatchObject({ status: 400 });
    grafoRepo.obtenerAulaPorCodigo.mockResolvedValue(null);
    await expect(FavoritoService.guardar(alumno, { codigo: 'Z999' })).rejects.toMatchObject({ status: 404 });
    expect(favoritoRepo.crear).not.toHaveBeenCalled();
  });

  test('Rechaza un nombre demasiado largo', async () => {
    await expect(FavoritoService.guardar(alumno, { codigo: 'A102', nombre: 'x'.repeat(101) }))
      .rejects.toMatchObject({ status: 400 });
  });

  test('No duplica una ruta favorita', async () => {
    favoritoRepo.existe.mockResolvedValue(true);
    await expect(FavoritoService.guardar(alumno, { codigo: 'A102' }))
      .rejects.toMatchObject({ status: 409, codigo: 'FAVORITO_DUPLICADO' });
  });

  test('Borra solo si el favorito es del usuario', async () => {
    favoritoRepo.eliminar.mockResolvedValue(true);
    await expect(FavoritoService.eliminar(alumno, '5')).resolves.toEqual({ id: 5 });
    expect(favoritoRepo.eliminar).toHaveBeenCalledWith(5, 7);

    favoritoRepo.eliminar.mockResolvedValue(false);
    await expect(FavoritoService.eliminar(alumno, '6')).rejects.toMatchObject({ status: 404 });
  });

  test('Un id no numérico responde 404 sin consultar la base de datos', async () => {
    await expect(FavoritoService.eliminar(alumno, 'abc')).rejects.toMatchObject({ status: 404 });
    expect(favoritoRepo.eliminar).not.toHaveBeenCalled();
  });
});
