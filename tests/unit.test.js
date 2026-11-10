'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  generarTurnosPorPatron,
  calcularResumenTurnos,
} = require('../src/modules/turnos');
const { calcularEstadoVacaciones } = require('../src/modules/vacaciones');
const {
  obtenerFestivosAnio,
  obtenerInfoFecha,
  calcularDiasHabilesEntre,
  parseISODate,
} = require('../src/shared/holidays');
const {
  sanitizeText,
  containsXssPayload,
  resolveSafePath,
  hashPin,
  verifyPin,
  encryptPayload,
  decryptPayload,
} = require('../src/shared/security');
const { redactSensitive } = require('../src/shared/logger');

test('Reglas de negocio de turnos: generarTurnosPorPatron aplica ciclo 2x2x2 y detecta domingos/festivos', () => {
  // Noviembre 2026 en Colombia:
  // 2026-11-01 es Domingo
  // 2026-11-02 es Lunes Festivo (Todos los Santos - Ley Emiliani)
  const plan = generarTurnosPorPatron({
    fechaInicio: '2026-11-01',
    dias: 6,
    patron: '2x2x2',
    postId: 'post-porteria-01',
    reliefGuardName: 'Carlos Relevo',
    offsetDiaCiclo: 0,
  });

  assert.equal(plan.length, 6);

  // Día 1 (2026-11-01, Domingo): Diurno -> laborado en domingo => genera compensatorio
  assert.equal(plan[0].shiftDate, '2026-11-01');
  assert.equal(plan[0].shiftType, 'diurno');
  assert.equal(plan[0].hoursWorked, 12);
  assert.equal(plan[0].isHolidayOrSunday, true);
  assert.equal(plan[0].generatesCompensatory, true);

  // Día 2 (2026-11-02, Lunes festivo): Diurno -> laborado en festivo => genera compensatorio
  assert.equal(plan[1].shiftDate, '2026-11-02');
  assert.equal(plan[1].shiftType, 'diurno');
  assert.equal(plan[1].isHolidayOrSunday, true);
  assert.equal(plan[1].generatesCompensatory, true);
  assert.match(plan[1].notes, /Festivo/i);

  // Días 3 y 4 (martes y miércoles ordinarios): Nocturnos -> no generan compensatorio
  assert.equal(plan[2].shiftType, 'nocturno');
  assert.equal(plan[2].generatesCompensatory, false);
  assert.equal(plan[3].shiftType, 'nocturno');

  // Días 5 y 6: Descansos reglamentarios (0 horas, sin puesto)
  assert.equal(plan[4].shiftType, 'descanso_reglamentario');
  assert.equal(plan[4].hoursWorked, 0);
  assert.equal(plan[4].postId, null);
  assert.equal(plan[5].shiftType, 'descanso_reglamentario');

  // Verificar patrón 4x1x4 (4 Días · 1 Descanso · 4 Noches) durante los 365 días del año
  const plan365 = generarTurnosPorPatron({
    fechaInicio: '2026-01-01',
    dias: 365,
    patron: '4x1x4',
    postId: 'post-porteria-01',
  });
  assert.equal(plan365.length, 365);
  const resumen365 = calcularResumenTurnos(plan365);
  assert.equal(resumen365.totalDiasTrabajados + resumen365.descansosReglamentarios, 365);
  assert.equal(resumen365.diasDiurnos, 148);
  assert.equal(resumen365.diasNocturnos, 144);
  assert.equal(resumen365.descansosReglamentarios, 73);
});

test('Reglas de negocio de turnos: casos límite y validaciones en generarTurnosPorPatron', () => {
  assert.throws(
    () => generarTurnosPorPatron({ fechaInicio: 'fecha-invalida', dias: 6, patron: '2x2x2' }),
    (err) => err.code === 'SHIFT_INVALID_START_DATE'
  );

  assert.throws(
    () => generarTurnosPorPatron({ fechaInicio: '2026-11-01', dias: 0, patron: '2x2x2' }),
    (err) => err.code === 'SHIFT_INVALID_DAYS_RANGE'
  );

  assert.throws(
    () => generarTurnosPorPatron({ fechaInicio: '2026-11-01', dias: 800, patron: '2x2x2' }),
    (err) => err.code === 'SHIFT_INVALID_DAYS_RANGE'
  );

  assert.throws(
    () => generarTurnosPorPatron({ fechaInicio: '2026-11-01', dias: 6, patron: 'patron_inexistente' }),
    (err) => err.code === 'SHIFT_INVALID_PATTERN'
  );
});

test('Reglas de negocio de turnos: calcularResumenTurnos contabiliza saldos, horas y alerta de fatiga', () => {
  // Caso vacío
  const vacio = calcularResumenTurnos([]);
  assert.equal(vacio.totalDiasTrabajados, 0);
  assert.equal(vacio.saldoCompensatoriosPendientes, 0);
  assert.equal(vacio.alertaFatiga, false);

  // Caso con 7 días trabajados seguidos (activa alerta de fatiga > 6) y compensatorios
  const turnos = [
    { shiftDate: '2026-11-01', shiftType: 'diurno', hoursWorked: 12, isHolidayOrSunday: true, generatesCompensatory: true },
    { shiftDate: '2026-11-02', shiftType: 'diurno', hoursWorked: 12, isHolidayOrSunday: true, generatesCompensatory: true },
    { shiftDate: '2026-11-03', shiftType: 'nocturno', hoursWorked: 12, isHolidayOrSunday: false, generatesCompensatory: false },
    { shiftDate: '2026-11-04', shiftType: 'nocturno', hoursWorked: 12, isHolidayOrSunday: false, generatesCompensatory: false },
    { shiftDate: '2026-11-05', shiftType: 'relevo', hoursWorked: 12, isHolidayOrSunday: false, generatesCompensatory: false },
    { shiftDate: '2026-11-06', shiftType: 'diurno', hoursWorked: 12, isHolidayOrSunday: false, generatesCompensatory: false },
    { shiftDate: '2026-11-07', shiftType: 'diurno', hoursWorked: 12, isHolidayOrSunday: false, generatesCompensatory: false },
    { shiftDate: '2026-11-08', shiftType: 'descanso_compensatorio', hoursWorked: 0, isHolidayOrSunday: true, generatesCompensatory: false },
    { shiftDate: '2026-11-09', shiftType: 'descanso_reglamentario', hoursWorked: 0, isHolidayOrSunday: false, generatesCompensatory: false },
  ];

  const resumen = calcularResumenTurnos(turnos);
  assert.equal(resumen.diasDiurnos, 4);
  assert.equal(resumen.diasNocturnos, 2);
  assert.equal(resumen.diasRelevo, 1);
  assert.equal(resumen.totalDiasTrabajados, 7);
  assert.equal(resumen.totalHorasTrabajadas, 84);
  assert.equal(resumen.festivosODominicalesLaborados, 2);
  assert.equal(resumen.compensatoriosGenerados, 2);
  assert.equal(resumen.descansosCompensatoriosDisfrutados, 1);
  assert.equal(resumen.saldoCompensatoriosPendientes, 1);
  assert.equal(resumen.descansosReglamentarios, 1);
  assert.equal(resumen.rachaMaximaDiasTrabajados, 7);
  assert.equal(resumen.alertaFatiga, true);
});

test('Reglas de negocio de vacaciones: calcularEstadoVacaciones calcula periodos causados, disfrutados y pendientes', () => {
  const estado = calcularEstadoVacaciones({
    fechaIngreso: '2022-03-01',
    fechaReferencia: '2026-11-09',
    diasPorAnio: 15,
    registros: [
      { periodLabel: '2022-2023', businessDays: 15, status: 'disfrutada' },
      { periodLabel: '2023-2024', businessDays: 15, status: 'disfrutada' },
      { periodLabel: '2024-2025', businessDays: 8, status: 'disfrutada' },
      { periodLabel: '2025-2026', businessDays: 5, status: 'programada' },
    ],
  });

  // Entre 2022-03-01 y 2026-11-09 se han cumplido 4 aniversarios completos (60 días causados)
  assert.equal(estado.periodosCompletosCausados, 4);
  assert.equal(estado.diasCausadosCompletos, 60);
  assert.equal(estado.diasDisfrutados, 38);
  assert.equal(estado.diasProgramados, 5);
  assert.equal(estado.saldoPendientePeriodosCumplidos, 22);
  assert.ok(estado.diasProporcionalesAnioEnCurso > 0);
  assert.equal(estado.periodosDetalle.length, 4);
  assert.equal(estado.periodosDetalle[0].estadoPeriodo, 'completo');
  assert.equal(estado.periodosDetalle[1].estadoPeriodo, 'completo');
  assert.equal(estado.periodosDetalle[2].estadoPeriodo, 'parcial');
  assert.equal(estado.periodosDetalle[2].diasPendientes, 7);
  assert.equal(estado.periodosDetalle[3].estadoPeriodo, 'pendiente');
  assert.equal(estado.periodosDetalle[3].diasPendientes, 15);
});

test('Reglas de negocio de vacaciones: casos límite (fecha referencia anterior al ingreso y fechas inválidas)', () => {
  const antesDeIngreso = calcularEstadoVacaciones({
    fechaIngreso: '2026-05-01',
    fechaReferencia: '2026-01-01',
    diasPorAnio: 15,
    registros: [],
  });
  assert.equal(antesDeIngreso.periodosCompletosCausados, 0);
  assert.equal(antesDeIngreso.saldoDisponibleTotal, 0);

  assert.throws(
    () => calcularEstadoVacaciones({ fechaIngreso: '2026-02-30', fechaReferencia: '2026-11-09' }),
    (err) => err.code === 'VACATION_INVALID_HIRE_DATE'
  );
});

test('Calendario de festivos de Colombia y cálculo de días hábiles', () => {
  assert.equal(parseISODate('2026-02-29'), null); // 2026 no es bisiesto
  const festivos2026 = obtenerFestivosAnio(2026);
  assert.equal(festivos2026.get('2026-01-01'), 'Año Nuevo');
  assert.equal(festivos2026.get('2026-11-02'), 'Todos los Santos');
  assert.equal(festivos2026.get('2026-11-16'), 'Independencia de Cartagena');

  const infoDom = obtenerInfoFecha('2026-11-01');
  assert.equal(infoDom.esDomingo, true);
  assert.equal(infoDom.esDominicalOFestivo, true);

  // Del 2026-11-01 (domingo) al 2026-11-07 (sábado):
  // Dom 1 (no hábil), Lun 2 (festivo, no hábil), Mar 3 al Sáb 7 (5 días hábiles con sábado hábil)
  const habilesConSabado = calcularDiasHabilesEntre('2026-11-01', '2026-11-07', { sabadoHabil: true });
  assert.equal(habilesConSabado, 5);

  const habilesSinSabado = calcularDiasHabilesEntre('2026-11-01', '2026-11-07', { sabadoHabil: false });
  assert.equal(habilesSinSabado, 4);
});

test('Seguridad: bloqueo de XSS, confinamiento de rutas (Path Traversal), cifrado AES-256-GCM y redacción de logs', () => {
  // 1. Sanitización y XSS
  assert.equal(containsXssPayload('<script>alert(1)</script>'), true);
  assert.equal(containsXssPayload('<img src=x onerror=alert(1)>'), true);
  assert.equal(containsXssPayload('javascript:evil()'), true);
  assert.throws(
    () => sanitizeText('<svg onload="alert(1)">', { fieldName: 'minuta' }),
    (err) => err.code === 'SECURITY_XSS_BLOCKED'
  );

  // 2. Validación y confinamiento de rutas contra ../../ y nombres reservados
  const baseDir = path.resolve(__dirname, '..', 'public');
  const rutaValida = resolveSafePath(baseDir, 'index.html');
  assert.ok(rutaValida.endsWith('index.html'));

  assert.throws(
    () => resolveSafePath(baseDir, '../../package.json'),
    (err) => err.code === 'PATH_TRAVERSAL_REJECTED'
  );
  assert.throws(
    () => resolveSafePath(baseDir, '..\\..\\src\\server.js'),
    (err) => err.code === 'PATH_TRAVERSAL_REJECTED'
  );
  assert.throws(
    () => resolveSafePath(baseDir, 'CON.txt'),
    (err) => err.code === 'INVALID_PATH_SEGMENT'
  );

  // 3. Hash de PIN con scrypt y comparación constante
  const hash = hashPin('1234');
  assert.equal(verifyPin('1234', hash), true);
  assert.equal(verifyPin('9999', hash), false);

  // 4. Cifrado autenticado AES-256-GCM para backups
  const secreto = 'clave-prueba-32-bytes-segura-2026';
  const datosOriginales = { usuario: 'papa', turnos: 18 };
  const sobreCifrado = encryptPayload(datosOriginales, secreto);
  assert.equal(sobreCifrado.algorithm, 'aes-256-gcm');
  const descifrado = decryptPayload(sobreCifrado, secreto);
  assert.deepEqual(descifrado, datosOriginales);

  assert.throws(
    () => decryptPayload(sobreCifrado, 'clave-incorrecta'),
    (err) => err.code === 'BACKUP_DECRYPT_FAILED'
  );

  // 5. Redacción de datos sensibles en logs
  const limpio = redactSensitive({
    username: 'papa',
    pin: '1234',
    nested: { token: 'secreto-xyz', nota: 'normal' },
  });
  assert.equal(limpio.pin, '[REDACTED]');
  assert.equal(limpio.nested.token, '[REDACTED]');
  assert.equal(limpio.nested.nota, 'normal');
});
