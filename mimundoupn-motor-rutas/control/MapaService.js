/**
 * CONTROL
 * Coordina la obtención de datos del mapa y la lista de aulas.
 */
const grafoRepo = require('../persistence/GrafoRepository');

async function listarAulas() {
  return grafoRepo.obtenerAulas();
}

async function obtenerMapa() {
  const nodos = await grafoRepo.obtenerNodos();
  const aristas = await grafoRepo.obtenerAristas(nodos); // reutiliza los nodos: una sola consulta
  return { nodos, aristas, limites: grafoRepo.obtenerLimites() };
}

module.exports = { listarAulas, obtenerMapa };
