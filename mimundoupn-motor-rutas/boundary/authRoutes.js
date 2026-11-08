/**
 * BOUNDARY
 * Endpoints de registro, inicio de sesión, sesión actual y cierre de sesión.
 */
const express = require('express');
const router = express.Router();

const AuthService = require('../control/AuthService');

const TIPOS_USUARIO = ['1', 'administrativo'];

// Convierte un error en una respuesta HTTP. Usa el tipo de error, no el texto del mensaje.
function responderError(res, contexto, error, mensajePorDefecto) {
    console.error(`Error en ${contexto}:`, error);

    if (error.estadoHttp) {
        return res.status(error.estadoHttp).json({ correcto: false, mensaje: error.message });
    }
    if (error.code === 'ERROR_BD') {
        return res.status(503).json({ correcto: false, mensaje: 'No se pudo conectar con la base de datos.' });
    }
    return res.status(500).json({ correcto: false, mensaje: mensajePorDefecto });
}

// Crea una sesión nueva para el usuario (regenerar el id evita la fijación de sesión).
function abrirSesion(req, res, usuario, mensajeExito, mensajeFallo) {
    req.session.regenerate((error) => {
        if (error) {
            console.error('Error al crear sesión:', error);
            return res.status(500).json({ correcto: false, mensaje: mensajeFallo });
        }

        req.session.usuario = usuario;
        return res.json({ correcto: true, mensaje: mensajeExito, usuario });
    });
}

// El tipo elegido en el formulario debe coincidir con el rol de la cuenta.
function tipoCorrespondeAlRol(tipoUsuario, rolId) {
    if (tipoUsuario === '1') return rolId === 1;
    return [2, 3].includes(rolId);
}

// REGISTRO DE USUARIO
router.post('/api/registro', async (req, res) => {
    try {
        const usuario = await AuthService.registrar(req.body);
        return abrirSesion(req, res, usuario,
            'Cuenta creada correctamente.',
            'La cuenta se creó, pero no se pudo iniciar la sesión.');
    } catch (error) {
        return responderError(res, 'el registro', error, 'No se pudo registrar la cuenta.');
    }
});

// INICIO DE SESIÓN
router.post('/api/login', async (req, res) => {
    const { correo, contrasena, tipoUsuario } = req.body || {};

    if (!correo || !contrasena || !tipoUsuario) {
        return res.status(400).json({ correcto: false, mensaje: 'Completa todos los campos.' });
    }
    if (!TIPOS_USUARIO.includes(String(tipoUsuario))) {
        return res.status(400).json({ correcto: false, mensaje: 'Selecciona un tipo de usuario válido.' });
    }

    try {
        const usuario = await AuthService.iniciarSesion(correo, contrasena);

        if (!tipoCorrespondeAlRol(String(tipoUsuario), usuario.rolId)) {
            return res.status(403).json({
                correcto: false,
                mensaje: 'El tipo de usuario seleccionado no corresponde a esta cuenta.'
            });
        }

        return abrirSesion(req, res, usuario, 'Inicio de sesión exitoso.', 'No se pudo iniciar la sesión.');
    } catch (error) {
        return responderError(res, 'el inicio de sesión', error, 'No se pudo iniciar sesión.');
    }
});

// VERIFICAR SESIÓN
router.get('/api/sesion', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ autenticado: false });
    }
    return res.json({ autenticado: true, usuario: req.session.usuario });
});

// CERRAR SESIÓN
router.post('/api/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ correcto: false, mensaje: 'No se pudo cerrar la sesión.' });
        }

        res.clearCookie('connect.sid');
        return res.json({ correcto: true, mensaje: 'Sesión cerrada correctamente.' });
    });
});

module.exports = router;
