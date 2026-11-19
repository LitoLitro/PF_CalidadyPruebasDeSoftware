// Ruta favorita de un usuario: el destino se guarda y la ruta se recalcula al abrirla
class Favorito {
  constructor(id, usuarioID, espacioId, nombre, fechaAgr, codigo = null, ambiente = null) {
    this.id = id;
    this.usuarioID = usuarioID;
    this.espacioId = espacioId;
    this.nombre = nombre;
    this.fechaAgr = fechaAgr;
    this.codigo = codigo;
    this.ambiente = ambiente;
  }
}

module.exports = Favorito;
