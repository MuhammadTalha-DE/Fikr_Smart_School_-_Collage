const express = require('express');
const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { recordPayment } = require('../controllers/paymentController');

// POST /api/fee-accounts/:accountId/payments
// Allowed for: student, parent, admin, warden
router.post('/', protect, authorize('admin', 'student', 'parent', 'warden'), recordPayment);

module.exports = router;