// Distribucion del campus (decoracion del plano, coincide con las coordenadas de ESPACIO).
// Plano de 100 x 70 unidades: y crece hacia el sur.
//   Norte: Pabellones B y C  |  Oeste: Pabellon A  |  Este: Pabellones D y E
//   Centro: Patio Central    |  Sur: Entrada Principal
window.CAMPUS = Object.freeze({
  EDIFICIOS: [
    { nombre: 'Pabellón A', x: 4,  y: 18, w: 20, h: 36 },
    { nombre: 'Pabellón B', x: 22, y: 2,  w: 30, h: 15 },
    { nombre: 'Pabellón C', x: 55, y: 2,  w: 18, h: 15 },
    { nombre: 'Pabellón D', x: 76, y: 4,  w: 20, h: 26 },
    { nombre: 'Pabellón E', x: 76, y: 33, w: 20, h: 27 },
  ],
  PATIO: { rx: 11, ry: 9 },
  DIAS: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
});
