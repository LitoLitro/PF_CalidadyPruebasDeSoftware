const sql = require('mssql');
const Nodo = require('../entity/Nodo');
const Arista = require('../entity/Arista');
const Aula = require('../entity/Aula');

// CONFIGURACIÓN DE TU BASE DE DATOS LOCAL
const dbConfig = {
  user: 'sa', // Cambia esto si usas otro usuario
  password: 'Admin2026', // <--- CAMBIA ESTO por tu contraseña real
  server: 'DESKTOP-P8C0ROV', // O el nombre de tu instancia
  port: 1433, // Puerto por defecto de SQL Server
  database: 'BDGeolo',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// Límites del plano (los mantenemos fijos para validar el "fuera de rango")
const LIMITES_CAMPUS = { xMin: 0, xMax: 100, yMin: 0, yMax: 70 };

class GrafoRepository {
  constructor() {
    this.METROS_POR_UNIDAD = 2; // Ya no se usará para calcular distancias reales
  }

  // 1. Obtener Nodos (Aulas, pasillos, servicios) desde SQL Server
  async obtenerNodos() {
    try {
      const pool = await sql.connect(dbConfig);
      // Mapeamos latitud/longitud a x/y para que tu Dijkstra siga funcionando
      const result = await pool.request().query(`
        SELECT 
          espacioId AS id, 
          nombre, 
          longitud AS x, 
          latitud AS y, 
          tipoEspacioId AS tipo 
        FROM ESPACIO 
        WHERE estado = 1
      `);
      
      return result.recordset.map(r => new Nodo(r.id, r.nombre, r.x, r.y, r.tipo.toString()));
    } catch (error) {
      console.error("Error al obtener nodos:", error);
      return [];
    }
  }

  // 2. Obtener Aristas (Conexiones)
  async obtenerAristas() {
    // Como tu BD no tiene una tabla de "pasillos" o "conexiones", 
    // crearemos un grafo completo (todos conectados con todos) 
    // y calcularemos la distancia en metros.
    const nodos = await this.obtenerNodos();
    const aristas = [];

    for (let i = 0; i < nodos.length; i++) {
      for (let j = i + 1; j < nodos.length; j++) {
        const a = nodos[i];
        const b = nodos[j];
        
        // Fórmula de Haversine (distancia real en metros entre coordenadas)
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (b.y - a.y) * Math.PI / 180;
        const dLon = (b.x - a.x) * Math.PI / 180;
        const lat1 = a.y * Math.PI / 180;
        const lat2 = b.y * Math.PI / 180;

        const hav = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1) * Math.cos(lat2) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
        const metros = Math.round(R * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1-hav)));

        aristas.push(new Arista(a.id, b.id, metros));
      }
    }
    return aristas;
  }

  // 3. Obtener Aulas
  async obtenerAulas() {
    try {
      const pool = await sql.connect(dbConfig);
      // Hacemos JOIN con PABELLON y TIPO_ESPACIO
      const result = await pool.request().query(`
        SELECT 
          e.codigo, 
          e.nombre, 
          e.espacioId AS nodoId, 
          p.nombre AS bloque, 
          e.piso, 
          t.nombre AS categoria
        FROM ESPACIO e
        INNER JOIN PABELLON p ON e.pabellonId = p.pabellonId
        INNER JOIN TIPO_ESPACIO t ON e.tipoEspacioId = t.tipoEspacioId
        WHERE e.estado = 1
      `);

      return result.recordset.map(r => 
        new Aula(r.codigo, r.nombre, r.nodoId, r.bloque, r.piso, r.categoria)
      );
    } catch (error) {
      console.error("Error al obtener aulas:", error);
      return [];
    }
  }

  // 4. Buscar un aula específica por su código (A101, etc.)
  async obtenerAulaPorCodigo(codigo) {
    try {
      const buscado = String(codigo || '').trim().toUpperCase();
      const pool = await sql.connect(dbConfig);
      
      const result = await pool.request()
        .input('codigo', sql.VarChar, buscado)
        .query(`
          SELECT 
            e.codigo, 
            e.nombre, 
            e.espacioId AS nodoId, 
            p.nombre AS bloque, 
            e.piso, 
            t.nombre AS categoria
          FROM ESPACIO e
          INNER JOIN PABELLON p ON e.pabellonId = p.pabellonId
          INNER JOIN TIPO_ESPACIO t ON e.tipoEspacioId = t.tipoEspacioId
          WHERE e.estado = 1 AND UPPER(e.codigo) = @codigo
        `);

      if (result.recordset.length > 0) {
        const r = result.recordset[0];
        return new Aula(r.codigo, r.nombre, r.nodoId, r.bloque, r.piso, r.categoria);
      }
      return null;
    } catch (error) {
      console.error("Error al buscar aula por código:", error);
      return null;
    }
  }

  // 5. Límites del campus (se mantienen fijos para validar el "fuera de rango")
  obtenerLimites() {
    return LIMITES_CAMPUS;
  }

  estaDentroDelCampus(x, y) {
    return (
      x >= LIMITES_CAMPUS.xMin &&
      x <= LIMITES_CAMPUS.xMax &&
      y >= LIMITES_CAMPUS.yMin &&
      y <= LIMITES_CAMPUS.yMax
    );
  }
}

module.exports = new GrafoRepository();