'use strict';

const fs = require('node:fs');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { config } = require('./shared/config');
const { openDatabase } = require('./shared/database');
const { seedDatabase } = require('./shared/seed');
const { createApp } = require('./app');
const { log } = require('./shared/logger');

function openPortableWindow(url) {
  if (process.platform !== 'win32' || process.env.NO_BROWSER === '1') {
    return;
  }

  const browserCandidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const exePath of browserCandidates) {
    if (fs.existsSync(exePath)) {
      try {
        const child = spawn(exePath, [`--app=${url}`, '--window-size=1280,840'], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        });
        child.unref();
        return;
      } catch {
        // Si falla este candidato, intenta el siguiente
      }
    }
  }

  try {
    const fallback = spawn('explorer.exe', [url], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    fallback.unref();
  } catch {
    // Ignorar si no es posible abrir ventana gráfica en entorno headless
  }
}

function checkExistingInstance(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: host === '0.0.0.0' ? '127.0.0.1' : host,
        port,
        path: '/api/health',
        timeout: 800,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startServer() {
  const db = openDatabase(config.dbPath);
  seedDatabase(db);

  const { server } = createApp(db, config);

  server.on('error', async (err) => {
    if (err && err.code === 'EADDRINUSE' && config.isPortableSea) {
      const alreadyRunning = await checkExistingInstance(config.port, config.host);
      if (alreadyRunning) {
        const displayHost = config.host === '0.0.0.0' ? '127.0.0.1' : config.host;
        openPortableWindow(`http://${displayHost}:${config.port}`);
        db.close();
        process.exit(0);
      }
    }
    log('ERROR', 'SERVER_LISTEN_ERROR', err.message || 'Error al iniciar servidor HTTP');
  });

  server.listen(config.port, config.host, () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : config.port;
    const displayHost = config.host === '0.0.0.0' ? '127.0.0.1' : config.host;
    const url = `http://${displayHost}:${actualPort}`;

    log('INFO', 'SERVER_STARTED', `Servidor iniciado en ${url}`, {
      port: actualPort,
      host: config.host,
      env: config.env,
      portable: Boolean(config.isPortableSea),
    });

    if (config.isPortableSea || process.env.AUTO_OPEN_UI === '1') {
      openPortableWindow(url);
    }
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
