const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getAuditLogs,
  getAuditLogById,
  getAuditStats,
  getAuditFilterOptions,
} = require('../controllers/auditController');

router.use(protect, authorize('admin'));

router.get('/admin/stats', getAuditStats);
router.get('/admin/options', getAuditFilterOptions);
router.get('/admin/logs', getAuditLogs);
router.get('/admin/logs/:id', getAuditLogById);

module.exports = router;
