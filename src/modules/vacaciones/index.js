'use strict';

const crypto = require('node:crypto');
const { AppError } = require('../../shared/logger');
const { sanitizeText } = require('../../shared/security');
const { withTransaction } = require('../../shared/database');
const {
  parseISODate,
  formatDateISO,
  addDaysUTC,
  calcularDiasHabilesEntre,
} = require('../../shared/holidays');

const ESTADOS_VACACIONES_VALIDOS = new Set([
  'disfrutada',
  'programada',
  'pendiente_aprobacion',
]);

/**
 * Regla de negocio pura: calcula los periodos de vacaciones causados desde la fecha de ingreso,
 * los días disfrutados, días programados y el saldo pendiente por disfrutar.
 */
function calcularEstadoVacaciones({
  fechaIngreso,
  fechaReferencia = formatDateISO(new Date()),
  diasPorAnio = 15,
  registros = [],
}) {
  const dtIngreso = parseISODate(fechaIngreso);
  const dtRef = parseISODate(fechaReferencia);

  if (!dtIngreso) {
    throw new AppError('VACATION_INVALID_HIRE_DATE', 'Fecha de ingreso inválida.', 400);
  }
  if (!dtRef) {
    throw new AppError('VACATION_INVALID_REF_DATE', 'Fecha de referencia inválida.', 400);
  }
  if (dtRef < dtIngreso) {
    return {
      fechaIngreso,
      fechaReferencia,
      diasPorAnio,
      diasLaboradosTotales: 0,
      periodosCompletosCausados: 0,
      diasCausadosCompletos: 0,
      diasProporcionalesAnioEnCurso: 0,
      diasCausadosTotales: 0,
      diasDisfrutados: 0,
      diasProgramados: 0,
      saldoPendientePeriodosCumplidos: 0,
      saldoDisponibleTotal: 0,
      periodosDetalle: [],
    };
  }

  const msPorDia = 1000 * 60 * 60 * 24;
  const diasLaboradosTotales = Math.floor((dtRef.getTime() - dtIngreso.getTime()) / msPorDia);

  // Calcular aniversarios completos cumplidos
  let aniosCumplidos = dtRef.getUTCFullYear() - dtIngreso.getUTCFullYear();
  const aniversarioEsteAnio = new Date(
    Date.UTC(dtRef.getUTCFullYear(), dtIngreso.getUTCMonth(), dtIngreso.getUTCDate())
  );
  if (dtRef < aniversarioEsteAnio) {
    aniosCumplidos -= 1;
  }
  aniosCumplidos = Math.max(0, aniosCumplidos);

  const ultimoAniversario = new Date(
    Date.UTC(
      dtIngreso.getUTCFullYear() + aniosCumplidos,
      dtIngreso.getUTCMonth(),
      dtIngreso.getUTCDate()
    )
  );
  const diasDesdeUltimoAniversario = Math.max(
    0,
    Math.floor((dtRef.getTime() - ultimoAniversario.getTime()) / msPorDia)
  );
  const diasProporcionalesAnioEnCurso =
    Math.round(((diasDesdeUltimoAniversario / 365) * diasPorAnio) * 100) / 100;

  const diasCausadosCompletos = aniosCumplidos * diasPorAnio;
  const diasCausadosTotales =
    Math.round((diasCausadosCompletos + diasProporcionalesAnioEnCurso) * 100) / 100;

  let diasDisfrutados = 0;
  let diasProgramados = 0;

  for (const reg of registros) {
    const dias = Number(reg.businessDays ?? reg.business_days ?? 0);
    const estado = reg.status || 'disfrutada';
    if (estado === 'disfrutada') {
      diasDisfrutados += dias;
    } else if (estado === 'programada' || estado === 'pendiente_aprobacion') {
      diasProgramados += dias;
    }
  }

  // Construir desglose de cada periodo anual causado
  let diasDisfrutadosPorAsignar = diasDisfrutados;
  const periodosDetalle = [];

  for (let i = 0; i < aniosCumplidos; i += 1) {
    const anioInicio = dtIngreso.getUTCFullYear() + i;
    const anioFin = anioInicio + 1;
    const etiqueta = `${anioInicio}-${anioFin}`;
    const fechaInicioPeriodo = formatDateISO(
      new Date(Date.UTC(anioInicio, dtIngreso.getUTCMonth(), dtIngreso.getUTCDate()))
    );
    const fechaFinPeriodo = formatDateISO(
      new Date(Date.UTC(anioFin, dtIngreso.getUTCMonth(), dtIngreso.getUTCDate()))
    );

    const tomadosEnPeriodo = Math.min(diasPorAnio, Math.max(0, diasDisfrutadosPorAsignar));
    diasDisfrutadosPorAsignar -= tomadosEnPeriodo;
    const pendientesPeriodo = diasPorAnio - tomadosEnPeriodo;

    periodosDetalle.push({
      periodo: etiqueta,
      fechaInicioPeriodo,
      fechaFinPeriodo,
      diasCausados: diasPorAnio,
      diasDisfrutados: tomadosEnPeriodo,
      diasPendientes: pendientesPeriodo,
      estadoPeriodo:
        pendientesPeriodo === 0
          ? 'completo'
          : tomadosEnPeriodo > 0
          ? 'parcial'
          : 'pendiente',
    });
  }

  const saldoPendientePeriodosCumplidos = diasCausadosCompletos - diasDisfrutados;
  const saldoDisponibleTotal =
    Math.round((diasCausadosTotales - diasDisfrutados - diasProgramados) * 100) / 100;

  return {
    fechaIngreso,
    fechaReferencia,
    diasPorAnio,
    diasLaboradosTotales,
    periodosCompletosCausados: aniosCumplidos,
    diasCausadosCompletos,
    diasProporcionalesAnioEnCurso,
    diasCausadosTotales,
    diasDisfrutados,
    diasProgramados,
    saldoPendientePeriodosCumplidos,
    saldoDisponibleTotal,
    alertaAcumulacion: saldoPendientePeriodosCumplidos >= diasPorAnio * 2,
    periodosDetalle,
  };
}

function createVacacionesModule(db) {
  function mapVacationRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      periodLabel: row.period_label,
      startDate: row.start_date,
      endDate: row.end_date,
      businessDays: row.business_days,
      status: row.status,
      notes: row.notes,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function listVacationRecords(userId) {
    const rows = db
      .prepare('SELECT * FROM vacation_records WHERE user_id = ? ORDER BY start_date DESC')
      .all(userId);
    return rows.map(mapVacationRow);
  }

  function createVacationRecord(userId, payload) {
    const startDate = String(payload.startDate || '').trim();
    const endDate = String(payload.endDate || '').trim();
    const dtStart = parseISODate(startDate);
    const dtEnd = parseISODate(endDate);

    if (!dtStart || !dtEnd) {
      throw new AppError(
        'VACATION_INVALID_DATES',
        'Las fechas de inicio y fin de vacaciones deben tener formato válido (AAAA-MM-DD).',
        400
      );
    }
    if (dtEnd < dtStart) {
      throw new AppError(
        'VACATION_END_BEFORE_START',
        'La fecha de regreso/fin no puede ser anterior a la fecha de inicio de vacaciones.',
        400,
        { field: 'endDate' }
      );
    }

    const periodLabel = sanitizeText(
      payload.periodLabel || `${dtStart.getUTCFullYear() - 1}-${dtStart.getUTCFullYear()}`,
      { maxLength: 30, fieldName: 'periodo causado' }
    );
    if (periodLabel.length < 4) {
      throw new AppError(
        'VACATION_INVALID_PERIOD',
        'Indique el periodo causado (por ejemplo: 2024-2025).',
        400,
        { field: 'periodLabel' }
      );
    }

    const status = payload.status ? String(payload.status).trim() : 'disfrutada';
    if (!ESTADOS_VACACIONES_VALIDOS.has(status)) {
      throw new AppError('VACATION_INVALID_STATUS', 'El estado del registro de vacaciones no es válido.', 400);
    }

    const calculatedHabiles = calcularDiasHabilesEntre(startDate, endDate, { sabadoHabil: true });
    const businessDays =
      payload.businessDays !== undefined && payload.businessDays !== ''
        ? Number.parseInt(payload.businessDays, 10)
        : Math.max(1, calculatedHabiles);

    if (!Number.isInteger(businessDays) || businessDays < 1 || businessDays > 90) {
      throw new AppError(
        'VACATION_INVALID_DAYS',
        'Los días hábiles de vacaciones deben estar entre 1 y 90.',
        400,
        { field: 'businessDays' }
      );
    }

    const notes = sanitizeText(payload.notes || '', {
      maxLength: 500,
      fieldName: 'observaciones de vacaciones',
    });

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    return withTransaction(db, () => {
      db.prepare(
        `INSERT INTO vacation_records (
          id, user_id, period_label, start_date, end_date,
          business_days, status, notes, version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ).run(
        id,
        userId,
        periodLabel,
        startDate,
        endDate,
        businessDays,
        status,
        notes,
        now,
        now
      );

      // Si el usuario solicita reflejar los días en el calendario de turnos
      if (payload.markOnCalendar) {
        let cursor = new Date(dtStart.getTime());
        while (cursor <= dtEnd) {
          const iso = formatDateISO(cursor);
          const existingShift = db
            .prepare('SELECT id, version FROM shifts WHERE user_id = ? AND shift_date = ?')
            .get(userId, iso);

          if (existingShift) {
            db.prepare(
              `UPDATE shifts
               SET shift_type = 'vacaciones', start_time = '00:00', end_time = '00:00',
                   hours_worked = 0, generates_compensatory = 0,
                   notes = ?, version = ?, updated_at = ?
               WHERE id = ?`
            ).run(
              `Vacaciones (${periodLabel})`,
              existingShift.version + 1,
              now,
              existingShift.id
            );
          } else {
            db.prepare(
              `INSERT INTO shifts (
                id, user_id, shift_date, shift_type, start_time, end_time,
                hours_worked, post_id, relief_guard_name, is_holiday_or_sunday,
                generates_compensatory, notes, version, updated_by, created_at, updated_at
              ) VALUES (?, ?, ?, 'vacaciones', '00:00', '00:00', 0, NULL, '', 0, 0, ?, 1, 'guarda', ?, ?)`
            ).run(crypto.randomUUID(), userId, iso, `Vacaciones (${periodLabel})`, now, now);
          }
          cursor = addDaysUTC(cursor, 1);
        }
      }

      const row = db.prepare('SELECT * FROM vacation_records WHERE id = ?').get(id);
      return mapVacationRow(row);
    });
  }

  function deleteVacationRecord(userId, recordId) {
    const existing = db
      .prepare('SELECT * FROM vacation_records WHERE id = ? AND user_id = ?')
      .get(recordId, userId);

    if (!existing) {
      throw new AppError('VACATION_NOT_FOUND', 'El registro de vacaciones no existe.', 404);
    }

    db.prepare('DELETE FROM vacation_records WHERE id = ? AND user_id = ?').run(recordId, userId);
    return { deleted: true, id: recordId };
  }

  function getVacationDashboard(userId, referenceDate = formatDateISO(new Date())) {
    const userRow = db
      .prepare('SELECT id, full_name, hire_date, vacation_days_per_year FROM users WHERE id = ?')
      .get(userId);

    if (!userRow) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado.', 404);
    }

    const registros = listVacationRecords(userId);
    const resumen = calcularEstadoVacaciones({
      fechaIngreso: userRow.hire_date,
      fechaReferencia: referenceDate,
      diasPorAnio: userRow.vacation_days_per_year,
      registros,
    });

    return {
      resumen,
      historial: registros,
    };
  }

  return {
    listVacationRecords,
    createVacationRecord,
    deleteVacationRecord,
    getVacationDashboard,
  };
}

module.exports = {
  calcularEstadoVacaciones,
  createVacacionesModule,
};
