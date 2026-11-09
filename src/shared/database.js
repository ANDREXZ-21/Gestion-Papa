'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE CHECK(length(trim(username)) >= 2),
  full_name TEXT NOT NULL CHECK(length(trim(full_name)) >= 2),
  role TEXT NOT NULL CHECK(role IN ('guarda', 'supervisor')),
  pin_hash TEXT NOT NULL,
  hire_date TEXT NOT NULL CHECK(hire_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  vacation_days_per_year INTEGER NOT NULL DEFAULT 15 CHECK(vacation_days_per_year BETWEEN 1 AND 60),
  preferred_pattern TEXT NOT NULL DEFAULT '2x2x2' CHECK(preferred_pattern IN ('2x2x2', '6x1', '4x2', 'diurno_fijo', 'nocturno_fijo')),
  notifications_enabled INTEGER NOT NULL DEFAULT 1 CHECK(notifications_enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS guard_posts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK(length(trim(name)) >= 2),
  location TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_date TEXT NOT NULL CHECK(shift_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  shift_type TEXT NOT NULL CHECK(shift_type IN (
    'diurno',
    'nocturno',
    'relevo',
    'descanso_reglamentario',
    'descanso_compensatorio',
    'permiso_incapacidad',
    'vacaciones'
  )),
  start_time TEXT NOT NULL DEFAULT '06:00' CHECK(start_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  end_time TEXT NOT NULL DEFAULT '18:00' CHECK(end_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  hours_worked REAL NOT NULL DEFAULT 12 CHECK(hours_worked >= 0 AND hours_worked <= 24),
  post_id TEXT REFERENCES guard_posts(id) ON DELETE SET NULL,
  relief_guard_name TEXT NOT NULL DEFAULT '',
  is_holiday_or_sunday INTEGER NOT NULL DEFAULT 0 CHECK(is_holiday_or_sunday IN (0, 1)),
  generates_compensatory INTEGER NOT NULL DEFAULT 0 CHECK(generates_compensatory IN (0, 1)),
  notes TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
  updated_by TEXT NOT NULL DEFAULT 'guarda',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, shift_date)
);

CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shifts(user_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_user_type ON shifts(user_id, shift_type);

CREATE TABLE IF NOT EXISTS vacation_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_label TEXT NOT NULL CHECK(length(trim(period_label)) >= 4),
  start_date TEXT NOT NULL CHECK(start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  end_date TEXT NOT NULL CHECK(end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  business_days INTEGER NOT NULL CHECK(business_days >= 1 AND business_days <= 90),
  status TEXT NOT NULL DEFAULT 'disfrutada' CHECK(status IN ('disfrutada', 'programada', 'pendiente_aprobacion')),
  notes TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK(end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_vacations_user_start ON vacation_records(user_id, start_date DESC);

CREATE TABLE IF NOT EXISTS feedback_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('error_turno', 'duda_vacaciones', 'sugerencia', 'soporte_tecnico')),
  subject TEXT NOT NULL CHECK(length(trim(subject)) >= 3),
  description TEXT NOT NULL CHECK(length(trim(description)) >= 5),
  status TEXT NOT NULL DEFAULT 'abierto' CHECK(status IN ('abierto', 'en_revision', 'resuelto')),
  owner TEXT NOT NULL DEFAULT 'mesa_ayuda',
  consent_diagnostico INTEGER NOT NULL DEFAULT 0 CHECK(consent_diagnostico IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON feedback_tickets(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

function openDatabase(dbPath) {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 5000;');
  }
  db.exec(SCHEMA_SQL);
  db.prepare(
    'INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (1, ?)'
  ).run(new Date().toISOString());
  return db;
}

function withTransaction(db, fn) {
  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // Ignore rollback errors if transaction already closed
    }
    throw err;
  }
}

module.exports = {
  openDatabase,
  withTransaction,
};
