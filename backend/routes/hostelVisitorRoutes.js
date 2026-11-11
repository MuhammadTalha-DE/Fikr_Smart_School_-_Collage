const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  requestVisitor, getVisitors, approveVisitor,
  checkInVisitor, checkOutVisitor, rejectVisitor
} = require('../controllers/hostelVisitorController');

// Student: request visitor & view own
router.post('/', protect, authorize('student'), requestVisitor);
router.get('/', protect, authorize('student', 'parent', 'warden', 'admin'), getVisitors);

// Warden/Admin: manage
router.put('/:id/approve', protect, authorize('warden', 'admin'), approveVisitor);
router.put('/:id/reject', protect, authorize('warden', 'admin'), rejectVisitor);
router.put('/:id/checkin', protect, authorize('warden', 'admin'), checkInVisitor);
router.put('/:id/checkout', protect, authorize('warden', 'admin'), checkOutVisitor);

module.exports = router;
