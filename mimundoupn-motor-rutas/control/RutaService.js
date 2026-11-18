
const grafoRepo = require('../persistence/GrafoRepository');

const METROS_POR_MINUTO = 80; 

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

async function generarRuta({ origenX, origenY, codigoAulaDestino }) {
  if (!esNumeroValido(origenX) || !esNumeroValido(origenY)) {
    return {
      error: 'UBICACION_INVALIDA',
      mensaje: 'No se pudo determinar tu ubicación de partida.',
    };
  }
  const x = Number(origenX);
  const y = Number(origenY);

  if (!grafoRepo.estaDentroDelCampus(x, y)) {
    return {
      error: 'FUERA_DE_RANGO',
      mensaje: 'No te encuentras dentro del rango de búsqueda del sistema.',
    };
  }

  const aula = await grafoRepo.obtenerAulaPorCodigo(codigoAulaDestino);
  
  if (!aula) {
    return {
      error: 'AULA_NO_ENCONTRADA',
      mensaje: `El aula "${String(codigoAulaDestino || '').trim()}" no ha sido encontrada.`,
    };
  }

  const nodos = await grafoRepo.obtenerNodos();
  const aristas = await grafoRepo.obtenerAristas();
  const metrosPorUnidad = grafoRepo.METROS_POR_UNIDAD;

  const { nodo: origen, distancia: distanciaAlNodo } = nodoMasCercano(nodos, x, y);

  const resultado = dijkstra(nodos, aristas, origen.id, aula.nodoId);
  if (!resultado) {
    return { error: 'SIN_RUTA', mensaje: 'No existe un camino disponible hacia esa aula.' };
  }

  const porId = new Map(nodos.map((n) => [n.id, n]));
  const paradas = resultado.ruta.map((id) => {
    const n = porId.get(id);
    return { x: n.x, y: n.y, nombre: n.nombre };
  });

  const tramos = [];
  for (let i = 0; i < resultado.ruta.length - 1; i++) {
    const a = resultado.ruta[i];
    const b = resultado.ruta[i + 1];
    const arista = aristas.find(
      (ar) => (ar.origenId === a && ar.destinoId === b) || (ar.origenId === b && ar.destinoId === a)
    );
    tramos.push({ desde: paradas[i].nombre, hasta: paradas[i + 1].nombre, metros: arista.peso });
  }

  let distanciaTotal = resultado.distanciaTotal;
  if (distanciaAlNodo >= 0.5) {
    const metrosAcceso = Math.round(distanciaAlNodo * metrosPorUnidad);
    paradas.unshift({ x, y, nombre: 'Tu ubicación' });
    tramos.unshift({ desde: 'Tu ubicación', hasta: origen.nombre, metros: metrosAcceso });
    distanciaTotal += metrosAcceso;
  }

  return {
    aula: {
      codigo: aula.codigo,
      nombre: aula.nombre,
      bloque: aula.bloque,
      piso: aula.piso,
      categoria: aula.categoria,
    },
    origen: { nodoId: origen.id, nombre: origen.nombre },
    ruta: paradas,
    tramos,
    distanciaTotal,
    minutos: distanciaTotal === 0 ? 0 : Math.max(1, Math.ceil(distanciaTotal / METROS_POR_MINUTO)),
  };
}

module.exports = { generarRuta, dijkstra, nodoMasCercano };