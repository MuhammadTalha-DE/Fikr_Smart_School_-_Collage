const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/studentSummaryController');

router.use(protect);

router.get('/student/:studentId', ctrl.getStudentSummary);
router.post('/refresh/:studentId', ctrl.refreshSummary);

module.exports = router;