'use strict';

const crypto = require('node:crypto');
const path = require('node:path');
const { AppError } = require('./logger');

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
};

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"'/`]/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

const XSS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bon[a-z]+\s*=/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
  /<svg\b[^>]*onload/i,
];

function containsXssPayload(value) {
  if (typeof value !== 'string') return false;
  return XSS_PATTERNS.some((pattern) => pattern.test(value));
}

function sanitizeText(value, { maxLength = 500, fieldName = 'texto' } = {}) {
  if (value === null || value === undefined) return '';
  const trimmed = String(value).trim();
  if (trimmed.length > maxLength) {
    throw new AppError(
      'VALIDATION_MAX_LENGTH',
      `El campo "${fieldName}" supera el máximo permitido de ${maxLength} caracteres.`,
      400,
      { field: fieldName, maxLength }
    );
  }
  if (containsXssPayload(trimmed)) {
    throw new AppError(
      'SECURITY_XSS_BLOCKED',
      `El campo "${fieldName}" contiene código o etiquetas no permitidas por seguridad.`,
      400,
      { field: fieldName }
    );
  }
  return trimmed;
}

const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

function resolveSafePath(baseDir, relativeInput) {
  if (typeof relativeInput !== 'string' || !relativeInput.trim()) {
    throw new AppError('INVALID_PATH', 'Ruta de archivo inválida o vacía.', 400);
  }
  if (relativeInput.includes('\0')) {
    throw new AppError('INVALID_PATH_NULL', 'La ruta contiene caracteres nulos no permitidos.', 400);
  }
  const normalizedInput = relativeInput.replace(/\\/g, '/');
  if (
    normalizedInput.includes('../') ||
    normalizedInput.includes('/..') ||
    normalizedInput === '..' ||
    path.isAbsolute(relativeInput)
  ) {
    throw new AppError(
      'PATH_TRAVERSAL_REJECTED',
      'Acceso denegado: la ruta intenta salir del directorio permitido.',
      400
    );
  }

  const segments = normalizedInput.split('/').filter(Boolean);
  for (const seg of segments) {
    if (seg === '.' || seg === '..' || RESERVED_WINDOWS_NAMES.test(seg)) {
      throw new AppError(
        'INVALID_PATH_SEGMENT',
        'La ruta contiene un nombre de archivo reservado o no permitido.',
        400
      );
    }
  }

  const rootResolved = path.resolve(baseDir);
  const targetResolved = path.resolve(rootResolved, normalizedInput);
  const relative = path.relative(rootResolved, targetResolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new AppError(
      'PATH_TRAVERSAL_REJECTED',
      'Acceso denegado: la ruta queda fuera del directorio raíz permitido.',
      400
    );
  }

  return targetResolved;
}

function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(pin), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPin(pin, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  const derived = crypto.scryptSync(String(pin), salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function encryptPayload(plainObject, secretKey) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const json = JSON.stringify(plainObject);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    version: 1,
    algorithm: 'aes-256-gcm',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };
}

function decryptPayload(envelope, secretKey) {
  if (
    !envelope ||
    envelope.algorithm !== 'aes-256-gcm' ||
    !envelope.salt ||
    !envelope.iv ||
    !envelope.authTag ||
    !envelope.ciphertext
  ) {
    throw new AppError('BACKUP_INVALID_FORMAT', 'El archivo de respaldo cifrado no tiene un formato válido.', 400);
  }
  try {
    const salt = Buffer.from(envelope.salt, 'base64');
    const iv = Buffer.from(envelope.iv, 'base64');
    const authTag = Buffer.from(envelope.authTag, 'base64');
    const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
    const key = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    throw new AppError(
      'BACKUP_DECRYPT_FAILED',
      'No se pudo descifrar la copia de seguridad. Verifique la clave o integridad del archivo.',
      400
    );
  }
}

module.exports = {
  escapeHtml,
  containsXssPayload,
  sanitizeText,
  resolveSafePath,
  hashPin,
  verifyPin,
  encryptPayload,
  decryptPayload,
};
