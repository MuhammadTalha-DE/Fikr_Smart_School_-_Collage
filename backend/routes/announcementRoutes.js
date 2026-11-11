/*
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { createAnnouncement, getAnnouncements } = require('../controllers/announcementController');
const router = express.Router();
router.route('/').post(protect, authorize('admin'), createAnnouncement).get(protect, getAnnouncements);
module.exports = router;
*/
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { createAnnouncement, getAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');
const router = express.Router();

router.route('/')
  .post(protect, authorize('admin'), createAnnouncement)
  .get(protect, getAnnouncements);
router.delete('/:id', protect, authorize('admin'), deleteAnnouncement);
module.exports = router;
