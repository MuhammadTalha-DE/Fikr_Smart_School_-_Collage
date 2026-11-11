const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { createMenu, getCurrentMenu, getMenuByWeek } = require('../controllers/messController');

// Warden/Admin can create or update the weekly menu
router.post('/', protect, authorize('warden', 'admin'), createMenu);

// Anyone authenticated can view the current week's menu
router.get('/current', protect, getCurrentMenu);

// Get menu by a specific date (query ?date=YYYY-MM-DD) – for warden to review past/future
router.get('/', protect, getMenuByWeek);

module.exports = router;