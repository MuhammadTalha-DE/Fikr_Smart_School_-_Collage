const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/academicRecordController');

router.use(protect);

router.get('/', authorize('admin', 'teacher'), ctrl.getRecords);
router.post('/promote', authorize('admin'), ctrl.runPromotion);

module.exports = router;