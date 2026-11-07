
const express = require('express');
const router = express.Router();

const AuthService = require('../control/AuthService');

// REGISTRO DE USUARIO
router.post('/api/registro', async (req, res) => {
    try {
        const usuario = await AuthService.registrar(req.body);

        // Crear una sesión nueva después del registro
        req.session.regenerate((error) => {
            if (error) {
                console.error('Error al crear sesión:', error);
                return res.status(500).json({
                    correcto: false,
                    mensaje: 'La cuenta se creó, pero no se pudo iniciar la sesión.'
                });
            }

            req.session.usuario = usuario;

            return res.json({
                correcto: true,
                mensaje: 'Cuenta creada correctamente.',
                usuario
            });
        });

    } catch (error) {
        console.error('Error en el registro:', error);

        const esDuplicado = error.message.includes('ya está registrado');

        return res.status(esDuplicado ? 409 : 400).json({
            correcto: false,
            mensaje: error.message || 'No se pudo registrar la cuenta.'
        });
    }
});

// INICIO DE SESIÓN
router.post('/api/login', async (req, res) => {
    try {
        const { correo, contrasena, tipoUsuario } = req.body;

        if (!correo || !contrasena || !tipoUsuario) {
            return res.status(400).json({
                correcto: false,
                mensaje: 'Completa todos los campos.'
            });
        }

        if (!['1', 'administrativo'].includes(String(tipoUsuario))) {
            return res.status(400).json({
                correcto: false,
                mensaje: 'Selecciona un tipo de usuario válido.'
            });
        }

        const usuario = await AuthService.iniciarSesion(
            correo,
            contrasena
        );

        const esEstudiante = usuario.rolId === 1;
        const esAdministrativo = [2, 3].includes(usuario.rolId);

        if (
            (tipoUsuario === '1' && !esEstudiante) ||
            (tipoUsuario === 'administrativo' && !esAdministrativo)
        ) {
            return res.status(403).json({
                correcto: false,
                mensaje: 'El tipo de usuario seleccionado no corresponde a esta cuenta.'
            });
        }

        req.session.usuario = usuario;

        return res.json({
            correcto: true,
            mensaje: 'Inicio de sesión exitoso.',
            usuario
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);

        return res.status(401).json({
            correcto: false,
            mensaje: error.message || 'No se pudo iniciar sesión.'
        });
    }
});

// VERIFICAR SESIÓN
router.get('/api/sesion', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            autenticado: false
        });
    }

    return res.json({
        autenticado: true,
        usuario: req.session.usuario
    });
});

// CERRAR SESIÓN
router.post('/api/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                correcto: false,
                mensaje: 'No se pudo cerrar la sesión.'
            });
        }

        res.clearCookie('connect.sid');

        return res.json({
            correcto: true,
            mensaje: 'Sesión cerrada correctamente.'
        });
    });
});

module.exports = router;
