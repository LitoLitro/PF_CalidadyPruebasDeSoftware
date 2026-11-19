const ErrorNegocio = require('./ErrorNegocio');

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Date#getDay: 0 = domingo. En HORA_ATENCION: 1 = lunes ... 7 = domingo
const diaSemana = (fecha) => (fecha.getDay() === 0 ? 7 : fecha.getDay());

// Valida y normaliza la lista de horarios que envia el Administrador
function validarHorarios(horarios) {
  if (horarios === undefined || horarios === null) return [];
  if (!Array.isArray(horarios)) {
    throw new ErrorNegocio(400, 'HORARIO_INVALIDO', 'Los horarios deben enviarse como una lista.');
  }

  const normalizados = horarios.map((h) => {
    const diaSem = Number(h && h.diaSem);
    const apertura = String((h && h.apertura) || '').trim().slice(0, 5);
    const cierre = String((h && h.cierre) || '').trim().slice(0, 5);

    if (!Number.isInteger(diaSem) || diaSem < 1 || diaSem > 7) {
      throw new ErrorNegocio(400, 'HORARIO_INVALIDO', 'El día del horario debe estar entre 1 (lunes) y 7 (domingo).');
    }
    if (!FORMATO_HORA.test(apertura) || !FORMATO_HORA.test(cierre)) {
      throw new ErrorNegocio(400, 'HORARIO_INVALIDO', `Las horas del ${DIAS[diaSem - 1]} deben tener el formato HH:MM.`);
    }
    if (aMinutos(apertura) >= aMinutos(cierre)) {
      throw new ErrorNegocio(400, 'HORARIO_INVALIDO', `En ${DIAS[diaSem - 1]} la hora de apertura debe ser anterior a la de cierre.`);
    }
    return { diaSem, apertura, cierre };
  });

  // No se permiten tramos que se crucen el mismo dia
  const ordenados = [...normalizados].sort((a, b) => a.diaSem - b.diaSem || aMinutos(a.apertura) - aMinutos(b.apertura));
  for (let i = 1; i < ordenados.length; i++) {
    const prev = ordenados[i - 1];
    const act = ordenados[i];
    if (prev.diaSem === act.diaSem && aMinutos(act.apertura) < aMinutos(prev.cierre)) {
      throw new ErrorNegocio(400, 'HORARIO_INVALIDO', `Los horarios del ${DIAS[act.diaSem - 1]} se superponen.`);
    }
  }
  return ordenados;
}

// true/false si tiene horarios; null si el ambiente no tiene horario definido
function estaAbierto(horarios, fecha = new Date()) {
  if (!horarios || horarios.length === 0) return null;
  const dia = diaSemana(fecha);
  const ahora = fecha.getHours() * 60 + fecha.getMinutes();
  return horarios.some((h) => h.diaSem === dia && ahora >= aMinutos(h.apertura) && ahora < aMinutos(h.cierre));
}

function agruparPorEspacio(horarios) {
  const mapa = new Map();
  for (const h of horarios) {
    if (!mapa.has(h.espacioId)) mapa.set(h.espacioId, []);
    mapa.get(h.espacioId).push({ diaSem: h.diaSem, apertura: h.apertura, cierre: h.cierre });
  }
  return mapa;
}

module.exports = { DIAS, validarHorarios, estaAbierto, agruparPorEspacio, diaSemana };
