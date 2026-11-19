const { validarHorarios, estaAbierto, agruparPorEspacio, diaSemana } = require('../control/HorarioService');

describe('Horarios de atención - validación', () => {

  test('Sin horarios devuelve una lista vacía', () => {
    expect(validarHorarios(undefined)).toEqual([]);
    expect(validarHorarios(null)).toEqual([]);
    expect(validarHorarios([])).toEqual([]);
  });

  test('Normaliza y ordena por día y hora', () => {
    const resultado = validarHorarios([
      { diaSem: '3', apertura: '14:00', cierre: '18:00' },
      { diaSem: 1, apertura: '08:00:00', cierre: '12:00' },
      { diaSem: 3, apertura: '08:00', cierre: '12:00' },
    ]);
    expect(resultado).toEqual([
      { diaSem: 1, apertura: '08:00', cierre: '12:00' },
      { diaSem: 3, apertura: '08:00', cierre: '12:00' },
      { diaSem: 3, apertura: '14:00', cierre: '18:00' },
    ]);
  });

  test('Rechaza un día fuera de 1-7', () => {
    expect(() => validarHorarios([{ diaSem: 8, apertura: '08:00', cierre: '10:00' }]))
      .toThrow('entre 1 (lunes) y 7 (domingo)');
  });

  test('Rechaza horas con formato inválido', () => {
    expect(() => validarHorarios([{ diaSem: 1, apertura: '8am', cierre: '10:00' }]))
      .toThrow('formato HH:MM');
    expect(() => validarHorarios([{ diaSem: 1, apertura: '25:00', cierre: '26:00' }]))
      .toThrow('formato HH:MM');
  });

  test('Rechaza apertura igual o posterior al cierre', () => {
    expect(() => validarHorarios([{ diaSem: 2, apertura: '18:00', cierre: '09:00' }]))
      .toThrow('apertura debe ser anterior');
  });

  test('Rechaza tramos superpuestos el mismo día', () => {
    expect(() => validarHorarios([
      { diaSem: 5, apertura: '08:00', cierre: '13:00' },
      { diaSem: 5, apertura: '12:00', cierre: '18:00' },
    ])).toThrow('se superponen');
  });

  test('El error lleva estado HTTP 400', () => {
    try {
      validarHorarios('lunes');
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.codigo).toBe('HORARIO_INVALIDO');
    }
    expect.assertions(2);
  });
});

describe('Horarios de atención - abierto ahora', () => {
  const horarios = [
    { diaSem: 1, apertura: '08:00', cierre: '12:00' },
    { diaSem: 7, apertura: '10:00', cierre: '14:00' },
  ];

  test('Lunes 09:30 está abierto', () => {
    expect(estaAbierto(horarios, new Date(2026, 10, 16, 9, 30))).toBe(true); // 16/11/2026 = lunes
  });

  test('Lunes 12:00 ya cerró (el cierre no es inclusivo)', () => {
    expect(estaAbierto(horarios, new Date(2026, 10, 16, 12, 0))).toBe(false);
  });

  test('Domingo se mapea al día 7', () => {
    const domingo = new Date(2026, 10, 22, 11, 0);
    expect(diaSemana(domingo)).toBe(7);
    expect(estaAbierto(horarios, domingo)).toBe(true);
  });

  test('Sin horario definido devuelve null', () => {
    expect(estaAbierto([], new Date())).toBeNull();
  });

  test('Agrupa horarios por ambiente', () => {
    const mapa = agruparPorEspacio([
      { espacioId: 1, diaSem: 1, apertura: '08:00', cierre: '10:00' },
      { espacioId: 2, diaSem: 1, apertura: '09:00', cierre: '11:00' },
      { espacioId: 1, diaSem: 2, apertura: '08:00', cierre: '10:00' },
    ]);
    expect(mapa.get(1)).toHaveLength(2);
    expect(mapa.get(2)).toEqual([{ diaSem: 1, apertura: '09:00', cierre: '11:00' }]);
  });
});
