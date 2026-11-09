'use strict';

const crypto = require('node:crypto');
const { AppError } = require('../../shared/logger');
const { hashPin, verifyPin, sanitizeText } = require('../../shared/security');
const { parseISODate } = require('../../shared/holidays');

const VALID_ROLES = new Set(['guarda', 'supervisor']);
const VALID_PATTERNS = new Set(['2x2x2', '6x1', '4x2', 'diurno_fijo', 'nocturno_fijo']);

function createAuthModule(db, { sessionTtlHours = 168 } = {}) {
  function toPublicUser(row) {
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      hireDate: row.hire_date,
      vacationDaysPerYear: row.vacation_days_per_year,
      preferredPattern: row.preferred_pattern,
      notificationsEnabled: Boolean(row.notifications_enabled),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function createUser({
    id = crypto.randomUUID(),
    username,
    fullName,
    role = 'guarda',
    pin,
    hireDate = '2021-03-15',
    vacationDaysPerYear = 15,
    preferredPattern = '2x2x2',
    notificationsEnabled = true,
  }) {
    const cleanUsername = sanitizeText(username, { maxLength: 40, fieldName: 'usuario' }).toLowerCase();
    const cleanName = sanitizeText(fullName, { maxLength: 100, fieldName: 'nombre completo' });

    if (cleanUsername.length < 2) {
      throw new AppError('AUTH_INVALID_USERNAME', 'El nombre de usuario debe tener al menos 2 caracteres.', 400);
    }
    if (cleanName.length < 2) {
      throw new AppError('AUTH_INVALID_NAME', 'El nombre completo debe tener al menos 2 caracteres.', 400);
    }
    if (!VALID_ROLES.has(role)) {
      throw new AppError('AUTH_INVALID_ROLE', 'Rol de usuario no válido.', 400);
    }
    if (!pin || String(pin).trim().length < 4) {
      throw new AppError('AUTH_INVALID_PIN', 'El PIN de acceso debe tener al menos 4 dígitos.', 400);
    }
    if (!parseISODate(hireDate)) {
      throw new AppError('AUTH_INVALID_HIRE_DATE', 'La fecha de ingreso debe tener formato YYYY-MM-DD válido.', 400);
    }

    const now = new Date().toISOString();
    const pinHash = hashPin(String(pin).trim());

    db.prepare(
      `INSERT INTO users (
        id, username, full_name, role, pin_hash, hire_date,
        vacation_days_per_year, preferred_pattern, notifications_enabled,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      cleanUsername,
      cleanName,
      role,
      pinHash,
      hireDate,
      Number(vacationDaysPerYear) || 15,
      VALID_PATTERNS.has(preferredPattern) ? preferredPattern : '2x2x2',
      notificationsEnabled ? 1 : 0,
      now,
      now
    );

    return getUserById(id);
  }

  function getUserById(userId) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    return toPublicUser(row);
  }

  function listUsers() {
    const rows = db.prepare('SELECT * FROM users ORDER BY full_name ASC').all();
    return rows.map(toPublicUser);
  }

  function login({ username, pin }) {
    const cleanUsername = sanitizeText(username || '', { maxLength: 40, fieldName: 'usuario' }).toLowerCase();
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);
    if (!row || !verifyPin(String(pin || '').trim(), row.pin_hash)) {
      throw new AppError(
        'AUTH_INVALID_CREDENTIALS',
        'Usuario o PIN incorrecto. Verifique sus datos e intente nuevamente.',
        401
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expires = new Date(now.getTime() + sessionTtlHours * 3600 * 1000);

    db.prepare(
      'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
    ).run(token, row.id, now.toISOString(), expires.toISOString());

    return {
      token,
      expiresAt: expires.toISOString(),
      user: toPublicUser(row),
    };
  }

  function logout(token) {
    if (!token) return;
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  function authenticateToken(token) {
    if (!token || typeof token !== 'string') {
      throw new AppError('AUTH_REQUIRED', 'Debe iniciar sesión para acceder a este recurso.', 401);
    }
    const session = db
      .prepare('SELECT token, user_id, expires_at FROM sessions WHERE token = ?')
      .get(token);

    if (!session) {
      throw new AppError('AUTH_SESSION_INVALID', 'La sesión no es válida o ha cerrado.', 401);
    }
    if (new Date(session.expires_at) <= new Date()) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      throw new AppError('AUTH_SESSION_EXPIRED', 'Su sesión ha expirado. Inicie sesión nuevamente.', 401);
    }

    const user = getUserById(session.user_id);
    if (!user) {
      throw new AppError('AUTH_USER_NOT_FOUND', 'El usuario asociado a la sesión no existe.', 401);
    }
    return user;
  }

  function requireRole(user, allowedRoles) {
    if (!user) {
      throw new AppError('AUTH_REQUIRED', 'Debe iniciar sesión.', 401);
    }
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(user.role)) {
      throw new AppError(
        'AUTH_FORBIDDEN',
        `Permiso denegado: esta acción requiere rol (${roles.join(' o ')}).`,
        403
      );
    }
    return true;
  }

  function updateUserProfile(userId, payload) {
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existing) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado.', 404);
    }

    const fullName =
      payload.fullName !== undefined
        ? sanitizeText(payload.fullName, { maxLength: 100, fieldName: 'nombre completo' })
        : existing.full_name;

    if (fullName.length < 2) {
      throw new AppError('AUTH_INVALID_NAME', 'El nombre completo debe tener al menos 2 caracteres.', 400);
    }

    const hireDate = payload.hireDate !== undefined ? String(payload.hireDate).trim() : existing.hire_date;
    if (!parseISODate(hireDate)) {
      throw new AppError('AUTH_INVALID_HIRE_DATE', 'La fecha de ingreso no es válida (use YYYY-MM-DD).', 400);
    }

    const vacationDaysPerYear =
      payload.vacationDaysPerYear !== undefined
        ? Number.parseInt(payload.vacationDaysPerYear, 10)
        : existing.vacation_days_per_year;

    if (!Number.isInteger(vacationDaysPerYear) || vacationDaysPerYear < 1 || vacationDaysPerYear > 60) {
      throw new AppError(
        'VALIDATION_VACATION_DAYS',
        'Los días de vacaciones por año deben estar entre 1 y 60.',
        400
      );
    }

    const preferredPattern =
      payload.preferredPattern !== undefined ? payload.preferredPattern : existing.preferred_pattern;

    if (!VALID_PATTERNS.has(preferredPattern)) {
      throw new AppError('VALIDATION_PATTERN', 'El patrón de programación seleccionado no es válido.', 400);
    }

    const notificationsEnabled =
      payload.notificationsEnabled !== undefined
        ? payload.notificationsEnabled
          ? 1
          : 0
        : existing.notifications_enabled;

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE users
       SET full_name = ?, hire_date = ?, vacation_days_per_year = ?,
           preferred_pattern = ?, notifications_enabled = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      fullName,
      hireDate,
      vacationDaysPerYear,
      preferredPattern,
      notificationsEnabled,
      now,
      userId
    );

    return getUserById(userId);
  }

  return {
    createUser,
    getUserById,
    listUsers,
    login,
    logout,
    authenticateToken,
    requireRole,
    updateUserProfile,
  };
}

module.exports = { createAuthModule };
