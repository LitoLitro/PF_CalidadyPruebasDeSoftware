// Horario de atencion de un ambiente. diaSem: 1 = lunes ... 7 = domingo
class HoraAtencion {
  constructor(id, espacioId, diaSem, apertura, cierre) {
    this.id = id;
    this.espacioId = espacioId;
    this.diaSem = diaSem;
    this.apertura = apertura; // 'HH:MM'
    this.cierre = cierre;     // 'HH:MM'
  }
}

module.exports = HoraAtencion;
