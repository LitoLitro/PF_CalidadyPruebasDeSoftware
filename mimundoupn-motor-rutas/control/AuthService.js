/**
 * CONTROL
 * Reglas de negocio del registro e inicio de sesión.
 */
const bcrypt = require('bcrypt');
const UsuarioRepository = require('../persistence/UsuarioRepository');
const { ErrorValidacion, ErrorCredenciales, ErrorConflicto } = require('./errores');

const ROLES = {
    1: 'Estudiante',
    2: 'Docente',
    3: 'Administrador'
};

const COSTO_BCRYPT = 12;
const LONGITUD_MINIMA_CONTRASENA = 8;
const LONGITUD_MAXIMA_TEXTO = 100;

const esHashBcrypt = (valor) => /^\$2[aby]\$/.test(valor);
const cuentaActiva = (usuario) => usuario.estado === true || usuario.estado === 1;

const faltaAlgunCampo = (d) => !d.nombres || !d.apellidos || !d.correo || !d.contrasena || !d.tipoUsuario;
const superaLimite = (texto) => texto.trim().length > LONGITUD_MAXIMA_TEXTO;

// Reglas del registro: cada una indica cuándo falla y qué mensaje mostrar.
// Se revisan en orden y se informa la primera que no se cumple.
const REGLAS_REGISTRO = [
    [faltaAlgunCampo, 'Completa todos los campos del registro.'],
    [(d) => d.tipoUsuario !== '1', 'El registro público está disponible solamente para estudiantes. Solicita autorización para una cuenta administrativa.'],
    [(d) => superaLimite(d.nombres) || superaLimite(d.apellidos), 'Los nombres o apellidos superan el límite permitido.'],
    [(d) => superaLimite(d.correo), 'El correo supera el límite permitido.'],
    [(d) => d.contrasena.length < LONGITUD_MINIMA_CONTRASENA, 'La contraseña debe tener al menos 8 caracteres.'],
];

// Valida los datos del formulario de registro. Lanza ErrorValidacion si algo no cumple.
function validarDatosRegistro(datos) {
    const reglaIncumplida = REGLAS_REGISTRO.find(([incumple]) => incumple(datos));
    if (reglaIncumplida) {
        throw new ErrorValidacion(reglaIncumplida[1]);
    }
}

// Compara la contraseña ingresada con la guardada.
// Si la guardada aún está en texto plano (cuentas antiguas) y coincide, se migra a bcrypt.
async function verificarContrasena(usuario, contrasena) {
    if (esHashBcrypt(usuario.contraseña)) {
        return bcrypt.compare(contrasena, usuario.contraseña);
    }

    const coincide = contrasena === usuario.contraseña;
    if (coincide) {
        const nuevoHash = await bcrypt.hash(contrasena, COSTO_BCRYPT);
        await UsuarioRepository.actualizarContrasena(usuario.usuarioID, nuevoHash);
    }
    return coincide;
}

class AuthService {

    // Registrar una cuenta nueva
    async registrar(datos) {
        validarDatosRegistro(datos);

        const { nombres, apellidos, correo, contrasena } = datos;
        if (await UsuarioRepository.buscarPorCorreo(correo)) {
            throw new ErrorConflicto('Este correo ya está registrado. Inicia sesión con tu cuenta.');
        }

        const hash = await bcrypt.hash(contrasena, COSTO_BCRYPT);
        return UsuarioRepository.registrarUsuario({ nombres, apellidos, correo, contrasena: hash });
    }

    // Iniciar sesión
    async iniciarSesion(correo, contrasena) {
        if (!correo || !contrasena) {
            throw new ErrorValidacion('Ingresa tu correo y contraseña.');
        }

        const usuario = await UsuarioRepository.buscarPorCorreo(correo.trim());
        if (!usuario) {
            throw new ErrorCredenciales();
        }
        if (!cuentaActiva(usuario)) {
            throw new ErrorCredenciales('La cuenta está desactivada.');
        }
        if (!(await verificarContrasena(usuario, contrasena))) {
            throw new ErrorCredenciales();
        }

        const rol = ROLES[usuario.rolId];
        if (!rol) {
            throw new ErrorCredenciales('El usuario tiene un rol no reconocido.');
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
