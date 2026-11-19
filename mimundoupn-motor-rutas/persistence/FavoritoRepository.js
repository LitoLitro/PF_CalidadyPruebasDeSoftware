const { sql, conectarDB } = require('./db');
const Favorito = require('../entity/Favorito');

class FavoritoRepository {

  // Favoritos del usuario cuyo ambiente sigue activo
  async listarPorUsuario(usuarioID) {
    const pool = await conectarDB();
    const r = await pool.request()
      .input('usuarioID', sql.Int, usuarioID)
      .query(`
        SELECT f.favoritoId, f.usuarioID, f.espacioId, f.nombre, f.fechaAgr,
               e.codigo, e.nombre AS ambiente
        FROM dbo.FAVORITO f
        INNER JOIN dbo.ESPACIO e ON e.espacioId = f.espacioId AND e.estado = 1
        WHERE f.usuarioID = @usuarioID
        ORDER BY f.fechaAgr DESC, f.favoritoId DESC`);
    return r.recordset.map((f) =>
      new Favorito(f.favoritoId, f.usuarioID, f.espacioId, f.nombre, f.fechaAgr, f.codigo, f.ambiente));
  }

  async existe(usuarioID, espacioId) {
    const pool = await conectarDB();
    const r = await pool.request()
      .input('usuarioID', sql.Int, usuarioID)
      .input('espacioId', sql.Int, espacioId)
      .query('SELECT 1 AS existe FROM dbo.FAVORITO WHERE usuarioID = @usuarioID AND espacioId = @espacioId');
    return r.recordset.length > 0;
  }

  async crear(usuarioID, espacioId, nombre) {
    const pool = await conectarDB();
    const tx = new sql.Transaction(pool);
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const r = await tx.request().query(
        'SELECT ISNULL(MAX(favoritoId), 0) + 1 AS nuevoId FROM dbo.FAVORITO WITH (UPDLOCK, HOLDLOCK)');
      const id = r.recordset[0].nuevoId;
      const fecha = new Date();
      await tx.request()
        .input('id', sql.Int, id)
        .input('usuarioID', sql.Int, usuarioID)
        .input('espacioId', sql.Int, espacioId)
        .input('fecha', sql.DateTime, fecha)
        .input('nombre', sql.VarChar(100), nombre)
        .query(`INSERT INTO dbo.FAVORITO (favoritoId, usuarioID, espacioId, fechaAgr, nombre)
                VALUES (@id, @usuarioID, @espacioId, @fecha, @nombre)`);
      await tx.commit();
      return new Favorito(id, usuarioID, espacioId, nombre, fecha);
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  // Solo borra si el favorito pertenece al usuario
  async eliminar(favoritoId, usuarioID) {
    const pool = await conectarDB();
    const r = await pool.request()
      .input('id', sql.Int, favoritoId)
      .input('usuarioID', sql.Int, usuarioID)
      .query('DELETE FROM dbo.FAVORITO WHERE favoritoId = @id AND usuarioID = @usuarioID');
    return r.rowsAffected[0] > 0;
  }
}

module.exports = new FavoritoRepository();
