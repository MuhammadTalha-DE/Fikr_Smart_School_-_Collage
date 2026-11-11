const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/learningContinuityController');

router.use(protect);

router.get('/summary', authorize('admin', 'teacher'), ctrl.getContinuitySummary);
router.get('/', authorize('admin', 'teacher'), ctrl.getContinuityLogs);
router.post('/', authorize('admin', 'teacher'), ctrl.createContinuityLog);

module.exports = router;
