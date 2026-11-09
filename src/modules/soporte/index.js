'use strict';

const crypto = require('node:crypto');
const { AppError } = require('../../shared/logger');
const { sanitizeText } = require('../../shared/security');

const VALID_CATEGORIES = new Set([
  'error_turno',
  'duda_vacaciones',
  'sugerencia',
  'soporte_tecnico',
]);

const VALID_STATUSES = new Set(['abierto', 'en_revision', 'resuelto']);

const OWNER_BY_CATEGORY = {
  error_turno: 'coordinacion_operativa',
  duda_vacaciones: 'talento_humano',
  sugerencia: 'equipo_producto',
  soporte_tecnico: 'mesa_ayuda',
};

function createSoporteModule(db) {
  function mapTicket(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      category: row.category,
      subject: row.subject,
      description: row.description,
      status: row.status,
      owner: row.owner,
      consentDiagnostico: Boolean(row.consent_diagnostico),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function createTicket(userId, payload) {
    const category = String(payload.category || 'sugerencia').trim();
    if (!VALID_CATEGORIES.has(category)) {
      throw new AppError(
        'FEEDBACK_INVALID_CATEGORY',
        'Seleccione una categoría válida (Error en turno, Duda de vacaciones, Sugerencia o Soporte técnico).',
        400,
        { field: 'category' }
      );
    }

    const subject = sanitizeText(payload.subject || '', {
      maxLength: 100,
      fieldName: 'asunto',
    });
    const description = sanitizeText(payload.description || '', {
      maxLength: 1000,
      fieldName: 'descripción',
    });

    if (subject.length < 3) {
      throw new AppError('FEEDBACK_SHORT_SUBJECT', 'El asunto debe tener al menos 3 caracteres.', 400, {
        field: 'subject',
      });
    }
    if (description.length < 5) {
      throw new AppError(
        'FEEDBACK_SHORT_DESCRIPTION',
        'Describa el detalle con al menos 5 caracteres para poder ayudarle.',
        400,
        { field: 'description' }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const owner = OWNER_BY_CATEGORY[category] || 'mesa_ayuda';
    const consentDiagnostico = payload.consentDiagnostico ? 1 : 0;

    db.prepare(
      `INSERT INTO feedback_tickets (
        id, user_id, category, subject, description, status, owner, consent_diagnostico, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'abierto', ?, ?, ?, ?)`
    ).run(id, userId, category, subject, description, owner, consentDiagnostico, now, now);

    const row = db.prepare('SELECT * FROM feedback_tickets WHERE id = ?').get(id);
    return mapTicket(row);
  }

  function listTickets(userId, { includeAllForSupervisor = false } = {}) {
    const rows = includeAllForSupervisor
      ? db.prepare('SELECT * FROM feedback_tickets ORDER BY created_at DESC').all()
      : db.prepare('SELECT * FROM feedback_tickets WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    const byCategory = {};
    for (const r of rows) {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    }

    return {
      tickets: rows.map(mapTicket),
      groupedByCategory: byCategory,
    };
  }

  function updateTicketStatus(ticketId, status) {
    if (!VALID_STATUSES.has(status)) {
      throw new AppError('FEEDBACK_INVALID_STATUS', 'Estado de ticket no válido.', 400);
    }
    const existing = db.prepare('SELECT * FROM feedback_tickets WHERE id = ?').get(ticketId);
    if (!existing) {
      throw new AppError('FEEDBACK_NOT_FOUND', 'El ticket solicitado no existe.', 404);
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE feedback_tickets SET status = ?, updated_at = ? WHERE id = ?').run(
      status,
      now,
      ticketId
    );
    return mapTicket(db.prepare('SELECT * FROM feedback_tickets WHERE id = ?').get(ticketId));
  }

  return {
    createTicket,
    listTickets,
    updateTicketStatus,
  };
}

module.exports = { createSoporteModule };
