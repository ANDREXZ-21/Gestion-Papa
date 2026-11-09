'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const { AppError } = require('../../shared/logger');
const {
  encryptPayload,
  decryptPayload,
  resolveSafePath,
} = require('../../shared/security');
const { withTransaction } = require('../../shared/database');

function createBackupsModule(db, { backupDir, appSecret, turnosModule, vacacionesModule }) {
  function ensureBackupDir() {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
  }

  function exportUserSnapshot(userId) {
    const user = db
      .prepare(
        `SELECT id, username, full_name, role, hire_date, vacation_days_per_year,
                preferred_pattern, notifications_enabled, created_at, updated_at
         FROM users WHERE id = ?`
      )
      .get(userId);

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado para respaldo.', 404);
    }

    const guardPosts = db.prepare('SELECT * FROM guard_posts ORDER BY name ASC').all();
    const shifts = db
      .prepare('SELECT * FROM shifts WHERE user_id = ? ORDER BY shift_date ASC')
      .all(userId);
    const vacations = db
      .prepare('SELECT * FROM vacation_records WHERE user_id = ? ORDER BY start_date DESC')
      .all(userId);

    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      rpoTarget: '24h / por cambio',
      rtoTarget: '< 5 minutos',
      user,
      guardPosts,
      shifts,
      vacations,
    };
  }

  function createEncryptedBackup(userId, customFilename = null) {
    ensureBackupDir();
    const snapshot = exportUserSnapshot(userId);
    const envelope = encryptPayload(snapshot, appSecret);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = customFilename
      ? String(customFilename).trim()
      : `backup-${snapshot.user.username}-${timestamp}.enc.json`;

    const safeFilePath = resolveSafePath(backupDir, filename);
    fs.writeFileSync(safeFilePath, JSON.stringify(envelope, null, 2), 'utf8');

    return {
      filename,
      createdAt: snapshot.exportedAt,
      counts: {
        guardPosts: snapshot.guardPosts.length,
        shifts: snapshot.shifts.length,
        vacations: snapshot.vacations.length,
      },
      envelope,
    };
  }

  function readBackupFile(filename) {
    ensureBackupDir();
    const safeFilePath = resolveSafePath(backupDir, filename);
    if (!fs.existsSync(safeFilePath)) {
      throw new AppError('BACKUP_FILE_NOT_FOUND', 'El archivo de respaldo solicitado no existe.', 404);
    }
    const raw = fs.readFileSync(safeFilePath, 'utf8');
    return JSON.parse(raw);
  }

  function listSavedBackups() {
    ensureBackupDir();
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith('.enc.json'))
      .sort()
      .reverse();

    return files.map((filename) => {
      const safeFilePath = resolveSafePath(backupDir, filename);
      const stat = fs.statSync(safeFilePath);
      return {
        filename,
        sizeBytes: stat.size,
        updatedAt: stat.mtime.toISOString(),
      };
    });
  }

  function restoreEncryptedBackup(userId, envelope) {
    const snapshot = decryptPayload(envelope, appSecret);
    if (!snapshot || snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.shifts)) {
      throw new AppError(
        'BACKUP_SCHEMA_INVALID',
        'El contenido del respaldo no corresponde a un esquema válido v1.',
        400
      );
    }

    return withTransaction(db, () => {
      // Restaurar puestos de vigilancia referenciados
      const insertPost = db.prepare(
        `INSERT OR IGNORE INTO guard_posts (id, name, location, active, created_at)
         VALUES (?, ?, ?, ?, ?)`
      );
      for (const post of snapshot.guardPosts || []) {
        insertPost.run(
          post.id,
          post.name,
          post.location || '',
          post.active ?? 1,
          post.created_at || new Date().toISOString()
        );
      }

      // Actualizar configuración laboral del usuario
      if (snapshot.user) {
        db.prepare(
          `UPDATE users
           SET hire_date = ?, vacation_days_per_year = ?, preferred_pattern = ?, updated_at = ?
           WHERE id = ?`
        ).run(
          snapshot.user.hire_date,
          snapshot.user.vacation_days_per_year || 15,
          snapshot.user.preferred_pattern || '2x2x2',
          new Date().toISOString(),
          userId
        );
      }

      // Reemplazar turnos del usuario con los del respaldo
      db.prepare('DELETE FROM shifts WHERE user_id = ?').run(userId);
      const insertShift = db.prepare(
        `INSERT INTO shifts (
          id, user_id, shift_date, shift_type, start_time, end_time,
          hours_worked, post_id, relief_guard_name, is_holiday_or_sunday,
          generates_compensatory, notes, version, updated_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const s of snapshot.shifts) {
        insertShift.run(
          s.id || crypto.randomUUID(),
          userId,
          s.shift_date,
          s.shift_type,
          s.start_time || '06:00',
          s.end_time || '18:00',
          s.hours_worked ?? 12,
          s.post_id || null,
          s.relief_guard_name || '',
          s.is_holiday_or_sunday ? 1 : 0,
          s.generates_compensatory ? 1 : 0,
          s.notes || '',
          s.version || 1,
          s.updated_by || 'restore',
          s.created_at || new Date().toISOString(),
          new Date().toISOString()
        );
      }

      // Reemplazar registros de vacaciones del usuario
      db.prepare('DELETE FROM vacation_records WHERE user_id = ?').run(userId);
      const insertVacation = db.prepare(
        `INSERT INTO vacation_records (
          id, user_id, period_label, start_date, end_date,
          business_days, status, notes, version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const v of snapshot.vacations || []) {
        insertVacation.run(
          v.id || crypto.randomUUID(),
          userId,
          v.period_label,
          v.start_date,
          v.end_date,
          v.business_days,
          v.status || 'disfrutada',
          v.notes || '',
          v.version || 1,
          v.created_at || new Date().toISOString(),
          new Date().toISOString()
        );
      }

      return {
        restored: true,
        restoredAt: new Date().toISOString(),
        counts: {
          shifts: snapshot.shifts.length,
          vacations: (snapshot.vacations || []).length,
        },
      };
    });
  }

  /**
   * Procesa una cola de operaciones offline de forma idempotente,
   * reportando explícitamente los conflictos de versión sin perder cambios en silencio.
   */
  function syncOfflineOperations(userId, operations = []) {
    if (!Array.isArray(operations)) {
      throw new AppError('SYNC_INVALID_QUEUE', 'La cola de sincronización debe ser una lista de operaciones.', 400);
    }

    const applied = [];
    const conflicts = [];
    const errors = [];

    for (const op of operations) {
      const clientOpId = op.clientOpId || crypto.randomUUID();
      try {
        if (op.type === 'UPSERT_SHIFT') {
          const saved = turnosModule.upsertShift(userId, op.payload, { actor: 'sync_offline' });
          applied.push({ clientOpId, type: op.type, result: saved });
        } else if (op.type === 'DELETE_SHIFT') {
          const res = turnosModule.deleteShift(userId, op.payload.shiftDate);
          applied.push({ clientOpId, type: op.type, result: res });
        } else if (op.type === 'CREATE_VACATION') {
          const saved = vacacionesModule.createVacationRecord(userId, op.payload);
          applied.push({ clientOpId, type: op.type, result: saved });
        } else {
          errors.push({ clientOpId, code: 'SYNC_UNKNOWN_OP', message: `Operación desconocida: ${op.type}` });
        }
      } catch (err) {
        if (err.code === 'SYNC_CONFLICT') {
          conflicts.push({
            clientOpId,
            type: op.type,
            message: err.userMessage,
            details: err.details,
          });
        } else {
          errors.push({
            clientOpId,
            code: err.code || 'SYNC_OP_ERROR',
            message: err.userMessage || err.message,
          });
        }
      }
    }

    return {
      syncedAt: new Date().toISOString(),
      appliedCount: applied.length,
      conflictCount: conflicts.length,
      errorCount: errors.length,
      applied,
      conflicts,
      errors,
    };
  }

  return {
    exportUserSnapshot,
    createEncryptedBackup,
    readBackupFile,
    listSavedBackups,
    restoreEncryptedBackup,
    syncOfflineOperations,
  };
}

module.exports = { createBackupsModule };
