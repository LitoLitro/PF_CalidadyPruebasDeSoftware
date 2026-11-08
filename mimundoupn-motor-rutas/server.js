/**
 * Punto de entrada del backend MiMundoUPN: inicia el servidor.
 */
const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log('----------------------------------');
    console.log('MiMundoUPN iniciado correctamente');
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log(`Login: http://localhost:${PORT}/login.html`);
    console.log('----------------------------------');
});
