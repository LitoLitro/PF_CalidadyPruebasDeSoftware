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
    // 2. Obtener Aristas (Conexiones lógicas de pasillos)
  async obtenerAristas() {
    const nodos = await this.obtenerNodos();
    const aristas = [];

    // Buscamos los IDs del Patio y la Entrada para armar el grafo estrella
    const idPatio = nodos.find(n => n.nombre.includes('Patio'))?.id;
    const idEntrada = nodos.find(n => n.nombre.includes('Entrada'))?.id;

    // Función auxiliar para calcular distancia euclidiana (plano)
    const calcularDistancia = (idA, idB) => {
      const a = nodos.find(n => n.id === idA);
      const b = nodos.find(n => n.id === idB);
      // Distancia en unidades del plano
      const distUnidades = Math.hypot(b.x - a.x, b.y - a.y);
      // Multiplicamos por 2 metros (según tu diseño original) y redondeamos
      return Math.round(distUnidades * 2); 
    };

    // 1. Conectar la Entrada con el Patio
    if (idEntrada && idPatio) {
      aristas.push(new Arista(idEntrada, idPatio, calcularDistancia(idEntrada, idPatio)));
    }

    // 2. Conectar el Patio con todos los demás ambientes (Aulas, Labs, Servicios)
    nodos.forEach(nodo => {
      if (nodo.id !== idPatio && nodo.id !== idEntrada) {
        aristas.push(new Arista(idPatio, nodo.id, calcularDistancia(idPatio, nodo.id)));
      }
    });

    return aristas;
  }

  async obtenerAulas() {
    try {
      const pool = await sql.connect(dbConfig);
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