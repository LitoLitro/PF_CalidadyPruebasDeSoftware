// Roles registrados en la tabla ROL de BDGeolo
const ROL = Object.freeze({
  ESTUDIANTE: 1,
  DOCENTE: 2,
  COLABORADOR: 3,
  ADMINISTRADOR: 4
});

const NOMBRES_ROL = Object.freeze({
  1: 'Estudiante',
  2: 'Docente',
  3: 'Colaborador',
  4: 'Administrador'
});

module.exports = { ROL, NOMBRES_ROL };
