'use strict';

const { config } = require('./config');
const { openDatabase } = require('./database');
const { seedDatabase } = require('./seed');
const { createTurnosModule } = require('../modules/turnos');
const { createVacacionesModule } = require('../modules/vacaciones');
const { createBackupsModule } = require('../modules/backups');

if (require.main === module) {
  const db = openDatabase(config.dbPath);
  seedDatabase(db);
  const turnosModule = createTurnosModule(db);
  const vacacionesModule = createVacacionesModule(db);
  const backups = createBackupsModule(db, {
    backupDir: config.backupDir,
    appSecret: config.appSecret,
    turnosModule,
    vacacionesModule,
  });

  const result = backups.createEncryptedBackup('user-papa-001');
  console.log('Respaldo cifrado creado exitosamente:', result.filename, result.counts);
  db.close();
}
