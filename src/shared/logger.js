'use strict';

const crypto = require('node:crypto');

const SENSITIVE_KEYS = new Set([
  'pin',
  'password',
  'secret',
  'token',
  'session_token',
  'authorization',
  'cookie',
  'clave',
  'pin_hash',
]);

function redactSensitive(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map(redactSensitive);
  }
  if (typeof value === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        clean[k] = '[REDACTED]';
      } else {
        clean[k] = redactSensitive(v);
      }
    }
    return clean;
  }
  return value;
}

function createCorrelationId() {
  return crypto.randomUUID();
}

function log(level, code, message, context = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    code,
    message,
    correlationId: context.correlationId || 'system',
    context: redactSensitive(context),
  };
  if (process.env.NODE_ENV !== 'test') {
    const stream = level === 'ERROR' ? process.stderr : process.stdout;
    if (stream && typeof stream.write === 'function') {
      try {
        stream.write(JSON.stringify(entry) + '\n');
      } catch {
        // Ignorar errores de escritura cuando se ejecuta como aplicación GUI sin consola en Windows
      }
    }
  }
  return entry;
}

class AppError extends Error {
  constructor(code, userMessage, statusCode = 400, details = null) {
    super(userMessage);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = {
  redactSensitive,
  createCorrelationId,
  log,
  AppError,
};
