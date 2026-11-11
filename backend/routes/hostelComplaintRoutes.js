const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
} = require('../controllers/hostelComplaintController');

router.post('/', protect, authorize('student'), createComplaint);
router.get('/', protect, authorize('student', 'parent', 'warden', 'admin'), getComplaints);
router.put('/:id', protect, authorize('warden', 'admin'), updateComplaintStatus);

module.exports = router;
