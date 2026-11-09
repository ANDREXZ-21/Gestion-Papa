'use strict';

const { config } = require('./config');
const { openDatabase } = require('./database');
const { createAuthModule } = require('../modules/auth');
const { createTurnosModule } = require('../modules/turnos');
const { createVacacionesModule } = require('../modules/vacaciones');
const { createSoporteModule } = require('../modules/soporte');

function seedDatabase(db, { referenceYearMonth = '2026-11' } = {}) {
  const auth = createAuthModule(db);
  const turnos = createTurnosModule(db);
  const vacaciones = createVacacionesModule(db);
  const soporte = createSoporteModule(db);

  const existingUsers = auth.listUsers();
  if (existingUsers.length > 0) {
    return { seeded: false, users: existingUsers };
  }

  // 1. Usuarios sintéticos (sin PII real)
  const guardaPapa = auth.createUser({
    id: 'user-papa-001',
    username: 'papa',
    fullName: 'Guarda Principal (Papá)',
    role: 'guarda',
    pin: '1234',
    hireDate: '2022-03-01',
    vacationDaysPerYear: 15,
    preferredPattern: '2x2x2',
    notificationsEnabled: true,
  });

  const supervisor = auth.createUser({
    id: 'user-sup-001',
    username: 'supervisor',
    fullName: 'Coordinador de Vigilancia (Demo)',
    role: 'supervisor',
    pin: '9999',
    hireDate: '2020-01-15',
    vacationDaysPerYear: 15,
    preferredPattern: '6x1',
    notificationsEnabled: true,
  });

  // 2. Puestos de vigilancia
  const puestoPorteria = turnos.createGuardPost({
    id: 'post-porteria-01',
    name: 'Portería Principal',
    location: 'Entrada Vehicular y Peatonal',
  });
  const puestoRecepcion = turnos.createGuardPost({
    id: 'post-recepcion-02',
    name: 'Recepción Torre Central',
    location: 'Lobby Principal - Piso 1',
  });
  turnos.createGuardPost({
    id: 'post-ronda-03',
    name: 'Ronda Perimetral y Sótanos',
    location: 'Zonas Comunes y Parqueaderos',
  });

  // 3. Programación de turnos del mes actual bajo patrón 2x2x2
  turnos.applyPatternSchedule(guardaPapa.id, {
    startDate: `${referenceYearMonth}-01`,
    days: 18,
    pattern: '2x2x2',
    postId: puestoPorteria.id,
    reliefGuardName: 'Carlos Ramírez (Relevo)',
    offsetDiaCiclo: 0,
    overwriteExisting: true,
  });

  // Registrar un día de descanso compensatorio disfrutado y un relevo especial
  turnos.upsertShift(guardaPapa.id, {
    shiftDate: `${referenceYearMonth}-06`,
    shiftType: 'descanso_compensatorio',
    startTime: '00:00',
    endTime: '00:00',
    hoursWorked: 0,
    postId: null,
    notes: 'Compensatorio por domingo 1 de noviembre laborado',
  });

  turnos.upsertShift(guardaPapa.id, {
    shiftDate: `${referenceYearMonth}-13`,
    shiftType: 'relevo',
    startTime: '06:00',
    endTime: '18:00',
    hoursWorked: 12,
    postId: puestoRecepcion.id,
    reliefGuardName: 'Hernando Gómez',
    notes: 'Apoyo en recepción por entrega de paquetes',
  });

  // 4. Historial de vacaciones anteriores
  vacaciones.createVacationRecord(guardaPapa.id, {
    periodLabel: '2022-2023',
    startDate: '2023-05-02',
    endDate: '2023-05-19',
    businessDays: 15,
    status: 'disfrutada',
    notes: 'Primer periodo anual disfrutado completo.',
  });

  vacaciones.createVacationRecord(guardaPapa.id, {
    periodLabel: '2023-2024',
    startDate: '2024-06-10',
    endDate: '2024-06-27',
    businessDays: 15,
    status: 'disfrutada',
    notes: 'Segundo periodo anual disfrutado completo.',
  });

  vacaciones.createVacationRecord(guardaPapa.id, {
    periodLabel: '2024-2025',
    startDate: '2025-08-04',
    endDate: '2025-08-12',
    businessDays: 8,
    status: 'disfrutada',
    notes: 'Adelanto parcial de 8 días hábiles; quedan 7 días pendientes de este periodo.',
  });

  // 5. Ticket de soporte de ejemplo
  soporte.createTicket(guardaPapa.id, {
    category: 'duda_vacaciones',
    subject: 'Verificación de saldo pendiente periodo 2024-2025',
    description: 'Confirmar los 7 días pendientes del periodo 2024-2025 más los 15 días causados en marzo 2026.',
    consentDiagnostico: true,
  });

  return {
    seeded: true,
    users: [guardaPapa, supervisor],
  };
}

if (require.main === module) {
  const db = openDatabase(config.dbPath);
  const res = seedDatabase(db);
  console.log('Base de datos inicializada:', res.seeded ? 'Semilla aplicada' : 'Ya contenía datos');
  db.close();
}

module.exports = { seedDatabase };
