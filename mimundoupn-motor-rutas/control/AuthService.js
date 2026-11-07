const bcrypt = require('bcrypt');
const UsuarioRepository = require('../persistence/UsuarioRepository');

const ROLES = {
    1: 'Estudiante',
    2: 'Docente',
    3: 'Administrador'
};

class AuthService {

    // Registrar una cuenta nueva
    async registrar(datos) {

        const { nombres, apellidos, correo, contrasena, tipoUsuario } = datos;

        if (!nombres || !apellidos || !correo || !contrasena || !tipoUsuario) {
            throw new Error('Completa todos los campos del registro.');
        }

        if (tipoUsuario !== '1') {
            throw new Error('El registro público está disponible solamente para estudiantes. Solicita autorización para una cuenta administrativa.');
        }

        if (nombres.trim().length > 100 || apellidos.trim().length > 100) {
            throw new Error('Los nombres o apellidos superan el límite permitido.');
        }

        if (correo.trim().length > 100) {
            throw new Error('El correo supera el límite permitido.');
        }

        if (contrasena.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres.');
        }

        const usuarioExistente = await UsuarioRepository.buscarPorCorreo(correo);

        if (usuarioExistente) {
            throw new Error('Este correo ya está registrado. Inicia sesión con tu cuenta.');
        }

        const hash = await bcrypt.hash(contrasena, 12);

        return await UsuarioRepository.registrarUsuario({
            nombres,
            apellidos,
            correo,
            contrasena: hash
        });
    }

    // Iniciar sesión
    async iniciarSesion(correo, contrasena) {

        if (!correo || !contrasena) {
            throw new Error('Ingresa tu correo y contraseña.');
        }

        const usuario = await UsuarioRepository.buscarPorCorreo(correo.trim());

        if (!usuario) {
            throw new Error('Correo o contraseña incorrectos.');
        }

        if (usuario.estado !== true && usuario.estado !== 1) {
            throw new Error('La cuenta está desactivada.');
        }

        let contrasenaValida = false;

        const tieneHashBcrypt = /^\$2[aby]\$/.test(usuario.contraseña);

        if (tieneHashBcrypt) {
            contrasenaValida = await bcrypt.compare(
                contrasena,
                usuario.contraseña
            );
        } else {
            contrasenaValida = contrasena === usuario.contraseña;

            if (contrasenaValida) {
                const nuevoHash = await bcrypt.hash(contrasena, 12);

                await UsuarioRepository.actualizarContrasena(
                    usuario.usuarioID,
                    nuevoHash
                );
            }
        }

        if (!contrasenaValida) {
            throw new Error('Correo o contraseña incorrectos.');
        }

        const rol = ROLES[usuario.rolId];

        if (!rol) {
            throw new Error('El usuario tiene un rol no reconocido.');
        }

        return {
            usuarioID: usuario.usuarioID,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            correo: usuario.correo,
            rolId: usuario.rolId,
            rol
        };
    }
}

module.exports = new AuthService();