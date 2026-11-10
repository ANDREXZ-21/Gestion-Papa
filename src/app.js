'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const {
  createCorrelationId,
  log,
  AppError,
} = require('./shared/logger');
const { resolveSafePath } = require('./shared/security');
const { obtenerFestivosAnio } = require('./shared/holidays');
const { createAuthModule } = require('./modules/auth');
const { PATRONES_SEGURIDAD, createTurnosModule } = require('./modules/turnos');
const { createVacacionesModule } = require('./modules/vacaciones');
const { createBackupsModule } = require('./modules/backups');
const { createSoporteModule } = require('./modules/soporte');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function setSecurityHeaders(res, correlationId) {
  res.setHeader('X-Correlation-Id', correlationId);
  res.setHeader('Content-Security-Policy', CSP_HEADER);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
}

function sendJson(res, statusCode, payload, correlationId) {
  setSecurityHeaders(res, correlationId);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req, maxBytes = 512 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    let received = 0;

    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > maxBytes) {
        reject(new AppError('PAYLOAD_TOO_LARGE', 'El tamaño de los datos enviados supera el límite permitido.', 413));
        req.destroy();
        return;
      }
      body += chunk.toString('utf8');
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new AppError('INVALID_JSON', 'El cuerpo de la petición no es un JSON válido.', 400));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function extractAuthToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const tokenHeader = req.headers['x-session-token'];
  if (typeof tokenHeader === 'string' && tokenHeader.trim()) {
    return tokenHeader.trim();
  }
  return null;
}

function createApp(db, appConfig) {
  const publicDir = path.join(appConfig.rootDir, 'public');
  const authModule = createAuthModule(db, { sessionTtlHours: appConfig.sessionTtlHours });
  const turnosModule = createTurnosModule(db);
  const vacacionesModule = createVacacionesModule(db);
  const soporteModule = createSoporteModule(db);
  const backupsModule = createBackupsModule(db, {
    backupDir: appConfig.backupDir,
    appSecret: appConfig.appSecret,
    turnosModule,
    vacacionesModule,
  });

  const server = http.createServer(async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || createCorrelationId();
    const startTime = Date.now();

    try {
      const rawUrl = req.url || '/';
      // Detect raw path traversal sequences before URL normalization strips them
      const rawPathPart = decodeURIComponent(rawUrl.split('?')[0]);
      if (rawPathPart.includes('..') || rawPathPart.includes('\0') || rawPathPart.includes('\\')) {
        throw new AppError(
          'PATH_TRAVERSAL_REJECTED',
          'Acceso denegado: secuencia de ruta no permitida.',
          400
        );
      }

      const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;
      const method = req.method || 'GET';

      // =========================================================
      // RUTAS DE API (/api/*)
      // =========================================================
      if (pathname.startsWith('/api/')) {
        if (pathname === '/api/health' && method === 'GET') {
          return sendJson(
            res,
            200,
            {
              status: 'ok',
              service: 'gestion-trabajo-papa',
              timestamp: new Date().toISOString(),
              correlationId,
            },
            correlationId
          );
        }

        if (pathname === '/api/auth/login' && method === 'POST') {
          const body = await readJsonBody(req);
          const session = authModule.login(body);
          log('INFO', 'AUTH_LOGIN_SUCCESS', 'Inicio de sesión exitoso', {
            correlationId,
            username: session.user.username,
            role: session.user.role,
            pin: body.pin, // Será redactado automáticamente por logger
          });
          return sendJson(res, 200, session, correlationId);
        }

        // A partir de aquí, cada endpoint requiere autenticación
        const token = extractAuthToken(req);
        const currentUser = authModule.authenticateToken(token);

        if (pathname === '/api/auth/logout' && method === 'POST') {
          authModule.logout(token);
          return sendJson(res, 200, { loggedOut: true }, correlationId);
        }

        if (pathname === '/api/auth/me' && method === 'GET') {
          return sendJson(res, 200, { user: currentUser }, correlationId);
        }

        if (pathname === '/api/auth/profile' && method === 'PUT') {
          const body = await readJsonBody(req);
          const updated = authModule.updateUserProfile(currentUser.id, body);
          return sendJson(res, 200, { user: updated }, correlationId);
        }

        // Endpoint exclusivo para rol supervisor (prueba RBAC)
        if (pathname === '/api/admin/users' && method === 'GET') {
          authModule.requireRole(currentUser, ['supervisor']);
          return sendJson(res, 200, { users: authModule.listUsers() }, correlationId);
        }

        // Festivos de un año
        if (pathname === '/api/festivos' && method === 'GET') {
          const year = Number.parseInt(
            parsedUrl.searchParams.get('year') || String(new Date().getFullYear()),
            10
          );
          const mapa = obtenerFestivosAnio(year);
          const festivos = Array.from(mapa.entries()).map(([date, name]) => ({ date, name }));
          return sendJson(res, 200, { year, festivos }, correlationId);
        }

        // Puestos de vigilancia y patrones
        if (pathname === '/api/puestos' && method === 'GET') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const patrones = Object.entries(PATRONES_SEGURIDAD).map(([id, cfg]) => ({
            id,
            nombre: cfg.nombre,
          }));
          return sendJson(
            res,
            200,
            {
              posts: turnosModule.listGuardPosts(),
              patterns: patrones,
            },
            correlationId
          );
        }

        if (pathname === '/api/puestos' && method === 'POST') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const body = await readJsonBody(req);
          const created = turnosModule.createGuardPost(body);
          return sendJson(res, 201, { post: created }, correlationId);
        }

        // Turnos y resumen
        if (pathname === '/api/turnos' && method === 'GET') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const fromDate = parsedUrl.searchParams.get('from') || undefined;
          const toDate = parsedUrl.searchParams.get('to') || undefined;
          const cutoffDate = parsedUrl.searchParams.get('cutoff') || undefined;
          const shifts = turnosModule.listShifts({
            userId: currentUser.id,
            fromDate,
            toDate,
          });
          const summary = turnosModule.getShiftsSummary(currentUser.id, {
            fromDate,
            toDate,
            cutoffDate,
          });
          return sendJson(res, 200, { shifts, summary }, correlationId);
        }

        if (pathname === '/api/turnos' && method === 'POST') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const body = await readJsonBody(req);
          const shift = turnosModule.upsertShift(currentUser.id, body, {
            actor: currentUser.username,
          });
          const summary = turnosModule.getShiftsSummary(currentUser.id, {
            fromDate: body.fromDate,
            toDate: body.toDate,
            cutoffDate: body.cutoffDate,
          });
          return sendJson(res, 200, { shift, summary }, correlationId);
        }

        if (pathname === '/api/turnos/patron' && method === 'POST') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const body = await readJsonBody(req);
          const shifts = turnosModule.applyPatternSchedule(currentUser.id, body, {
            actor: currentUser.username,
          });
          const summary = turnosModule.getShiftsSummary(currentUser.id, {
            cutoffDate: body.cutoffDate,
          });
          return sendJson(res, 200, { shifts, count: shifts.length, summary }, correlationId);
        }

        if (pathname.startsWith('/api/turnos/') && method === 'DELETE') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const shiftDate = pathname.replace('/api/turnos/', '').trim();
          const result = turnosModule.deleteShift(currentUser.id, shiftDate);
          return sendJson(res, 200, result, correlationId);
        }

        // Vacaciones
        if (pathname === '/api/vacaciones' && method === 'GET') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const refDate = parsedUrl.searchParams.get('refDate') || undefined;
          const dashboard = vacacionesModule.getVacationDashboard(currentUser.id, refDate);
          return sendJson(res, 200, dashboard, correlationId);
        }

        if (pathname === '/api/vacaciones' && method === 'POST') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const body = await readJsonBody(req);
          const record = vacacionesModule.createVacationRecord(currentUser.id, body);
          const dashboard = vacacionesModule.getVacationDashboard(currentUser.id);
          return sendJson(res, 201, { record, ...dashboard }, correlationId);
        }

        if (pathname.startsWith('/api/vacaciones/') && method === 'DELETE') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const recordId = pathname.replace('/api/vacaciones/', '').trim();
          const result = vacacionesModule.deleteVacationRecord(currentUser.id, recordId);
          const dashboard = vacacionesModule.getVacationDashboard(currentUser.id);
          return sendJson(res, 200, { ...result, ...dashboard }, correlationId);
        }

        // Backups y Sincronización Offline
        if (pathname === '/api/backups' && method === 'GET') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const files = backupsModule.listSavedBackups();
          return sendJson(res, 200, { backups: files }, correlationId);
        }

        if (pathname === '/api/backups/export' && method === 'POST') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const body = await readJsonBody(req);
          const created = backupsModule.createEncryptedBackup(currentUser.id, body.filename);
          return sendJson(res, 201, created, correlationId);
        }

        if (pathname === '/api/backups/restore' && method === 'POST') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const body = await readJsonBody(req);
          const envelope = body.filename
            ? backupsModule.readBackupFile(body.filename)
            : body.envelope;
          const restored = backupsModule.restoreEncryptedBackup(currentUser.id, envelope);
          return sendJson(res, 200, restored, correlationId);
        }

        if (pathname === '/api/sync' && method === 'POST') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const body = await readJsonBody(req);
          const syncResult = backupsModule.syncOfflineOperations(
            currentUser.id,
            body.operations || []
          );
          return sendJson(res, 200, syncResult, correlationId);
        }

        // Soporte y Feedback
        if (pathname === '/api/soporte/tickets' && method === 'GET') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const data = soporteModule.listTickets(currentUser.id, {
            includeAllForSupervisor: currentUser.role === 'supervisor',
          });
          return sendJson(res, 200, data, correlationId);
        }

        if (pathname === '/api/soporte/tickets' && method === 'POST') {
          authModule.requireRole(currentUser, ['guarda', 'supervisor']);
          const body = await readJsonBody(req);
          const ticket = soporteModule.createTicket(currentUser.id, body);
          return sendJson(res, 201, { ticket }, correlationId);
        }

        if (
          pathname.startsWith('/api/soporte/tickets/') &&
          pathname.endsWith('/status') &&
          method === 'PATCH'
        ) {
          authModule.requireRole(currentUser, ['supervisor']);
          const parts = pathname.split('/');
          const ticketId = parts[4];
          const body = await readJsonBody(req);
          const updated = soporteModule.updateTicketStatus(ticketId, body.status);
          return sendJson(res, 200, { ticket: updated }, correlationId);
        }

        throw new AppError('ENDPOINT_NOT_FOUND', `Ruta de API no encontrada: ${method} ${pathname}`, 404);
      }

      // =========================================================
      // ARCHIVOS ESTÁTICOS FRONTEND (PWA)
      // =========================================================
      const relativeFile = pathname === '/' ? 'index.html' : pathname.slice(1);
      const safeFilePath = resolveSafePath(publicDir, relativeFile);

      if (!fs.existsSync(safeFilePath) || fs.statSync(safeFilePath).isDirectory()) {
        throw new AppError('STATIC_NOT_FOUND', 'El archivo solicitado no existe.', 404);
      }

      const ext = path.extname(safeFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      setSecurityHeaders(res, correlationId);
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.end(fs.readFileSync(safeFilePath));
    } catch (err) {
      const isAppError = err instanceof AppError || Boolean(err.code && err.statusCode);
      const statusCode = isAppError ? err.statusCode : 500;
      const errorCode = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
      const userMessage = isAppError
        ? err.userMessage
        : 'Ocurrió un problema inesperado en el servidor. Intente de nuevo.';

      log(statusCode >= 500 ? 'ERROR' : 'WARN', errorCode, userMessage, {
        correlationId,
        method: req.method,
        url: req.url,
        statusCode,
        durationMs: Date.now() - startTime,
      });

      sendJson(
        res,
        statusCode,
        {
          error: {
            code: errorCode,
            message: userMessage,
            details: isAppError ? err.details : null,
            correlationId,
          },
        },
        correlationId
      );
    }
  });

  return {
    server,
    modules: {
      auth: authModule,
      turnos: turnosModule,
      vacaciones: vacacionesModule,
      backups: backupsModule,
      soporte: soporteModule,
    },
  };
}

module.exports = { createApp };
