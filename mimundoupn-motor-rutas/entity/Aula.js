
class Aula {
  constructor(codigo, nombre, nodoId, bloque, piso = null, categoria = 'Aula') {
    this.codigo = codigo;      
    this.nombre = nombre;      
    this.nodoId = nodoId;     
    this.bloque = bloque;    
    this.piso = piso;       
    this.categoria = categoria; 
  }
}

module.exports = Aula;
