/**
 * ENTITY
 * Un aula (o ambiente) es un punto de interes con codigo y nombre visibles para
 * el usuario, ubicado sobre un Nodo del grafo.
 */
class Aula {
  constructor(codigo, nombre, nodoId, bloque, piso = null, categoria = 'Aula') {
    this.codigo = codigo;       // ej. "301-A"
    this.nombre = nombre;       // ej. "Laboratorio de Redes"
    this.nodoId = nodoId;       // Nodo del grafo donde esta ubicada
    this.bloque = bloque;       // ej. "Bloque A"
    this.piso = piso;           // informativo: el mapa es un plano 2D
    this.categoria = categoria; // 'Aula' | 'Laboratorio' | 'Servicio'
  }
}

module.exports = Aula;
