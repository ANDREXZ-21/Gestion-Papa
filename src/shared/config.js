'use strict';

const path = require('node:path');

let isSeaApp = false;
try {
  const sea = require('node:sea');
  isSeaApp = typeof sea.isSea === 'function' && sea.isSea();
} catch {
  isSeaApp = false;
}

const ROOT_DIR = isSeaApp
  ? path.dirname(process.execPath)
  : path.resolve(__dirname, '..', '..');

const config = {
  env: process.env.NODE_ENV || (isSeaApp ? 'production' : 'development'),
  port: Number.parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || (isSeaApp ? '127.0.0.1' : '0.0.0.0'),
  isPortableSea: isSeaApp,
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
