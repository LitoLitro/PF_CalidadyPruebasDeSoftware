
const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    connectionString:
        'Driver={ODBC Driver 18 for SQL Server};Server=LAPTOP-LPAGM3K8,1433;Database=BDGeolo;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;'
};

let poolPromise = null;

async function conectarDB() {
    if (!poolPromise) {
        const pool = new sql.ConnectionPool(dbConfig);

        poolPromise = pool.connect().catch(error => {
            poolPromise = null;
            throw error;
        });
    }

    return poolPromise;
}

module.exports = {
    sql,
    conectarDB
};
