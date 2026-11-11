const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/studentWorkflowController');

const router = express.Router();

router.use(protect);
router.use(authorize('student'));

router.get('/overview', controller.getOverview);
router.get('/ptm', controller.getPTMCenter);
router.put('/ptm/:id/acknowledge', controller.acknowledgePTMMeeting);
router.put('/ptm/:id/reminder', controller.requestPTMReminder);
router.get('/gate-passes', controller.getGatePassCenter);
router.post('/notes', controller.addWorkflowNote);

module.exports = router;
