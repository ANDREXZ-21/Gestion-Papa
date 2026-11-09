'use strict';

const crypto = require('node:crypto');
const { AppError } = require('../../shared/logger');
const { sanitizeText } = require('../../shared/security');
const { withTransaction } = require('../../shared/database');
const {
  parseISODate,
  formatDateISO,
  addDaysUTC,
  obtenerInfoFecha,
} = require('../../shared/holidays');

const TIPOS_TURNO_VALIDOS = new Set([
  'diurno',
  'nocturno',
  'relevo',
  'descanso_reglamentario',
  'descanso_compensatorio',
  'permiso_incapacidad',
  'vacaciones',
]);

const TIPOS_TRABAJADOS = new Set(['diurno', 'nocturno', 'relevo']);

const PATRONES_SEGURIDAD = {
  '2x2x2': {
    nombre: '2x2x2 (2 Días · 2 Noches · 2 Descansos)',
    secuencia: [
      { shiftType: 'diurno', startTime: '06:00', endTime: '18:00', hoursWorked: 12 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '18:00', hoursWorked: 12 },
      { shiftType: 'nocturno', startTime: '18:00', endTime: '06:00', hoursWorked: 12 },
      { shiftType: 'nocturno', startTime: '18:00', endTime: '06:00', hoursWorked: 12 },
      { shiftType: 'descanso_reglamentario', startTime: '00:00', endTime: '00:00', hoursWorked: 0 },
      { shiftType: 'descanso_reglamentario', startTime: '00:00', endTime: '00:00', hoursWorked: 0 },
    ],
  },
  '4x2': {
    nombre: '4x2 (2 Diurnos · 2 Nocturnos · 2 Descansos)',
    secuencia: [
      { shiftType: 'diurno', startTime: '06:00', endTime: '18:00', hoursWorked: 12 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '18:00', hoursWorked: 12 },
      { shiftType: 'nocturno', startTime: '18:00', endTime: '06:00', hoursWorked: 12 },
      { shiftType: 'nocturno', startTime: '18:00', endTime: '06:00', hoursWorked: 12 },
      { shiftType: 'descanso_reglamentario', startTime: '00:00', endTime: '00:00', hoursWorked: 0 },
      { shiftType: 'descanso_reglamentario', startTime: '00:00', endTime: '00:00', hoursWorked: 0 },
    ],
  },
  '6x1': {
    nombre: '6x1 (6 Días trabajados · 1 Descanso)',
    secuencia: [
      { shiftType: 'diurno', startTime: '06:00', endTime: '14:00', hoursWorked: 8 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '14:00', hoursWorked: 8 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '14:00', hoursWorked: 8 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '14:00', hoursWorked: 8 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '14:00', hoursWorked: 8 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '14:00', hoursWorked: 8 },
      { shiftType: 'descanso_reglamentario', startTime: '00:00', endTime: '00:00', hoursWorked: 0 },
    ],
  },
  diurno_fijo: {
    nombre: '12h Diurno Fijo (6x1)',
    secuencia: [
      { shiftType: 'diurno', startTime: '06:00', endTime: '18:00', hoursWorked: 12 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '18:00', hoursWorked: 12 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '18:00', hoursWorked: 12 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '18:00', hoursWorked: 12 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '18:00', hoursWorked: 12 },
      { shiftType: 'diurno', startTime: '06:00', endTime: '18:00', hoursWorked: 12 },
      { shiftType: 'descanso_reglamentario', startTime: '00:00', endTime: '00:00', hoursWorked: 0 },
    ],
  },
  nocturno_fijo: {
    nombre: '12h Nocturno Fijo (6x1)',
    secuencia: [
      { shiftType: 'nocturno', startTime: '18:00', endTime: '06:00', hoursWorked: 12 },
      { shiftType: 'nocturno', startTime: '18:00', endTime: '06:00', hoursWorked: 12 },
      { shiftType: 'nocturno', startTime: '18:00', endTime: '06:00', hoursWorked: 12 },
      { shiftType: 'nocturno', startTime: '18:00', endTime: '06:00', hoursWorked: 12 },
      { shiftType: 'nocturno', startTime: '18:00', endTime: '06:00', hoursWorked: 12 },
      { shiftType: 'nocturno', startTime: '18:00', endTime: '06:00', hoursWorked: 12 },
      { shiftType: 'descanso_reglamentario', startTime: '00:00', endTime: '00:00', hoursWorked: 0 },
    ],
  },
};

/**
 * Regla de negocio pura: genera la programación diaria según un patrón de vigilancia.
 */
function generarTurnosPorPatron({
  fechaInicio,
  dias = 6,
  patron = '2x2x2',
  postId = null,
  reliefGuardName = '',
  offsetDiaCiclo = 0,
}) {
  const dtInicio = parseISODate(fechaInicio);
  if (!dtInicio) {
    throw new AppError('SHIFT_INVALID_START_DATE', 'Fecha de inicio inválida (use YYYY-MM-DD).', 400);
  }
  const numDias = Number.parseInt(dias, 10);
  if (!Number.isInteger(numDias) || numDias < 1 || numDias > 90) {
    throw new AppError('SHIFT_INVALID_DAYS_RANGE', 'La cantidad de días a programar debe estar entre 1 y 90.', 400);
  }
  const configPatron = PATRONES_SEGURIDAD[patron];
  if (!configPatron) {
    throw new AppError('SHIFT_INVALID_PATTERN', `Patrón de turno "${patron}" no reconocido.`, 400);
  }

  const secuencia = configPatron.secuencia;
  const resultado = [];
  const offset = Math.max(0, Number.parseInt(offsetDiaCiclo, 10) || 0);

  for (let i = 0; i < numDias; i += 1) {
    const fechaActual = addDaysUTC(dtInicio, i);
    const fechaISO = formatDateISO(fechaActual);
    const paso = secuencia[(i + offset) % secuencia.length];
    const infoFecha = obtenerInfoFecha(fechaISO);
    const esLaborado = TIPOS_TRABAJADOS.has(paso.shiftType);
    const generaCompensatorio = esLaborado && infoFecha.esDominicalOFestivo;

    let notaAuto = '';
    if (infoFecha.esFestivo) {
      notaAuto = `Festivo: ${infoFecha.nombreFestivo}`;
    } else if (infoFecha.esDomingo) {
      notaAuto = 'Dominical';
    }

    resultado.push({
      shiftDate: fechaISO,
      shiftType: paso.shiftType,
      startTime: paso.startTime,
      endTime: paso.endTime,
      hoursWorked: paso.hoursWorked,
      postId: esLaborado ? postId : null,
      reliefGuardName: esLaborado ? reliefGuardName : '',
      isHolidayOrSunday: infoFecha.esDominicalOFestivo,
      generatesCompensatory: generaCompensatorio,
      notes: notaAuto,
    });
  }

  return resultado;
}

/**
 * Regla de negocio pura: calcula indicadores de días trabajados, descansos reglamentarios,
 * festivos laborados y saldo de descansos compensatorios.
 */
function calcularResumenTurnos(turnos = []) {
  const ordenados = [...turnos].sort((a, b) =>
    String(a.shiftDate || a.shift_date).localeCompare(String(b.shiftDate || b.shift_date))
  );

  let diasDiurnos = 0;
  let diasNocturnos = 0;
  let diasRelevo = 0;
  let descansosReglamentarios = 0;
  let descansosCompensatoriosDisfrutados = 0;
  let permisosIncapacidades = 0;
  let diasVacaciones = 0;
  let festivosODominicalesLaborados = 0;
  let compensatoriosGenerados = 0;

  let horasDiurnas = 0;
  let horasNocturnas = 0;
  let horasFestivas = 0;
  let totalHorasTrabajadas = 0;

  let rachaActual = 0;
  let rachaMaxima = 0;

  for (const t of ordenados) {
    const tipo = t.shiftType || t.shift_type;
    const horas = Number(t.hoursWorked ?? t.hours_worked ?? 0);
    const esFestivoODom = Boolean(t.isHolidayOrSunday ?? t.is_holiday_or_sunday);
    const generaComp = Boolean(t.generatesCompensatory ?? t.generates_compensatory);

    if (TIPOS_TRABAJADOS.has(tipo)) {
      rachaActual += 1;
      if (rachaActual > rachaMaxima) {
        rachaMaxima = rachaActual;
      }
      totalHorasTrabajadas += horas;

      if (tipo === 'diurno') {
        diasDiurnos += 1;
        horasDiurnas += horas;
      } else if (tipo === 'nocturno') {
        diasNocturnos += 1;
        horasNocturnas += horas;
      } else if (tipo === 'relevo') {
        diasRelevo += 1;
        horasDiurnas += horas;
      }

      if (esFestivoODom) {
        festivosODominicalesLaborados += 1;
        horasFestivas += horas;
      }
      if (generaComp) {
        compensatoriosGenerados += 1;
      }
    } else {
      rachaActual = 0;
      if (tipo === 'descanso_reglamentario') {
        descansosReglamentarios += 1;
      } else if (tipo === 'descanso_compensatorio') {
        descansosCompensatoriosDisfrutados += 1;
      } else if (tipo === 'permiso_incapacidad') {
        permisosIncapacidades += 1;
      } else if (tipo === 'vacaciones') {
        diasVacaciones += 1;
      }
    }
  }

  const totalDiasTrabajados = diasDiurnos + diasNocturnos + diasRelevo;
  const totalDescansosTomados = descansosReglamentarios + descansosCompensatoriosDisfrutados;
  const saldoCompensatoriosPendientes = compensatoriosGenerados - descansosCompensatoriosDisfrutados;

  return {
    diasDiurnos,
    diasNocturnos,
    diasRelevo,
    totalDiasTrabajados,
    descansosReglamentarios,
    descansosCompensatoriosDisfrutados,
    totalDescansosTomados,
    permisosIncapacidades,
    diasVacaciones,
    festivosODominicalesLaborados,
    compensatoriosGenerados,
    saldoCompensatoriosPendientes,
    horasDiurnas: Math.round(horasDiurnas * 100) / 100,
    horasNocturnas: Math.round(horasNocturnas * 100) / 100,
    horasFestivas: Math.round(horasFestivas * 100) / 100,
    totalHorasTrabajadas: Math.round(totalHorasTrabajadas * 100) / 100,
    rachaMaximaDiasTrabajados: rachaMaxima,
    alertaFatiga: rachaMaxima > 6,
  };
}

function createTurnosModule(db) {
  function mapShiftRow(row) {
    if (!row) return null;
    const infoFecha = obtenerInfoFecha(row.shift_date);
    return {
      id: row.id,
      userId: row.user_id,
      shiftDate: row.shift_date,
      shiftType: row.shift_type,
      startTime: row.start_time,
      endTime: row.end_time,
      hoursWorked: row.hours_worked,
      postId: row.post_id,
      postName: row.post_name || 'Sin puesto asignado',
      postLocation: row.post_location || '',
      reliefGuardName: row.relief_guard_name,
      isHolidayOrSunday: Boolean(row.is_holiday_or_sunday),
      holidayName: infoFecha.nombreFestivo || (infoFecha.esDomingo ? 'Domingo' : null),
      generatesCompensatory: Boolean(row.generates_compensatory),
      notes: row.notes,
      version: row.version,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function listGuardPosts() {
    return db
      .prepare('SELECT id, name, location, active, created_at FROM guard_posts WHERE active = 1 ORDER BY name ASC')
      .all()
      .map((r) => ({
        id: r.id,
        name: r.name,
        location: r.location,
        active: Boolean(r.active),
        createdAt: r.created_at,
      }));
  }

  function createGuardPost({ id = crypto.randomUUID(), name, location = '' }) {
    const cleanName = sanitizeText(name, { maxLength: 80, fieldName: 'nombre del puesto' });
    const cleanLocation = sanitizeText(location, { maxLength: 120, fieldName: 'ubicación del puesto' });
    if (cleanName.length < 2) {
      throw new AppError('POST_INVALID_NAME', 'El nombre del puesto debe tener al menos 2 caracteres.', 400);
    }

    const now = new Date().toISOString();
    try {
      db.prepare(
        'INSERT INTO guard_posts (id, name, location, active, created_at) VALUES (?, ?, ?, 1, ?)'
      ).run(id, cleanName, cleanLocation, now);
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        throw new AppError('POST_DUPLICATE', `Ya existe un puesto llamado "${cleanName}".`, 409);
      }
      throw err;
    }

    return {
      id,
      name: cleanName,
      location: cleanLocation,
      active: true,
      createdAt: now,
    };
  }

  function getShiftByDate(userId, shiftDate) {
    const row = db
      .prepare(
        `SELECT s.*, p.name AS post_name, p.location AS post_location
         FROM shifts s
         LEFT JOIN guard_posts p ON p.id = s.post_id
         WHERE s.user_id = ? AND s.shift_date = ?`
      )
      .get(userId, shiftDate);
    return mapShiftRow(row);
  }

  function listShifts({ userId, fromDate, toDate }) {
    let query = `
      SELECT s.*, p.name AS post_name, p.location AS post_location
      FROM shifts s
      LEFT JOIN guard_posts p ON p.id = s.post_id
      WHERE s.user_id = ?
    `;
    const params = [userId];

    if (fromDate) {
      if (!parseISODate(fromDate)) {
        throw new AppError('SHIFT_INVALID_FROM_DATE', 'Fecha inicial de consulta inválida.', 400);
      }
      query += ' AND s.shift_date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      if (!parseISODate(toDate)) {
        throw new AppError('SHIFT_INVALID_TO_DATE', 'Fecha final de consulta inválida.', 400);
      }
      query += ' AND s.shift_date <= ?';
      params.push(toDate);
    }

    query += ' ORDER BY s.shift_date ASC';
    const rows = db.prepare(query).all(...params);
    return rows.map(mapShiftRow);
  }

  function upsertShift(userId, payload, { actor = 'guarda' } = {}) {
    const shiftDate = String(payload.shiftDate || '').trim();
    const infoFecha = obtenerInfoFecha(shiftDate);
    if (!infoFecha.valida) {
      throw new AppError(
        'SHIFT_INVALID_DATE',
        'La fecha del turno no es válida. Use el formato AAAA-MM-DD.',
        400,
        { field: 'shiftDate' }
      );
    }

    const shiftType = String(payload.shiftType || '').trim();
    if (!TIPOS_TURNO_VALIDOS.has(shiftType)) {
      throw new AppError(
        'SHIFT_INVALID_TYPE',
        'Seleccione un tipo de turno válido (Diurno, Nocturno, Relevo, Descanso, etc.).',
        400,
        { field: 'shiftType' }
      );
    }

    const esLaborado = TIPOS_TRABAJADOS.has(shiftType);
    let defaultStart = '00:00';
    let defaultEnd = '00:00';
    let defaultHours = 0;

    if (shiftType === 'diurno') {
      defaultStart = '06:00';
      defaultEnd = '18:00';
      defaultHours = 12;
    } else if (shiftType === 'nocturno') {
      defaultStart = '18:00';
      defaultEnd = '06:00';
      defaultHours = 12;
    } else if (shiftType === 'relevo') {
      defaultStart = '06:00';
      defaultEnd = '18:00';
      defaultHours = 12;
    }

    const startTime = payload.startTime ? String(payload.startTime).trim() : defaultStart;
    const endTime = payload.endTime ? String(payload.endTime).trim() : defaultEnd;

    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      throw new AppError(
        'SHIFT_INVALID_TIME',
        'El horario de inicio y fin debe tener formato HH:MM (ej. 06:00).',
        400
      );
    }

    const hoursWorked =
      payload.hoursWorked !== undefined && payload.hoursWorked !== ''
        ? Number(payload.hoursWorked)
        : defaultHours;

    if (Number.isNaN(hoursWorked) || hoursWorked < 0 || hoursWorked > 24) {
      throw new AppError(
        'SHIFT_INVALID_HOURS',
        'Las horas trabajadas deben estar entre 0 y 24.',
        400,
        { field: 'hoursWorked' }
      );
    }

    const postId = payload.postId ? String(payload.postId).trim() : null;
    if (postId) {
      const postExists = db.prepare('SELECT id FROM guard_posts WHERE id = ?').get(postId);
      if (!postExists) {
        throw new AppError('SHIFT_POST_NOT_FOUND', 'El puesto de vigilancia seleccionado no existe.', 400);
      }
    }

    const reliefGuardName = sanitizeText(payload.reliefGuardName || '', {
      maxLength: 80,
      fieldName: 'compañero de relevo',
    });
    const notes = sanitizeText(payload.notes || '', {
      maxLength: 500,
      fieldName: 'minuta o novedades',
    });

    const isHolidayOrSunday =
      payload.isHolidayOrSunday !== undefined
        ? Boolean(payload.isHolidayOrSunday)
        : infoFecha.esDominicalOFestivo;

    const generatesCompensatory =
      payload.generatesCompensatory !== undefined
        ? Boolean(payload.generatesCompensatory)
        : esLaborado && isHolidayOrSunday;

    return withTransaction(db, () => {
      const existing = db
        .prepare('SELECT * FROM shifts WHERE user_id = ? AND shift_date = ?')
        .get(userId, shiftDate);

      const now = new Date().toISOString();

      if (existing) {
        if (
          payload.expectedVersion !== undefined &&
          payload.expectedVersion !== null &&
          Number(payload.expectedVersion) !== existing.version
        ) {
          throw new AppError(
            'SYNC_CONFLICT',
            `Conflicto de edición en la fecha ${shiftDate}: el turno fue modificado recientemente (versión actual ${existing.version}). Revise los cambios antes de sobrescribir.`,
            409,
            {
              shiftDate,
              serverRecord: getShiftByDate(userId, shiftDate),
              clientPayload: payload,
            }
          );
        }

        const nextVersion = existing.version + 1;
        db.prepare(
          `UPDATE shifts
           SET shift_type = ?, start_time = ?, end_time = ?, hours_worked = ?,
               post_id = ?, relief_guard_name = ?, is_holiday_or_sunday = ?,
               generates_compensatory = ?, notes = ?, version = ?, updated_by = ?, updated_at = ?
           WHERE id = ?`
        ).run(
          shiftType,
          startTime,
          endTime,
          esLaborado ? hoursWorked : 0,
          postId,
          reliefGuardName,
          isHolidayOrSunday ? 1 : 0,
          esLaborado && generatesCompensatory ? 1 : 0,
          notes,
          nextVersion,
          actor,
          now,
          existing.id
        );

        db.prepare(
          'INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          crypto.randomUUID(),
          'shift',
          existing.id,
          'UPDATE',
          JSON.stringify({ shiftDate, shiftType, version: nextVersion }),
          now
        );
      } else {
        const id = crypto.randomUUID();
        db.prepare(
          `INSERT INTO shifts (
            id, user_id, shift_date, shift_type, start_time, end_time, hours_worked,
            post_id, relief_guard_name, is_holiday_or_sunday, generates_compensatory,
            notes, version, updated_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
        ).run(
          id,
          userId,
          shiftDate,
          shiftType,
          startTime,
          endTime,
          esLaborado ? hoursWorked : 0,
          postId,
          reliefGuardName,
          isHolidayOrSunday ? 1 : 0,
          esLaborado && generatesCompensatory ? 1 : 0,
          notes,
          actor,
          now,
          now
        );

        db.prepare(
          'INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          crypto.randomUUID(),
          'shift',
          id,
          'INSERT',
          JSON.stringify({ shiftDate, shiftType, version: 1 }),
          now
        );
      }

      return getShiftByDate(userId, shiftDate);
    });
  }

  function applyPatternSchedule(
    userId,
    {
      startDate,
      days = 12,
      pattern = '2x2x2',
      postId = null,
      reliefGuardName = '',
      offsetDiaCiclo = 0,
      overwriteExisting = true,
    },
    { actor = 'guarda' } = {}
  ) {
    const cleanRelief = sanitizeText(reliefGuardName || '', {
      maxLength: 80,
      fieldName: 'compañero de relevo',
    });
    const plan = generarTurnosPorPatron({
      fechaInicio: startDate,
      dias: days,
      patron: pattern,
      postId: postId || null,
      reliefGuardName: cleanRelief,
      offsetDiaCiclo,
    });

    return withTransaction(db, () => {
      const aplicados = [];
      for (const item of plan) {
        const existente = getShiftByDate(userId, item.shiftDate);
        if (existente && !overwriteExisting) {
          aplicados.push(existente);
          continue;
        }
        const guardado = upsertShift(userId, item, { actor });
        aplicados.push(guardado);
      }
      return aplicados;
    });
  }

  function deleteShift(userId, shiftDate) {
    const existing = getShiftByDate(userId, shiftDate);
    if (!existing) {
      throw new AppError('SHIFT_NOT_FOUND', `No hay turno registrado para la fecha ${shiftDate}.`, 404);
    }
    db.prepare('DELETE FROM shifts WHERE user_id = ? AND shift_date = ?').run(userId, shiftDate);
    return { deleted: true, shiftDate };
  }

  function getShiftsSummary(userId, { fromDate, toDate } = {}) {
    const periodShifts = listShifts({ userId, fromDate, toDate });
    const allShifts = fromDate || toDate ? listShifts({ userId }) : periodShifts;
    const resumenPeriodo = calcularResumenTurnos(periodShifts);
    const resumenHistorico = calcularResumenTurnos(allShifts);

    return {
      periodo: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        ...resumenPeriodo,
      },
      acumuladoGlobal: {
        compensatoriosGenerados: resumenHistorico.compensatoriosGenerados,
        compensatoriosDisfrutados: resumenHistorico.descansosCompensatoriosDisfrutados,
        saldoCompensatoriosPendientes: resumenHistorico.saldoCompensatoriosPendientes,
        totalDiasTrabajadosHistorico: resumenHistorico.totalDiasTrabajados,
        festivosODominicalesLaboradosHistorico: resumenHistorico.festivosODominicalesLaborados,
      },
    };
  }

  return {
    listGuardPosts,
    createGuardPost,
    getShiftByDate,
    listShifts,
    upsertShift,
    applyPatternSchedule,
    deleteShift,
    getShiftsSummary,
  };
}

module.exports = {
  PATRONES_SEGURIDAD,
  generarTurnosPorPatron,
  calcularResumenTurnos,
  createTurnosModule,
};
