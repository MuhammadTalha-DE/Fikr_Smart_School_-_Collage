const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/feeAccountController');

router.use(protect);


// List all fee accounts
router.get('/', authorize('admin'), ctrl.getAccounts);
// My fee account (student/parent)
router.get('/my', protect, ctrl.getMyAccounts);
router.get('/parent', protect, authorize('parent'), ctrl.getParentChildAccounts);
//router.post('/my/pay', protect, ctrl.selfPay);
router.post('/my/pay', protect, authorize('student', 'parent'),ctrl.selfPay);

// Apply late fees
router.post('/apply-late-fees', authorize('admin'), ctrl.applyLateFees);

// Single account detail
router.get('/:id', authorize('admin'), ctrl.getAccountById);

// Note: Payment routes are mounted via server.js at /api/fee-accounts/:accountId/payments

module.exports = router;