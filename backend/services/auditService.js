// services/auditService.js
const AuditLog = require('../models/AuditLog');

/**
 * Log an audit entry.
 *
 * This function is intentionally **fire‑and‑forget** – we don’t want audit
 * logging to slow down the main API response. Errors are caught and
 * logged to the console, but never thrown to the caller.
 *
 * @param {Object}   params
 * @param {String}   params.action      - one of the enumerated actions
 * @param {String}   params.entity      - e.g. 'Student', 'Marks'
 * @param {ObjectId} [params.entityId]  - ID of the affected document
 * @param {String}   params.description - plain‑language summary
 * @param {Object}   params.performedBy - { userId, role, name } (usually req.user)
 * @param {Object}   [params.changes]   - { before: …, after: … }
 * @param {Request}  [params.req]       - Express request object (to get IP/UA)
 */
const log = async ({
  action,
  entity,
  entityId = null,
  description,
  module = 'general',
  status = 'success',
  performedBy = {},
  changes = null,
  req = null,
}) => {
  try {
    const entry = new AuditLog({
      action: String(action || '').toUpperCase(),
      entity,
      entityId,
      description,
      module,
      status,
      performedBy: {
        userId: performedBy.userId || null,
        role:   performedBy.role || 'system',
        name:   performedBy.name || 'System',
      },
      changes,
      metadata: {
        ip:        req?.ip || req?.connection?.remoteAddress || '',
        userAgent: req?.headers?.['user-agent'] || '',
        method: req?.method || '',
        path: req?.originalUrl || req?.url || '',
        reference: req?.headers?.['x-request-id'] || '',
        timestamp: new Date(),
      },
    });

    await entry.save();   // we await here so that errors are caught in this block
    // (In a high‑traffic system you might skip the await, but for a school ERP it’s perfectly fine.)
  } catch (err) {
    // NEVER let audit logging crash the main operation
    console.error('❌ Audit log write failed:', err.message);
  }
};

module.exports = { log };
