const sql = require('require');

const config = {
    user: 'sa',
    password: 'Admin2026',
    server: 'DESKTOP-P8C0ROV',
    port: 1433,
    database: 'BDGeolo',
    options: {
        encrypt: false,
        trustSeverCertificate: true
    }
};

async function conectarDB() {
    try {
        const pool = await sql.connect(config);
        console.log('Conexión a la base de datos establecida');
        return pool;
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    }
}