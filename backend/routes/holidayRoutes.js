const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');   // ✅ destructure
const router = express.Router();
const ctrl = require('../controllers/holidayController');

router.route('/')
  .get(protect, authorize('admin'), ctrl.getHolidays)
  .post(protect, authorize('admin'), ctrl.createHoliday);

router.delete('/:id', protect, authorize('admin'), ctrl.deleteHoliday);

module.exports = router;