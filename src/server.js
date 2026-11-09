'use strict';

const { config } = require('./shared/config');
const { openDatabase } = require('./shared/database');
const { seedDatabase } = require('./shared/seed');
const { createApp } = require('./app');
const { log } = require('./shared/logger');

function startServer() {
  const db = openDatabase(config.dbPath);
  seedDatabase(db);

  const { server } = createApp(db, config);

  server.listen(config.port, config.host, () => {
    log('INFO', 'SERVER_STARTED', `Servidor iniciado en http://${config.host}:${config.port}`, {
      port: config.port,
      host: config.host,
      env: config.env,
    });
  });

  const shutdown = () => {
    log('INFO', 'SERVER_STOPPING', 'Cerrando servidor y base de datos...');
    server.close(() => {
      db.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { server, db };
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
