const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getAdminDashboard } = require('../controllers/dashboardController');
const { cacheResponse } = require('../middleware/cacheMiddleware');
const router = express.Router();

router.get('/admin', protect, authorize('admin'), cacheResponse({ namespace: 'dashboard', ttlSeconds: 30, varyBy: ['role'] }), getAdminDashboard);

module.exports = router;
