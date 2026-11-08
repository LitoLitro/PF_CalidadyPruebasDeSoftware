/**
 * CONTROL - Errores de negocio con su código HTTP.
 * Permiten a la capa Boundary responder con el código correcto
 * sin depender del texto del mensaje.
 */
class ErrorNegocio extends Error {
  constructor(mensaje, estadoHttp) {
    super(mensaje);
    this.name = this.constructor.name;
    this.estadoHttp = estadoHttp;
  }
}

class ErrorValidacion extends ErrorNegocio {
  constructor(mensaje) { super(mensaje, 400); }
}

class ErrorCredenciales extends ErrorNegocio {
  constructor(mensaje = 'Correo o contraseña incorrectos.') { super(mensaje, 401); }
}

class ErrorConflicto extends ErrorNegocio {
  constructor(mensaje) { super(mensaje, 409); }
}

module.exports = { ErrorNegocio, ErrorValidacion, ErrorCredenciales, ErrorConflicto };
