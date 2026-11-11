const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/courseCoverageController');

router.use(protect);
router.get('/', ctrl.getCoverage);
router.post('/', authorize('admin', 'teacher'), ctrl.updateCoverage);

module.exports = router;