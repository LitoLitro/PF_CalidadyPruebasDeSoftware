
class Nodo {
  constructor(id, nombre, x, y, tipo = 'pasillo') {
    this.id = id;
    this.nombre = nombre;
    this.x = x; 
    this.y = y;
    this.tipo = tipo; 
  }
}

module.exports = Nodo;
