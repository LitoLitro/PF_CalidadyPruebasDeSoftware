/**
 * Punto de entrada del backend MiMundoUPN.
 */

const app = require('./app');

// Inicio del servidor
const PORT = 3000;

app.listen(PORT, () => {
    console.log('----------------------------------');
    console.log('MiMundoUPN iniciado correctamente');
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log(`Login: http://localhost:${PORT}/login.html`);
    console.log('----------------------------------');
});
