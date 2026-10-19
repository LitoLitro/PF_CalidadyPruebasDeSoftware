/**
 * CONTROL
 * Coordina la obtención de datos del mapa y la lista de aulas.
 */
const grafoRepo = require('../persistence/GrafoRepository');

// 👇 Ahora es async porque el repositorio consulta SQL Server
async function listarAulas() {
  return await grafoRepo.obtenerAulas();
}

// 👇 Ahora es async porque debe obtener nodos y aristas de la BD
async function obtenerMapa() {
  const nodos = await grafoRepo.obtenerNodos();
  const aristas = await grafoRepo.obtenerAristas();
  const limites = grafoRepo.obtenerLimites(); // Este es síncrono, no necesita await

  return {
    nodos,
    aristas,
    limites
  };
}

module.exports = { listarAulas, obtenerMapa };