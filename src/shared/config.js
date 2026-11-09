'use strict';

const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '127.0.0.1',
  rootDir: ROOT_DIR,
  dbPath: process.env.DB_PATH
    ? path.resolve(ROOT_DIR, process.env.DB_PATH)
    : path.join(ROOT_DIR, 'data', 'gestion_papa.sqlite'),
  backupDir: process.env.BACKUP_DIR
    ? path.resolve(ROOT_DIR, process.env.BACKUP_DIR)
    : path.join(ROOT_DIR, 'backups'),
  appSecret:
    process.env.APP_SECRET ||
    'clave-secreta-desarrollo-cambiar-en-produccion-2026',
  sessionTtlHours: 24 * 7,
};

module.exports = { config };
