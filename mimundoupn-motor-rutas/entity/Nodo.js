/**
 * ENTITY
 * Representa un punto del grafo del campus (una esquina, una puerta, un aula).
 * Es un objeto de dominio puro: no sabe nada de HTTP ni de SQL Server.
 * Por eso se puede probar con pruebas unitarias sin levantar el servidor ni la BD.
 */
class Nodo {
  constructor(id, nombre, x, y, tipo = 'pasillo') {
    this.id = id;
    this.nombre = nombre;
    this.x = x; // coordenada en el mapa, usada para dibujar la ruta
    this.y = y;
    this.tipo = tipo; // 'ingreso' | 'patio' | 'pasillo' | 'aula' | 'servicio'
  }
}

module.exports = Nodo;
