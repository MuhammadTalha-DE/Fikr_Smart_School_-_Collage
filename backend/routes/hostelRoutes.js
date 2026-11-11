const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getHostels, createHostel, updateHostel, deleteHostel,
  getRooms, createRoom, updateRoom, deleteRoom,
  getBeds,
} = require('../controllers/hostelController');

// Hostels
router.route('/')
  .get(protect, authorize('admin', 'warden', 'student'), getHostels)   // ← added student
  .post(protect, authorize('admin'), createHostel);

router.route('/:id')
  .put(protect, authorize('admin'), updateHostel)
  .delete(protect, authorize('admin'), deleteHostel);

// Rooms
router.route('/rooms')
  .get(protect, authorize('admin', 'warden', 'student'), getRooms)     // ← added student
  .post(protect, authorize('admin'), createRoom);

router.route('/rooms/:id')
  .put(protect, authorize('admin'), updateRoom)
  .delete(protect, authorize('admin'), deleteRoom);

// Beds
router.get('/beds', protect, authorize('admin', 'warden', 'student'), getBeds);   // ← added student

module.exports = router;