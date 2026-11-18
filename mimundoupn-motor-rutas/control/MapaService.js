
const grafoRepo = require('../persistence/GrafoRepository');

async function listarAulas() {
  return await grafoRepo.obtenerAulas();
}
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