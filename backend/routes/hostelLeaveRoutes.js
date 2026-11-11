const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { applyLeave, getLeaves, approveLeave, rejectLeave } = require('../controllers/hostelLeaveController');

router.post('/', protect, authorize('student'), applyLeave);
router.get('/', protect, authorize('student', 'parent', 'warden', 'admin'), getLeaves);
router.put('/:id/approve', protect, authorize('warden', 'admin'), approveLeave);
router.put('/:id/reject', protect, authorize('warden', 'admin'), rejectLeave);

module.exports = router;
