/**
 * ENTITY
 * Representa un tramo transitable entre dos nodos, con su distancia (peso).
 * Dijkstra usa estas aristas para decidir cual es el camino mas corto.
 */
class Arista {
  constructor(origenId, destinoId, peso) {
    this.origenId = origenId;
    this.destinoId = destinoId;
    this.peso = peso; // distancia o costo del tramo
  }
}

module.exports = Arista;
