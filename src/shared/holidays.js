'use strict';

/**
 * Cálculo de festivos nacionales (Colombia - Ley 51 de 1983 / Ley Emiliani)
 * y utilidades de fechas para turnos de vigilancia y días hábiles de vacaciones.
 */

function calcularPascua(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDaysUTC(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function moverALunesSiguiente(date) {
  const d = new Date(date.getTime());
  const dayOfWeek = d.getUTCDay(); // 0 = domingo, 1 = lunes
  if (dayOfWeek === 1) return d;
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  return addDaysUTC(d, daysUntilMonday);
}

function formatDateISO(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const cacheFestivosPorAnio = new Map();

function obtenerFestivosAnio(year) {
  if (cacheFestivosPorAnio.has(year)) {
    return cacheFestivosPorAnio.get(year);
  }

  const festivos = new Map();
  const agregar = (date, nombre) => {
    festivos.set(formatDateISO(date), nombre);
  };

  // Festivos de fecha fija
  agregar(new Date(Date.UTC(year, 0, 1)), 'Año Nuevo');
  agregar(new Date(Date.UTC(year, 4, 1)), 'Día del Trabajo');
  agregar(new Date(Date.UTC(year, 6, 20)), 'Día de la Independencia');
  agregar(new Date(Date.UTC(year, 7, 7)), 'Batalla de Boyacá');
  agregar(new Date(Date.UTC(year, 11, 8)), 'Inmaculada Concepción');
  agregar(new Date(Date.UTC(year, 11, 25)), 'Navidad');

  // Festivos trasladables al lunes (Ley Emiliani)
  agregar(moverALunesSiguiente(new Date(Date.UTC(year, 0, 6))), 'Reyes Magos');
  agregar(moverALunesSiguiente(new Date(Date.UTC(year, 2, 19))), 'San José');
  agregar(moverALunesSiguiente(new Date(Date.UTC(year, 5, 29))), 'San Pedro y San Pablo');
  agregar(moverALunesSiguiente(new Date(Date.UTC(year, 7, 15))), 'Asunción de la Virgen');
  agregar(moverALunesSiguiente(new Date(Date.UTC(year, 9, 12))), 'Día de la Raza');
  agregar(moverALunesSiguiente(new Date(Date.UTC(year, 10, 1))), 'Todos los Santos');
  agregar(moverALunesSiguiente(new Date(Date.UTC(year, 10, 11))), 'Independencia de Cartagena');

  // Festivos basados en Pascua
  const pascua = calcularPascua(year);
  agregar(addDaysUTC(pascua, -3), 'Jueves Santo');
  agregar(addDaysUTC(pascua, -2), 'Viernes Santo');
  agregar(moverALunesSiguiente(addDaysUTC(pascua, 39)), 'Ascensión del Señor');
  agregar(moverALunesSiguiente(addDaysUTC(pascua, 60)), 'Corpus Christi');
  agregar(moverALunesSiguiente(addDaysUTC(pascua, 68)), 'Sagrado Corazón');

  cacheFestivosPorAnio.set(year, festivos);
  return festivos;
}

function parseISODate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

function obtenerInfoFecha(dateStr) {
  const dt = parseISODate(dateStr);
  if (!dt) {
    return { valida: false, esDomingo: false, esFestivo: false, nombreFestivo: null, esDominicalOFestivo: false };
  }
  const year = dt.getUTCFullYear();
  const festivos = obtenerFestivosAnio(year);
  const nombreFestivo = festivos.get(dateStr) || null;
  const esDomingo = dt.getUTCDay() === 0;
  const esFestivo = Boolean(nombreFestivo);
  return {
    valida: true,
    esDomingo,
    esFestivo,
    nombreFestivo,
    esDominicalOFestivo: esDomingo || esFestivo,
    diaSemana: dt.getUTCDay(),
  };
}

/**
 * Calcula días hábiles entre dos fechas (inclusive), excluyendo domingos y festivos
 * (o sábados si incluyeSabadoComoHabil = false; en seguridad/Colombia normalmente lunes a sábado son hábiles para vacaciones de 15 días).
 */
function calcularDiasHabilesEntre(fechaInicioStr, fechaFinStr, { sabadoHabil = true } = {}) {
  const inicio = parseISODate(fechaInicioStr);
  const fin = parseISODate(fechaFinStr);
  if (!inicio || !fin || fin < inicio) return 0;

  let habiles = 0;
  let cursor = new Date(inicio.getTime());
  while (cursor <= fin) {
    const iso = formatDateISO(cursor);
    const info = obtenerInfoFecha(iso);
    const esSabado = info.diaSemana === 6;
    if (!info.esDominicalOFestivo && (sabadoHabil || !esSabado)) {
      habiles += 1;
    }
    cursor = addDaysUTC(cursor, 1);
  }
  return habiles;
}

module.exports = {
  obtenerFestivosAnio,
  parseISODate,
  formatDateISO,
  addDaysUTC,
  obtenerInfoFecha,
  calcularDiasHabilesEntre,
};
