const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();
const ctrl = require('../controllers/roomController');

router.route('/')
  .get(protect, ctrl.getRooms)
  .post(protect, authorize('admin'), ctrl.createRoom);

router.route('/:id')
  .put(protect, authorize('admin'), ctrl.updateRoom)
  .delete(protect, authorize('admin'), ctrl.deleteRoom);

module.exports = router;