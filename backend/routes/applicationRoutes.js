const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { applyHostel, getApplications, approveApplication, rejectApplication } = require('../controllers/applicationController');

router.post('/', protect, authorize('student'), applyHostel);
router.get('/', protect, authorize('admin', 'warden'), getApplications);
router.put('/:id/approve', protect, authorize('admin', 'warden'), approveApplication);
router.put('/:id/reject', protect, authorize('admin', 'warden'), rejectApplication);

module.exports = router;