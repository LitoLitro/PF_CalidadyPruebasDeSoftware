/**
 * CONTROL
 * Prepara los datos del plano y del listado de ambientes para que la capa
 * Boundary los entregue al frontend. No dibuja nada: solo decide que datos
 * se exponen.
 */
const grafoRepo = require('../persistence/GrafoRepository');

function listarAulas() {
  const nodos = grafoRepo.obtenerNodos();
  return grafoRepo.obtenerAulas().map((a) => {
    const nodo = nodos.find((n) => n.id === a.nodoId);
    return {
      codigo: a.codigo,
      nombre: a.nombre,
      bloque: a.bloque,
      piso: a.piso,
      categoria: a.categoria,
      nodoId: a.nodoId,
      x: nodo.x,
      y: nodo.y,
    };
  });
}

function obtenerMapa() {
  return {
    nodos: grafoRepo.obtenerNodos(),
    aristas: grafoRepo.obtenerAristas(),
    limites: grafoRepo.obtenerLimites(),
    metrosPorUnidad: grafoRepo.METROS_POR_UNIDAD,
  };
}

module.exports = { listarAulas, obtenerMapa };
