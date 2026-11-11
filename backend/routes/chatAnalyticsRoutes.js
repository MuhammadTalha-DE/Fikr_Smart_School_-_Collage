const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getUsageStats, getPopularTools, getConversationTrends, getFeedbackSummary } = require('../controllers/chatAnalyticsController');

router.get('/usage', protect, authorize('admin'), getUsageStats);
router.get('/tools', protect, authorize('admin'), getPopularTools);
router.get('/trends', protect, authorize('admin'), getConversationTrends);
router.get('/feedback', protect, authorize('admin'), getFeedbackSummary);

module.exports = router;