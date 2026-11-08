const { sql, conectarDB } = require('./db');
const { ErrorConflicto } = require('../control/errores');

const normalizarCorreo = (correo) => String(correo || '').trim();

// Ejecuta un UPDATE con sus parámetros y devuelve true si modificó alguna fila.
// Evita repetir la conexión, los parámetros y la lectura de rowsAffected en cada método.
async function ejecutarActualizacion(consulta, parametros) {
    const pool = await conectarDB();
    const request = pool.request();
    parametros.forEach(([nombre, tipo, valor]) => request.input(nombre, tipo, valor));
    const resultado = await request.query(consulta);
    return resultado.rowsAffected[0] > 0;
}

class UsuarioRepository {

    // Buscar usuario por correo
    async buscarPorCorreo(correo) {
        const pool = await conectarDB();

        const resultado = await pool.request()
            .input('correo', sql.VarChar(100), normalizarCorreo(correo))
            .query(`
                SELECT
                    usuarioID,
                    nombres,
                    apellidos,
                    correo,
                    contraseña,
                    rolId,
                    estado,
                    correoPersonal,
                    correoPersonalVerificado
                FROM dbo.USUARIO
                WHERE correo = @correo
            `);

        return resultado.recordset[0] || null;
    }

    // Registrar un nuevo estudiante
    async registrarUsuario(datos) {
        const pool = await conectarDB();

        const transaccion = new sql.Transaction(pool);
        let iniciada = false;

        try {
            await transaccion.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
            iniciada = true;

            // Comprobar que el correo no esté registrado
            const existente = await transaccion.request()
                .input('correo', sql.VarChar(100), datos.correo.trim())
                .query(`
                    SELECT usuarioID
                    FROM dbo.USUARIO WITH (UPDLOCK, HOLDLOCK)
                    WHERE correo = @correo
                `);

            if (existente.recordset.length > 0) {
                throw new ErrorConflicto('Este correo ya está registrado. Inicia sesión con tu cuenta.');
            }

            // Generar el siguiente identificador
            const resultadoID = await transaccion.request()
                .query(`
                    SELECT ISNULL(MAX(usuarioID), 0) + 1 AS nuevoID
                    FROM dbo.USUARIO WITH (UPDLOCK, HOLDLOCK)
                `);

            const nuevoID = resultadoID.recordset[0].nuevoID;

            // Insertar el nuevo estudiante
            await transaccion.request()
                .input('usuarioID', sql.Int, nuevoID)
                .input('nombres', sql.VarChar(100), datos.nombres.trim())
                .input('apellidos', sql.VarChar(100), datos.apellidos.trim())
                .input('correo', sql.VarChar(100), datos.correo.trim())
                .input('contrasena', sql.VarChar(250), datos.contrasena)
                .input('rolId', sql.Int, 1)
                .input('registro', sql.DateTime, new Date())
                .input('estado', sql.Bit, true)
                .query(`
                    INSERT INTO dbo.USUARIO (
                        usuarioID,
                        nombres,
                        apellidos,
                        correo,
                        [contraseña],
                        rolId,
                        registro,
                        estado
                    )
                    VALUES (
                        @usuarioID,
                        @nombres,
                        @apellidos,
                        @correo,
                        @contrasena,
                        @rolId,
                        @registro,
                        @estado
                    )
                `);

            await transaccion.commit();
            iniciada = false;

            return {
                usuarioID: nuevoID,
                nombres: datos.nombres.trim(),
                apellidos: datos.apellidos.trim(),
                correo: datos.correo.trim(),
                rolId: 1,
                rol: 'Estudiante'
            };

        } catch (error) {

            if (iniciada) {
                await transaccion.rollback();
            }

            throw error;
        }
    }

    // Guardar correo personal pendiente de verificación
    async guardarCorreoPersonalPendiente(usuarioID, correoPersonal) {
        return ejecutarActualizacion(`
                UPDATE dbo.USUARIO
                SET correoPersonal = @correoPersonal
                WHERE usuarioID = @usuarioID
                  AND correoPersonalVerificado = 0
            `, [['usuarioID', sql.Int, usuarioID], ['correoPersonal', sql.NVarChar(254), correoPersonal.trim()]]);
    }

    // Verificar correo personal
    async verificarCorreoPersonal(usuarioID) {
        return ejecutarActualizacion(`
                UPDATE dbo.USUARIO
                SET correoPersonalVerificado = 1
                WHERE usuarioID = @usuarioID
                  AND correoPersonal IS NOT NULL
                  AND correoPersonalVerificado = 0
            `, [['usuarioID', sql.Int, usuarioID]]);
    }

    // Actualizar contraseña protegida con bcrypt
    async actualizarContrasena(usuarioID, nuevaContrasena) {
        return ejecutarActualizacion(`
                UPDATE dbo.USUARIO
                SET [contraseña] = @contrasena
                WHERE usuarioID = @usuarioID
            `, [['usuarioID', sql.Int, usuarioID], ['contrasena', sql.VarChar(250), nuevaContrasena]]);
    }
}

module.exports = new UsuarioRepository();