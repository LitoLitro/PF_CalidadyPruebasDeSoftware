const { sql, conectarDB } = require('./db');

class UsuarioRepository {

    // Buscar usuario por correo
    async buscarPorCorreo(correo) {
        const pool = await conectarDB();

        const resultado = await pool.request()
            .input('correo', sql.VarChar(100), correo.trim())
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
                throw new Error('Este correo ya tiene una cuenta registrada.');
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
        const pool = await conectarDB();

        const resultado = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('correoPersonal', sql.NVarChar(254), correoPersonal.trim())
            .query(`
                UPDATE dbo.USUARIO
                SET correoPersonal = @correoPersonal
                WHERE usuarioID = @usuarioID
                  AND correoPersonalVerificado = 0
            `);

        return resultado.rowsAffected[0] > 0;
    }

    // Verificar correo personal
    async verificarCorreoPersonal(usuarioID) {
        const pool = await conectarDB();

        const resultado = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(`
                UPDATE dbo.USUARIO
                SET correoPersonalVerificado = 1
                WHERE usuarioID = @usuarioID
                  AND correoPersonal IS NOT NULL
                  AND correoPersonalVerificado = 0
            `);

        return resultado.rowsAffected[0] > 0;
    }

    // Actualizar contraseña protegida con bcrypt
    async actualizarContrasena(usuarioID, nuevaContrasena) {
        const pool = await conectarDB();

        const resultado = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .input('contrasena', sql.VarChar(250), nuevaContrasena)
            .query(`
                UPDATE dbo.USUARIO
                SET [contraseña] = @contrasena
                WHERE usuarioID = @usuarioID
            `);

        return resultado.rowsAffected[0] > 0;
    }
}

module.exports = new UsuarioRepository();