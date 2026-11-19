const grafoRepo = require('../persistence/GrafoRepository');
const ambienteRepo = require('../persistence/AmbienteRepository');
const { agruparPorEspacio, estaAbierto } = require('./HorarioService');

// Aulas y espacios con sus horarios de atencion
async function listarAulas(fecha = new Date()) {
  const aulas = await grafoRepo.obtenerAulas();

  let horarios = [];
  try {
    horarios = await ambienteRepo.listarHorarios();
  } catch (error) {
    // Sin horarios el mapa sigue funcionando
    console.error('Error al obtener horarios:', error);
  }

  const porEspacio = agruparPorEspacio(horarios);
  return aulas.map((aula) => {
    const propios = porEspacio.get(aula.nodoId) || [];
    return { ...aula, horarios: propios, abiertoAhora: estaAbierto(propios, fecha) };
  });
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
