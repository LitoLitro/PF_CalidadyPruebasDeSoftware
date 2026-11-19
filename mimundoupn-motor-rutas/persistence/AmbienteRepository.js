const { sql, conectarDB } = require('./db');
const Ambiente = require('../entity/Ambiente');
const HoraAtencion = require('../entity/HoraAtencion');

// SQL Server devuelve TIME como Date en UTC: se convierte a 'HH:MM'
function horaATexto(valor) {
  if (valor instanceof Date) {
    const h = String(valor.getUTCHours()).padStart(2, '0');
    const m = String(valor.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  return String(valor).slice(0, 5);
}

function mapearAmbiente(r) {
  return new Ambiente({
    id: r.espacioId,
    codigo: r.codigo,
    nombre: r.nombre,
    pabellonId: r.pabellonId,
    pabellon: r.pabellon,
    piso: r.piso,
    tipoEspacioId: r.tipoEspacioId,
    tipo: r.tipo,
    x: Number(r.longitud),
    y: Number(r.latitud),
    capacidad: r.capacidad,
    ubiDesc: r.ubiDesc
  });
}

function mapearHorario(r) {
  return new HoraAtencion(r.horarioId, r.espacioId, r.diaSem, horaATexto(r.hoaApert), horaATexto(r.horaCierre));
}

const SELECT_AMBIENTE = `
  SELECT e.espacioId, e.codigo, e.nombre, e.pabellonId, p.nombre AS pabellon, e.piso,
         e.tipoEspacioId, t.nombre AS tipo, e.longitud, e.latitud, e.capacidad, e.ubiDesc
  FROM dbo.ESPACIO e
  LEFT JOIN dbo.PABELLON p ON p.pabellonId = e.pabellonId
  INNER JOIN dbo.TIPO_ESPACIO t ON t.tipoEspacioId = e.tipoEspacioId
  WHERE e.estado = 1`;

class AmbienteRepository {

  async listar() {
    const pool = await conectarDB();
    const r = await pool.request().query(`${SELECT_AMBIENTE} ORDER BY e.codigo`);
    return r.recordset.map(mapearAmbiente);
  }

  async obtenerPorId(id) {
    const pool = await conectarDB();
    const r = await pool.request()
      .input('id', sql.Int, id)
      .query(`${SELECT_AMBIENTE} AND e.espacioId = @id`);
    return r.recordset[0] ? mapearAmbiente(r.recordset[0]) : null;
  }

  // ¿Hay otro ambiente activo con el mismo codigo?
  async existeCodigo(codigo, excluirId = null) {
    const pool = await conectarDB();
    const r = await pool.request()
      .input('codigo', sql.VarChar(50), codigo)
      .input('excluirId', sql.Int, excluirId)
      .query(`
        SELECT 1 AS existe FROM dbo.ESPACIO
        WHERE estado = 1 AND UPPER(codigo) = UPPER(@codigo)
          AND (@excluirId IS NULL OR espacioId <> @excluirId)`);
    return r.recordset.length > 0;
  }

  // Conexiones activas de un ambiente, vistas desde el: [{ destinoId, peso }]
  async listarConexiones(id) {
    const pool = await conectarDB();
    const r = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT CASE WHEN a.origenId = @id THEN a.destinoId ELSE a.origenId END AS destinoId, a.peso
        FROM dbo.ARISTA a
        INNER JOIN dbo.ESPACIO o ON o.espacioId = a.origenId AND o.estado = 1
        INNER JOIN dbo.ESPACIO d ON d.espacioId = a.destinoId AND d.estado = 1
        WHERE a.estado = 1 AND (a.origenId = @id OR a.destinoId = @id)`);
    return r.recordset.map((c) => ({ destinoId: c.destinoId, peso: Number(c.peso) }));
  }

  // Horarios activos; si se indica espacioId, solo los de ese ambiente
  async listarHorarios(espacioId = null) {
    const pool = await conectarDB();
    const r = await pool.request()
      .input('espacioId', sql.Int, espacioId)
      .query(`
        SELECT h.horarioId, h.espacioId, h.diaSem, h.hoaApert, h.horaCierre
        FROM dbo.HORA_ATENCION h
        WHERE h.estado = 1 AND (@espacioId IS NULL OR h.espacioId = @espacioId)
        ORDER BY h.espacioId, h.diaSem, h.hoaApert`);
    return r.recordset.map(mapearHorario);
  }

  async listarCatalogos() {
    const pool = await conectarDB();
    const pab = await pool.request().query('SELECT pabellonId AS id, nombre FROM dbo.PABELLON ORDER BY nombre');
    const tipos = await pool.request().query('SELECT tipoEspacioId AS id, nombre FROM dbo.TIPO_ESPACIO ORDER BY tipoEspacioId');
    return { pabellones: pab.recordset, tipos: tipos.recordset };
  }

  // Ejecuta fn dentro de una transaccion
  async enTransaccion(fn) {
    const pool = await conectarDB();
    const tx = new sql.Transaction(pool);
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const resultado = await fn(tx);
      await tx.commit();
      return resultado;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async siguienteId(tx, tabla, columna) {
    const r = await tx.request().query(
      `SELECT ISNULL(MAX(${columna}), 0) + 1 AS nuevoId FROM dbo.${tabla} WITH (UPDLOCK, HOLDLOCK)`
    );
    return r.recordset[0].nuevoId;
  }

  entradasAmbiente(request, a) {
    return request
      .input('codigo', sql.VarChar(50), a.codigo)
      .input('nombre', sql.VarChar(50), a.nombre)
      .input('pabellonId', sql.Int, a.pabellonId)
      .input('piso', sql.Int, a.piso)
      .input('tipoEspacioId', sql.Int, a.tipoEspacioId)
      .input('ubiDesc', sql.VarChar(250), a.ubiDesc)
      .input('latitud', sql.Decimal(18, 6), a.y)
      .input('longitud', sql.Decimal(18, 6), a.x)
      .input('capacidad', sql.Int, a.capacidad);
  }

  // Reemplaza todas las aristas del ambiente por las indicadas
  async guardarConexiones(tx, espacioId, conexiones) {
    await tx.request().input('id', sql.Int, espacioId)
      .query('DELETE FROM dbo.ARISTA WHERE origenId = @id OR destinoId = @id');
    for (const c of conexiones) {
      const aristaId = await this.siguienteId(tx, 'ARISTA', 'aristaId');
      await tx.request()
        .input('aristaId', sql.Int, aristaId)
        .input('origenId', sql.Int, espacioId)
        .input('destinoId', sql.Int, c.destinoId)
        .input('peso', sql.Int, c.peso)
        .query(`INSERT INTO dbo.ARISTA (aristaId, origenId, destinoId, peso, estado)
                VALUES (@aristaId, @origenId, @destinoId, @peso, 1)`);
    }
  }

  // Reemplaza todos los horarios del ambiente por los indicados
  async guardarHorarios(tx, espacioId, horarios) {
    await tx.request().input('id', sql.Int, espacioId)
      .query('DELETE FROM dbo.HORA_ATENCION WHERE espacioId = @id');
    for (const h of horarios) {
      const horarioId = await this.siguienteId(tx, 'HORA_ATENCION', 'horarioId');
      await tx.request()
        .input('horarioId', sql.Int, horarioId)
        .input('espacioId', sql.Int, espacioId)
        .input('diaSem', sql.Int, h.diaSem)
        .input('apertura', sql.VarChar(5), h.apertura)
        .input('cierre', sql.VarChar(5), h.cierre)
        .query(`INSERT INTO dbo.HORA_ATENCION (horarioId, espacioId, diaSem, hoaApert, horaCierre, estado)
                VALUES (@horarioId, @espacioId, @diaSem, CAST(@apertura AS time), CAST(@cierre AS time), 1)`);
    }
  }

  // Crea el ESPACIO y sus aristas/horarios en una sola transaccion
  async crear(ambiente, conexiones, horarios) {
    return this.enTransaccion(async (tx) => {
      const id = await this.siguienteId(tx, 'ESPACIO', 'espacioId');
      await this.entradasAmbiente(tx.request(), ambiente)
        .input('id', sql.Int, id)
        .query(`INSERT INTO dbo.ESPACIO
                  (espacioId, nombre, codigo, pabellonId, piso, tipoEspacioId, ubiDesc, latitud, longitud, estado, capacidad)
                VALUES
                  (@id, @nombre, @codigo, @pabellonId, @piso, @tipoEspacioId, @ubiDesc, @latitud, @longitud, 1, @capacidad)`);
      await this.guardarConexiones(tx, id, conexiones);
      await this.guardarHorarios(tx, id, horarios);
      return id;
    });
  }

  // conexiones u horarios en null = no se modifican
  async actualizar(id, ambiente, conexiones, horarios) {
    return this.enTransaccion(async (tx) => {
      const r = await this.entradasAmbiente(tx.request(), ambiente)
        .input('id', sql.Int, id)
        .query(`UPDATE dbo.ESPACIO
                SET nombre = @nombre, codigo = @codigo, pabellonId = @pabellonId, piso = @piso,
                    tipoEspacioId = @tipoEspacioId, ubiDesc = @ubiDesc, latitud = @latitud,
                    longitud = @longitud, capacidad = @capacidad
                WHERE espacioId = @id AND estado = 1`);
      if (r.rowsAffected[0] === 0) return false;
      if (conexiones) await this.guardarConexiones(tx, id, conexiones);
      if (horarios) await this.guardarHorarios(tx, id, horarios);
      return true;
    });
  }

  async reemplazarHorarios(id, horarios) {
    return this.enTransaccion((tx) => this.guardarHorarios(tx, id, horarios));
  }

  // Baja logica: el ambiente, sus aristas y horarios quedan inactivos
  // (FAVORITO y RUTA conservan sus claves foraneas)
  async eliminar(id) {
    return this.enTransaccion(async (tx) => {
      const r = await tx.request().input('id', sql.Int, id)
        .query('UPDATE dbo.ESPACIO SET estado = 0 WHERE espacioId = @id AND estado = 1');
      if (r.rowsAffected[0] === 0) return false;
      await tx.request().input('id', sql.Int, id)
        .query('UPDATE dbo.ARISTA SET estado = 0 WHERE origenId = @id OR destinoId = @id');
      await tx.request().input('id', sql.Int, id)
        .query('UPDATE dbo.HORA_ATENCION SET estado = 0 WHERE espacioId = @id');
      return true;
    });
  }
}

module.exports = new AmbienteRepository();
module.exports.horaATexto = horaATexto;
