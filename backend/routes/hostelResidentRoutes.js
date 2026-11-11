const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getResidents,
  getResidentDetail,
  transferStudent,
  removeStudent,
} = require('../controllers/hostelResidentController');

// Admin & Warden can view residents
router.get('/', protect, authorize('admin', 'warden'), getResidents);

// Detail view
router.get('/:id', protect, authorize('admin', 'warden'), getResidentDetail);

// Transfer – admin only (warden must go through approval flow later)
router.post('/:id/transfer', protect, authorize('admin'), transferStudent);

// Remove – admin only
router.delete('/:id', protect, authorize('admin'), removeStudent);

module.exports = router;