const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { createMenu, getCurrentMenu, getMenuByWeek } = require('../controllers/messController');

// Warden/Admin can create/update
router.post('/', protect, authorize('warden', 'admin'), createMenu);
// Anyone authenticated can view current menu
router.get('/current', protect, getCurrentMenu);
router.get('/', protect, getMenuByWeek);   // query ?date=...

module.exports = router;