
/**
 * Punto de entrada del backend MiMundoUPN.
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const rutaRoutes = require('./boundary/rutaRoutes');
const authRoutes = require('./boundary/authRoutes');

const app = express();

// Verificar routers
if (typeof rutaRoutes !== 'function') {
    throw new Error('rutaRoutes.js no está exportando correctamente el router.');
}

if (typeof authRoutes !== 'function') {
    throw new Error('authRoutes.js no está exportando correctamente el router.');
}

// Configuración general
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'mimundoupn-clave-desarrollo',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000
    }
}));

// Rutas de autenticación
app.use(authRoutes);

// Rutas del mapa
app.use(rutaRoutes);

// Respuesta JSON para rutas API inexistentes
app.use('/api', (req, res) => {
    return res.status(404).json({
        correcto: false,
        mensaje: `La ruta ${req.method} ${req.originalUrl} no existe.`
    });
});

// Archivos públicos
app.use(express.static(path.join(__dirname, 'public')));

// Manejo de errores generales
app.use((error, req, res, next) => {
    console.error('Error del servidor:', error);

    if (res.headersSent) {
        return next(error);
    }

    return res.status(500).json({
        correcto: false,
        mensaje: 'Ocurrió un error interno en el servidor.'
    });
});

// Inicio del servidor
const PORT = 3000;

app.listen(PORT, () => {
    console.log('----------------------------------');
    console.log('MiMundoUPN iniciado correctamente');
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log(`Login: http://localhost:${PORT}/login.html`);
    console.log('----------------------------------');
});
