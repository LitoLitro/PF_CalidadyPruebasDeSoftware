class Arista {
  constructor(origenId, destinoId, peso, id = null) {
    this.id = id;
    this.origenId = origenId;
    this.destinoId = destinoId;
    this.peso = peso; // metros
  }
}

module.exports = Arista;
