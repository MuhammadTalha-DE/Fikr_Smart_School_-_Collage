const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();
const ctrl = require('../controllers/specialScheduleController');

router.route('/')
  .get(protect, ctrl.getSchedules)
  .post(protect, authorize('admin'), ctrl.createSchedule);

router.route('/:id')
  .put(protect, authorize('admin'), ctrl.updateSchedule)
  .delete(protect, authorize('admin'), ctrl.deleteSchedule);

module.exports = router;