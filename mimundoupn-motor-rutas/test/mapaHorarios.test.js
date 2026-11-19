jest.mock('../persistence/GrafoRepository', () => ({ obtenerAulas: jest.fn() }));
jest.mock('../persistence/AmbienteRepository', () => ({ listarHorarios: jest.fn() }));
jest.mock('../persistence/UsuarioRepository', () => ({ buscarPorCorreo: jest.fn() }));
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

const grafoRepo = require('../persistence/GrafoRepository');
const ambienteRepo = require('../persistence/AmbienteRepository');
const UsuarioRepository = require('../persistence/UsuarioRepository');
const bcrypt = require('bcrypt');
const Aula = require('../entity/Aula');
const HoraAtencion = require('../entity/HoraAtencion');
const MapaService = require('../control/MapaService');
const AuthService = require('../control/AuthService');

describe('Horarios en el mapa', () => {
  const lunes1000 = new Date(2026, 10, 16, 10, 0);

  beforeEach(() => {
    jest.clearAllMocks();
    grafoRepo.obtenerAulas.mockResolvedValue([
      new Aula('A101', 'Cafetería', 1, 'Pabellón A', 1, 'Servicio'),
      new Aula('B101', 'Salón 01', 3, 'Pabellón B', 1, 'Aula'),
    ]);
  });

  test('Cada ambiente trae sus horarios y si está abierto', async () => {
    ambienteRepo.listarHorarios.mockResolvedValue([new HoraAtencion(1, 1, 1, '07:00', '21:00')]);
    const aulas = await MapaService.listarAulas(lunes1000);
    expect(aulas[0].horarios).toEqual([{ diaSem: 1, apertura: '07:00', cierre: '21:00' }]);
    expect(aulas[0].abiertoAhora).toBe(true);
    expect(aulas[1].horarios).toEqual([]);
    expect(aulas[1].abiertoAhora).toBeNull();
  });

  test('Si fallan los horarios el mapa sigue mostrando los ambientes', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    ambienteRepo.listarHorarios.mockRejectedValue(new Error('sin tabla'));
    const aulas = await MapaService.listarAulas(lunes1000);
    expect(aulas).toHaveLength(2);
    expect(aulas[0].abiertoAhora).toBeNull();
    console.error.mockRestore();
  });
});

describe('Roles según la tabla ROL', () => {
  test.each([[1, 'Estudiante'], [2, 'Docente'], [3, 'Colaborador'], [4, 'Administrador']])(
    'rolId %i se reconoce como %s', async (rolId, rol) => {
      UsuarioRepository.buscarPorCorreo.mockResolvedValue({
        usuarioID: 1, nombres: 'A', apellidos: 'B', correo: 'a@upn.edu.pe',
        contraseña: '$2b$12$hash', estado: true, rolId,
      });
      bcrypt.compare.mockResolvedValue(true);
      const usuario = await AuthService.iniciarSesion('a@upn.edu.pe', 'Clave1234');
      expect(usuario.rol).toBe(rol);
    });
});
