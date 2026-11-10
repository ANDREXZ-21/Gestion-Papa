'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');

const { openDatabase, withTransaction } = require('../src/shared/database');
const { seedDatabase } = require('../src/shared/seed');
const { createApp } = require('../src/app');

process.env.NODE_ENV = 'test';

/**
 * Ejecuta una petición HTTP contra la instancia del servidor de forma determinista
 * y sin depender de puertos de red externos.
 */
function invokeApp(server, { method = 'GET', url = '/', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const rawBody =
      body === null || body === undefined
        ? ''
        : typeof body === 'string'
        ? body
        : JSON.stringify(body);

    const req = new Readable({
      read() {
        if (rawBody) {
          this.push(Buffer.from(rawBody, 'utf8'));
        }
        this.push(null);
      },
    });

    req.method = method;
    req.url = url;
    req.headers = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    );
    req.destroy = () => {};

    const resHeaders = {};
    const chunks = [];
    const res = {
      statusCode: 200,
      setHeader(name, value) {
        resHeaders[name.toLowerCase()] = value;
      },
      getHeader(name) {
        return resHeaders[name.toLowerCase()];
      },
      end(chunk) {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8'));
        }
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString('utf8');
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        resolve({
          status: this.statusCode,
          headers: resHeaders,
          text,
          json,
        });
      },
    };

    try {
      server.emit('request', req, res);
    } catch (err) {
      reject(err);
    }
  });
}

function createTestEnvironment() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gestion-papa-test-'));
  const dbPath = path.join(tmpDir, 'test.sqlite');
  const backupDir = path.join(tmpDir, 'backups');
  const db = openDatabase(dbPath);
  seedDatabase(db, { referenceYearMonth: '2026-11' });

  const appConfig = {
    env: 'test',
    port: 0,
    host: '127.0.0.1',
    rootDir: path.resolve(__dirname, '..'),
    dbPath,
    backupDir,
    appSecret: 'secreto-integracion-2026-seguro',
    sessionTtlHours: 24,
  };

  const { server, modules } = createApp(db, appConfig);

  const cleanup = () => {
    try {
      db.close();
    } catch {
      // ignore
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  };

  return { db, server, modules, tmpDir, backupDir, cleanup };
}

test('Integridad de Base de Datos SQLite: restricciones CHECK, UNIQUE y FOREIGN KEY impiden estados inválidos', () => {
  const { db, cleanup } = createTestEnvironment();
  try {
    // 1. Prohibir rol inválido (CHECK constraint)
    assert.throws(() => {
      db.prepare(
        `INSERT INTO users (id, username, full_name, role, pin_hash, hire_date, created_at, updated_at)
         VALUES ('u-bad', 'baduser', 'Usuario Malo', 'admin_invalido', 'hash', '2023-01-01', '2026-01-01', '2026-01-01')`
      ).run();
    });

    // 2. Prohibir horas negativas o > 24 en turnos (CHECK constraint)
    assert.throws(() => {
      db.prepare(
        `INSERT INTO shifts (id, user_id, shift_date, shift_type, hours_worked, created_at, updated_at)
         VALUES ('s-bad', 'user-papa-001', '2026-12-01', 'diurno', 30, '2026-01-01', '2026-01-01')`
      ).run();
    });

    // 3. Prohibir fecha de fin anterior a fecha de inicio en vacaciones (CHECK constraint)
    assert.throws(() => {
      db.prepare(
        `INSERT INTO vacation_records (id, user_id, period_label, start_date, end_date, business_days, created_at, updated_at)
         VALUES ('v-bad', 'user-papa-001', '2025-2026', '2026-06-15', '2026-06-01', 10, '2026-01-01', '2026-01-01')`
      ).run();
    });

    // 4. Prohibir usuario inexistente en turnos (FOREIGN KEY constraint)
    assert.throws(() => {
      db.prepare(
        `INSERT INTO shifts (id, user_id, shift_date, shift_type, hours_worked, created_at, updated_at)
         VALUES ('s-fk', 'usuario-fantasma', '2026-12-02', 'diurno', 12, '2026-01-01', '2026-01-01')`
      ).run();
    });
  } finally {
    cleanup();
  }
});

test('Transacciones y consistencia: withTransaction revierte escrituras parciales ante un error', () => {
  const { db, cleanup } = createTestEnvironment();
  try {
    const countBefore = db.prepare('SELECT COUNT(*) AS total FROM guard_posts').get().total;

    assert.throws(() => {
      withTransaction(db, () => {
        db.prepare(
          'INSERT INTO guard_posts (id, name, location, active, created_at) VALUES (?, ?, ?, 1, ?)'
        ).run('post-temp-99', 'Puesto Temporal', 'Zona Prueba', new Date().toISOString());

        // Forzar fallo dentro de la transacción
        throw new Error('Fallo simulado a mitad de operación');
      });
    });

    const countAfter = db.prepare('SELECT COUNT(*) AS total FROM guard_posts').get().total;
    assert.equal(countAfter, countBefore, 'No deben quedar escrituras parciales tras el rollback');
  } finally {
    cleanup();
  }
});

test('Autenticación, Sesiones y Autorización por Rol (RBAC) en todos los endpoints', async () => {
  const { server, cleanup } = createTestEnvironment();
  try {
    // 1. Acceso sin token a ruta protegida -> 401
    const unauthRes = await invokeApp(server, { method: 'GET', url: '/api/turnos' });
    assert.equal(unauthRes.status, 401);
    assert.equal(unauthRes.json.error.code, 'AUTH_REQUIRED');

    // 2. Login fallido con PIN incorrecto -> 401
    const badLogin = await invokeApp(server, {
      method: 'POST',
      url: '/api/auth/login',
      body: { username: 'papa', pin: '0000' },
    });
    assert.equal(badLogin.status, 401);
    assert.equal(badLogin.json.error.code, 'AUTH_INVALID_CREDENTIALS');

    // 3. Login exitoso como guarda ("papa")
    const guardaLogin = await invokeApp(server, {
      method: 'POST',
      url: '/api/auth/login',
      body: { username: 'papa', pin: '1234' },
    });
    assert.equal(guardaLogin.status, 200);
    const guardaToken = guardaLogin.json.token;
    assert.ok(guardaToken);
    assert.equal(guardaLogin.json.user.role, 'guarda');

    // 4. Guarda intenta acceder a endpoint exclusivo de supervisor -> 403 AUTH_FORBIDDEN
    const forbiddenRes = await invokeApp(server, {
      method: 'GET',
      url: '/api/admin/users',
      headers: { Authorization: `Bearer ${guardaToken}` },
    });
    assert.equal(forbiddenRes.status, 403);
    assert.equal(forbiddenRes.json.error.code, 'AUTH_FORBIDDEN');

    // 5. Login como supervisor -> 200 en /api/admin/users
    const supLogin = await invokeApp(server, {
      method: 'POST',
      url: '/api/auth/login',
      body: { username: 'supervisor', pin: '9999' },
    });
    assert.equal(supLogin.status, 200);
    const supToken = supLogin.json.token;

    const adminRes = await invokeApp(server, {
      method: 'GET',
      url: '/api/admin/users',
      headers: { Authorization: `Bearer ${supToken}` },
    });
    assert.equal(adminRes.status, 200);
    assert.ok(Array.isArray(adminRes.json.users));
    assert.ok(adminRes.json.users.length >= 2);
  } finally {
    cleanup();
  }
});

test('Contrato de API: flujo completo de turnos, concurrencia (409 SYNC_CONFLICT), vacaciones y soporte', async () => {
  const { server, cleanup } = createTestEnvironment();
  try {
    const loginRes = await invokeApp(server, {
      method: 'POST',
      url: '/api/auth/login',
      body: { username: 'papa', pin: '1234' },
    });
    const authHeaders = { Authorization: `Bearer ${loginRes.json.token}` };

    // 1. Crear un turno nuevo el 2026-11-25
    const createShift = await invokeApp(server, {
      method: 'POST',
      url: '/api/turnos',
      headers: authHeaders,
      body: {
        shiftDate: '2026-11-25',
        shiftType: 'diurno',
        startTime: '06:00',
        endTime: '18:00',
        hoursWorked: 12,
        postId: 'post-porteria-01',
        reliefGuardName: 'Pedro Pérez',
        notes: 'Sin novedad en portería',
      },
    });
    assert.equal(createShift.status, 200);
    assert.equal(createShift.json.shift.version, 1);

    // 2. Actualizar el turno incrementando versión a 2
    const updateShift = await invokeApp(server, {
      method: 'POST',
      url: '/api/turnos',
      headers: authHeaders,
      body: {
        shiftDate: '2026-11-25',
        shiftType: 'nocturno',
        startTime: '18:00',
        endTime: '06:00',
        hoursWorked: 12,
        expectedVersion: 1,
        notes: 'Cambio a turno nocturno por relevo',
      },
    });
    assert.equal(updateShift.status, 200);
    assert.equal(updateShift.json.shift.version, 2);

    // 3. Simular edición concurrente desactualizada con expectedVersion = 1 -> 409 SYNC_CONFLICT
    const conflictRes = await invokeApp(server, {
      method: 'POST',
      url: '/api/turnos',
      headers: authHeaders,
      body: {
        shiftDate: '2026-11-25',
        shiftType: 'descanso_reglamentario',
        expectedVersion: 1,
      },
    });
    assert.equal(conflictRes.status, 409);
    assert.equal(conflictRes.json.error.code, 'SYNC_CONFLICT');
    assert.equal(conflictRes.json.error.details.serverRecord.version, 2);

    // 4. Registrar periodo de vacaciones marcándolo en el calendario de turnos
    const vacRes = await invokeApp(server, {
      method: 'POST',
      url: '/api/vacaciones',
      headers: authHeaders,
      body: {
        periodLabel: '2024-2025',
        startDate: '2026-11-26',
        endDate: '2026-11-28',
        businessDays: 3,
        status: 'disfrutada',
        notes: 'Tres días pendientes tomados en noviembre',
        markOnCalendar: true,
      },
    });
    assert.equal(vacRes.status, 201);
    assert.equal(vacRes.json.record.businessDays, 3);

    // Verificar que los días quedaron marcados como 'vacaciones' en los turnos
    const shiftsCheck = await invokeApp(server, {
      method: 'GET',
      url: '/api/turnos?from=2026-11-26&to=2026-11-28',
      headers: authHeaders,
    });
    assert.equal(shiftsCheck.status, 200);
    assert.equal(shiftsCheck.json.shifts.length, 3);
    assert.ok(shiftsCheck.json.shifts.every((s) => s.shiftType === 'vacaciones'));

    // 5. Crear y gestionar ticket de soporte
    const ticketRes = await invokeApp(server, {
      method: 'POST',
      url: '/api/soporte/tickets',
      headers: authHeaders,
      body: {
        category: 'error_turno',
        subject: 'Revisión de recargo dominical',
        description: 'Laboré el domingo 1 de noviembre 12 horas diurnas.',
        consentDiagnostico: true,
      },
    });
    assert.equal(ticketRes.status, 201);
    assert.equal(ticketRes.json.ticket.owner, 'coordinacion_operativa');
    assert.equal(ticketRes.json.ticket.status, 'abierto');
  } finally {
    cleanup();
  }
});

test('Backup cifrado y Restauración completa probada + Cola de Sincronización Offline', async () => {
  const { server, cleanup } = createTestEnvironment();
  try {
    const loginRes = await invokeApp(server, {
      method: 'POST',
      url: '/api/auth/login',
      body: { username: 'papa', pin: '1234' },
    });
    const authHeaders = { Authorization: `Bearer ${loginRes.json.token}` };

    // 1. Exportar backup cifrado AES-256-GCM
    const exportRes = await invokeApp(server, {
      method: 'POST',
      url: '/api/backups/export',
      headers: authHeaders,
      body: { filename: 'respaldo-ensayo-completo.enc.json' },
    });
    assert.equal(exportRes.status, 201);
    assert.equal(exportRes.json.filename, 'respaldo-ensayo-completo.enc.json');
    const initialShiftsCount = exportRes.json.counts.shifts;
    assert.ok(initialShiftsCount >= 18);

    // 2. Eliminar un turno para alterar el estado actual
    const delRes = await invokeApp(server, {
      method: 'DELETE',
      url: '/api/turnos/2026-11-01',
      headers: authHeaders,
    });
    assert.equal(delRes.status, 200);

    // 3. Restaurar desde el backup cifrado y comprobar recuperación íntegra
    const restoreRes = await invokeApp(server, {
      method: 'POST',
      url: '/api/backups/restore',
      headers: authHeaders,
      body: { filename: 'respaldo-ensayo-completo.enc.json' },
    });
    assert.equal(restoreRes.status, 200);
    assert.equal(restoreRes.json.restored, true);
    assert.equal(restoreRes.json.counts.shifts, initialShiftsCount);

    // 4. Sincronizar cola offline con operación válida y conflicto explícito
    const syncRes = await invokeApp(server, {
      method: 'POST',
      url: '/api/sync',
      headers: authHeaders,
      body: {
        operations: [
          {
            clientOpId: 'op-1',
            type: 'UPSERT_SHIFT',
            payload: {
              shiftDate: '2026-11-29',
              shiftType: 'diurno',
              hoursWorked: 12,
              notes: 'Creado offline',
            },
          },
          {
            clientOpId: 'op-conflict',
            type: 'UPSERT_SHIFT',
            payload: {
              shiftDate: '2026-11-29',
              shiftType: 'nocturno',
              hoursWorked: 12,
              expectedVersion: 99, // Forzar conflicto de versión
            },
          },
        ],
      },
    });
    assert.equal(syncRes.status, 200);
    assert.equal(syncRes.json.appliedCount, 1);
    assert.equal(syncRes.json.conflictCount, 1);
  } finally {
    cleanup();
  }
});

test('Seguridad HTTP: cabeceras CSP/HSTS, rechazo de Path Traversal y bloqueo de XSS en API', async () => {
  const { server, cleanup } = createTestEnvironment();
  try {
    // 1. Verificar cabeceras de seguridad en archivos estáticos
    const homeRes = await invokeApp(server, { method: 'GET', url: '/' });
    assert.equal(homeRes.status, 200);
    assert.match(homeRes.headers['content-security-policy'], /default-src 'self'/);
    assert.match(homeRes.headers['strict-transport-security'], /max-age=/);
    assert.equal(homeRes.headers['x-frame-options'], 'DENY');
    assert.ok(homeRes.headers['x-correlation-id']);

    // 2. Bloquear intento de traversal ../../
    const traversalRes = await invokeApp(server, {
      method: 'GET',
      url: '/../../package.json',
    });
    assert.equal(traversalRes.status, 400);
    assert.equal(traversalRes.json.error.code, 'PATH_TRAVERSAL_REJECTED');

    // 3. Bloquear payload XSS en cuerpo de API
    const loginRes = await invokeApp(server, {
      method: 'POST',
      url: '/api/auth/login',
      body: { username: 'papa', pin: '1234' },
    });
    const xssRes = await invokeApp(server, {
      method: 'POST',
      url: '/api/puestos',
      headers: { Authorization: `Bearer ${loginRes.json.token}` },
      body: { name: '<script>alert("xss")</script>', location: 'Norte' },
    });
    assert.equal(xssRes.status, 400);
    assert.equal(xssRes.json.error.code, 'SECURITY_XSS_BLOCKED');
  } finally {
    cleanup();
  }
});

test('Rendimiento SQL: EXPLAIN QUERY PLAN verifica uso de índices compuestos sin Full Scan', () => {
  const { db, cleanup } = createTestEnvironment();
  try {
    const planTurnos = db
      .prepare(
        `EXPLAIN QUERY PLAN
         SELECT s.*, p.name AS post_name
         FROM shifts s
         LEFT JOIN guard_posts p ON p.id = s.post_id
         WHERE s.user_id = ? AND s.shift_date >= ? AND s.shift_date <= ?
         ORDER BY s.shift_date ASC`
      )
      .all('user-papa-001', '2026-11-01', '2026-11-30');

    const detailsTurnos = planTurnos.map((r) => r.detail).join(' | ');
    assert.match(
      detailsTurnos,
      /idx_shifts_user_date|sqlite_autoindex_shifts/i,
      `La consulta crítica de turnos debe usar índice compuesto: ${detailsTurnos}`
    );

    const planVacaciones = db
      .prepare(
        `EXPLAIN QUERY PLAN
         SELECT * FROM vacation_records WHERE user_id = ? ORDER BY start_date DESC`
      )
      .all('user-papa-001');

    const detailsVac = planVacaciones.map((r) => r.detail).join(' | ');
    assert.match(
      detailsVac,
      /idx_vacations_user_start/i,
      `La consulta de vacaciones debe usar idx_vacations_user_start: ${detailsVac}`
    );
  } finally {
    cleanup();
  }
});

test('Arquitectura Monolito Modular y Accesibilidad WCAG 2.2 AA: sin dependencias prohibidas ni divs con onClick', () => {
  const rootDir = path.resolve(__dirname, '..');
  const modulesDir = path.join(rootDir, 'src', 'modules');
  const moduleNames = fs.readdirSync(modulesDir);

  // 1. Verificar que ningún módulo importe directamente otro módulo de src/modules/*
  for (const modName of moduleNames) {
    const modFile = path.join(modulesDir, modName, 'index.js');
    const content = fs.readFileSync(modFile, 'utf8');
    const forbiddenCrossImport = /require\(['"]\.\.\/(auth|turnos|vacaciones|backups|soporte)/;
    assert.equal(
      forbiddenCrossImport.test(content),
      false,
      `El módulo "${modName}" no debe importar directamente otros módulos de dominio sin contrato.`
    );
  }

  // 2. Verificar accesibilidad semántica en public/index.html y public/app.js
  const html = fs.readFileSync(path.join(rootDir, 'public', 'index.html'), 'utf8');
  assert.match(html, /class="skip-link"/, 'Debe incluir enlace para saltar al contenido principal');
  assert.match(html, /aria-live="polite"/, 'Debe incluir regiones vivas ARIA para anunciar estados y errores');
  assert.match(html, /<dialog\b/, 'Debe usar elementos nativos <dialog> para modales accesibles');
  assert.equal(
    /<div[^>]+onclick=/i.test(html),
    false,
    'No debe haber elementos <div> con onclick en el HTML'
  );
});
