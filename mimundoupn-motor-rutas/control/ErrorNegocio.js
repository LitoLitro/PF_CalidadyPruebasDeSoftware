// Error de reglas de negocio: la capa Boundary lo traduce a un codigo HTTP
class ErrorNegocio extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.name = 'ErrorNegocio';
    this.status = status;
    this.codigo = codigo;
  }
}

module.exports = ErrorNegocio;
