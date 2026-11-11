const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/concessionController');

router.use(protect);

// POST /api/fee-accounts/:accountId/concessions
router.post('/', authorize('admin'), ctrl.applyConcession);

module.exports = router;