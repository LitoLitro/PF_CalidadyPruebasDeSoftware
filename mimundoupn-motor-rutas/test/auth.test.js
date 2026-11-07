
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

jest.mock('../persistence/UsuarioRepository', () => ({
    buscarPorCorreo: jest.fn(),
    registrarUsuario: jest.fn(),
    actualizarContrasena: jest.fn()
}));

const bcrypt = require('bcrypt');
const UsuarioRepository = require('../persistence/UsuarioRepository');
const AuthService = require('../control/AuthService');

describe('Pruebas del servicio de autenticación', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Registro de usuarios', () => {

        const datosValidos = {
            nombres: 'Ana',
            apellidos: 'Lopez',
            correo: 'ana@upn.pe',
            contrasena: 'Clave123',
            tipoUsuario: '1'
        };

        test('Registrar un usuario correctamente', async () => {
            UsuarioRepository.buscarPorCorreo.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hash-generado');
            UsuarioRepository.registrarUsuario.mockResolvedValue(true);

            const resultado = await AuthService.registrar(datosValidos);

            expect(resultado).toBe(true);
            expect(bcrypt.hash).toHaveBeenCalledWith('Clave123', 12);
            expect(UsuarioRepository.registrarUsuario).toHaveBeenCalled();
        });

        test('Rechazar registro con campos faltantes', async () => {
            await expect(
                AuthService.registrar({ nombres: 'Ana' })
            ).rejects.toThrow('Completa todos los campos del registro.');
        });

        test('Rechazar registro con rol no permitido', async () => {
            await expect(
                AuthService.registrar({
                    ...datosValidos,
                    tipoUsuario: '2'
                })
            ).rejects.toThrow('El registro público está disponible solamente para estudiantes.');
        });

        test('Rechazar contraseña menor a 8 caracteres', async () => {
            await expect(
                AuthService.registrar({
                    ...datosValidos,
                    contrasena: '123'
                })
            ).rejects.toThrow('La contraseña debe tener al menos 8 caracteres.');
        });

        test('Rechazar correo duplicado', async () => {
            UsuarioRepository.buscarPorCorreo.mockResolvedValue({
                usuarioID: 1
            });

            await expect(
                AuthService.registrar(datosValidos)
            ).rejects.toThrow('Este correo ya está registrado.');

            expect(UsuarioRepository.registrarUsuario).not.toHaveBeenCalled();
        });
    });

    describe('Inicio de sesión', () => {

        const usuarioValido = {
            usuarioID: 1,
            nombres: 'Ana',
            apellidos: 'Lopez',
            correo: 'ana@upn.pe',
            contraseña: '$2b$12$hash',
            estado: true,
            rolId: 1
        };

        test('Iniciar sesión correctamente', async () => {
            UsuarioRepository.buscarPorCorreo.mockResolvedValue(usuarioValido);
            bcrypt.compare.mockResolvedValue(true);

            const resultado = await AuthService.iniciarSesion(
                'ana@upn.pe',
                'Clave123'
            );

            expect(resultado.correo).toBe('ana@upn.pe');
            expect(resultado.rol).toBe('Estudiante');
        });

        test('Rechazar inicio de sesión con datos faltantes', async () => {
            await expect(
                AuthService.iniciarSesion('', '')
            ).rejects.toThrow('Ingresa tu correo y contraseña.');
        });

        test('Rechazar usuario inexistente', async () => {
            UsuarioRepository.buscarPorCorreo.mockResolvedValue(null);

            await expect(
                AuthService.iniciarSesion('noexiste@upn.pe', 'Clave123')
            ).rejects.toThrow('Correo o contraseña incorrectos.');
        });

        test('Rechazar cuenta desactivada', async () => {
            UsuarioRepository.buscarPorCorreo.mockResolvedValue({
                ...usuarioValido,
                estado: false
            });

            await expect(
                AuthService.iniciarSesion('ana@upn.pe', 'Clave123')
            ).rejects.toThrow('La cuenta está desactivada.');
        });

        test('Rechazar contraseña incorrecta', async () => {
            UsuarioRepository.buscarPorCorreo.mockResolvedValue(usuarioValido);
            bcrypt.compare.mockResolvedValue(false);

            await expect(
                AuthService.iniciarSesion('ana@upn.pe', 'Incorrecta123')
            ).rejects.toThrow('Correo o contraseña incorrectos.');
        });

        test('Rechazar rol no reconocido', async () => {
            UsuarioRepository.buscarPorCorreo.mockResolvedValue({
                ...usuarioValido,
                rolId: 99
            });
            bcrypt.compare.mockResolvedValue(true);

            await expect(
                AuthService.iniciarSesion('ana@upn.pe', 'Clave123')
            ).rejects.toThrow('El usuario tiene un rol no reconocido.');
        });
    });
});

