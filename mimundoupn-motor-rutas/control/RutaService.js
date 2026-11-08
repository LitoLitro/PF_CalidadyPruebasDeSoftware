/**
 * CONTROL
 * Aqui vive la logica de negocio de HU01: el algoritmo de Dijkstra y las
 * validaciones de sus criterios de aceptacion (aula no encontrada, fuera de
 * rango). Esta capa no sabe nada de HTTP (eso es trabajo de Boundary) ni de
 * SQL (eso es trabajo de Persistencia): solo coordina el caso de uso.
 */
const grafoRepo = require('../persistence/GrafoRepository');

const METROS_POR_MINUTO = 80; // velocidad de caminata usada para estimar el tiempo

function dijkstra(nodos, aristas, origenId, destinoId) {
  const distancias = {};
  const previos = {};
  const visitados = new Set();

  nodos.forEach((n) => {
    distancias[n.id] = Infinity;
  });
  distancias[origenId] = 0;

  while (visitados.size < nodos.length) {
    let actual = null;
    let menor = Infinity;
    for (const n of nodos) {
      if (!visitados.has(n.id) && distancias[n.id] < menor) {
        menor = distancias[n.id];
        actual = n.id;
      }
    }
    if (actual === null) break; 
    visitados.add(actual);

    const vecinos = aristas.filter(
      (a) => a.origenId === actual || a.destinoId === actual
    );
    for (const arista of vecinos) {
      const vecinoId = arista.origenId === actual ? arista.destinoId : arista.origenId;
      const nuevaDistancia = distancias[actual] + arista.peso;
      if (nuevaDistancia < distancias[vecinoId]) {
        distancias[vecinoId] = nuevaDistancia;
        previos[vecinoId] = actual;
      }
    }
  }

  if (!Number.isFinite(distancias[destinoId])) return null;

  const ruta = [];
  let paso = destinoId;
  while (paso !== undefined) {
    ruta.unshift(paso);
    paso = previos[paso];
  }

  return { ruta, distanciaTotal: distancias[destinoId] };
}

// El usuario puede estar en cualquier punto del plano: se parte desde el nodo
// del grafo que le queda mas cerca.
function nodoMasCercano(nodos, x, y) {
  let mejor = null;
  let menor = Infinity;
  for (const n of nodos) {
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < menor) {
      menor = d;
      mejor = n;
    }
  }
  return { nodo: mejor, distancia: menor };
}

function esNumeroValido(valor) {
  return valor !== null && valor !== undefined && valor !== '' && Number.isFinite(Number(valor));
}

// Valida el punto de partida. Devuelve { error } o { x, y }.
function validarOrigen(origenX, origenY) {
  if (!esNumeroValido(origenX) || !esNumeroValido(origenY)) {
    return { error: 'UBICACION_INVALIDA', mensaje: 'No se pudo determinar tu ubicación de partida.' };
  }
  const x = Number(origenX);
  const y = Number(origenY);
  // Criterio de aceptación CA3: "fuera de rango"
  if (!grafoRepo.estaDentroDelCampus(x, y)) {
    return { error: 'FUERA_DE_RANGO', mensaje: 'No te encuentras dentro del rango de búsqueda del sistema.' };
  }
  return { x, y };
}

const buscarArista = (aristas, a, b) =>
  aristas.find((ar) => (ar.origenId === a && ar.destinoId === b) || (ar.origenId === b && ar.destinoId === a));

// Convierte la lista de ids de Dijkstra en paradas (con coordenadas) y tramos (con metros).
function construirRecorrido(ruta, nodos, aristas) {
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const paradas = ruta.map((id) => {
    const n = porId.get(id);
    return { x: n.x, y: n.y, nombre: n.nombre };
  });
  const tramos = paradas.slice(0, -1).map((parada, i) => ({
    desde: parada.nombre,
    hasta: paradas[i + 1].nombre,
    metros: buscarArista(aristas, ruta[i], ruta[i + 1]).peso,
  }));
  return { paradas, tramos };
}

// Si el usuario no está justo sobre un nodo, la ruta empieza en su posición.
function agregarTramoDeAcceso(recorrido, { x, y }, origen, distanciaAlNodo, metrosPorUnidad) {
  if (distanciaAlNodo < 0.5) return 0;
  const metros = Math.round(distanciaAlNodo * metrosPorUnidad);
  recorrido.paradas.unshift({ x, y, nombre: 'Tu ubicación' });
  recorrido.tramos.unshift({ desde: 'Tu ubicación', hasta: origen.nombre, metros });
  return metros;
}

const calcularMinutos = (metros) => (metros === 0 ? 0 : Math.max(1, Math.ceil(metros / METROS_POR_MINUTO)));

async function generarRuta({ origenX, origenY, codigoAulaDestino }) {
  const ubicacion = validarOrigen(origenX, origenY);
  if (ubicacion.error) return ubicacion;

  // Criterio de aceptación CA2: "aula no encontrada"
  const aula = await grafoRepo.obtenerAulaPorCodigo(codigoAulaDestino);
  if (!aula) {
    return {
      error: 'AULA_NO_ENCONTRADA',
      mensaje: `El aula "${String(codigoAulaDestino || '').trim()}" no ha sido encontrada.`,
    };
  }

  const nodos = await grafoRepo.obtenerNodos();
  const aristas = await grafoRepo.obtenerAristas(nodos);
  const { nodo: origen, distancia: distanciaAlNodo } = nodoMasCercano(nodos, ubicacion.x, ubicacion.y);

  // Criterio de aceptación CA1: ruta más corta
  const resultado = dijkstra(nodos, aristas, origen.id, aula.nodoId);
  if (!resultado) {
    return { error: 'SIN_RUTA', mensaje: 'No existe un camino disponible hacia esa aula.' };
  }

  const recorrido = construirRecorrido(resultado.ruta, nodos, aristas);
  const metrosAcceso = agregarTramoDeAcceso(recorrido, ubicacion, origen, distanciaAlNodo, grafoRepo.METROS_POR_UNIDAD);
  const distanciaTotal = resultado.distanciaTotal + metrosAcceso;

  return {
    aula: { codigo: aula.codigo, nombre: aula.nombre, bloque: aula.bloque, piso: aula.piso, categoria: aula.categoria },
    origen: { nodoId: origen.id, nombre: origen.nombre },
    ruta: recorrido.paradas,
    tramos: recorrido.tramos,
    distanciaTotal,
    minutos: calcularMinutos(distanciaTotal),
  };
}

module.exports = { generarRuta, dijkstra, nodoMasCercano, validarOrigen };
