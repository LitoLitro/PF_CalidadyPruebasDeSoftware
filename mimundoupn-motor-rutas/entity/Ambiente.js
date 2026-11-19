// Ambiente (registro de ESPACIO) tal como lo gestiona el Administrador
class Ambiente {
  constructor({ id = null, codigo, nombre, pabellonId = null, piso = 1, tipoEspacioId,
    x, y, capacidad = null, ubiDesc = null, pabellon = null, tipo = null }) {
    this.id = id;
    this.codigo = codigo;
    this.nombre = nombre;
    this.pabellonId = pabellonId;
    this.pabellon = pabellon;
    this.piso = piso;
    this.tipoEspacioId = tipoEspacioId;
    this.tipo = tipo;
    this.x = x; // longitud en el plano
    this.y = y; // latitud en el plano
    this.capacidad = capacidad;
    this.ubiDesc = ubiDesc;
  }
}

module.exports = Ambiente;
