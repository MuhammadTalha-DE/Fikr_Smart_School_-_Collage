const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/teacherWorkspaceController');

const router = express.Router();

router.use(protect);
router.use(authorize('teacher'));

router.get('/overview', controller.getOverview);
router.get('/context', controller.getTeacherContext);
router.get('/self-service', controller.getSelfServiceCenter);
router.post('/leave-requests', controller.createLeaveRequest);
router.post('/gate-passes', controller.createGatePass);
router.get('/lesson-delivery', controller.getLessonDeliveryTracker);
router.post('/lesson-delivery', controller.recordLessonDelivery);
router.get('/interventions', controller.getInterventions);
router.post('/interventions', controller.createIntervention);
router.put('/interventions/:id', controller.updateIntervention);
router.get('/ptm', controller.getPTMCenter);
router.post('/ptm', controller.createPTMMeeting);
router.put('/ptm/:id', controller.updatePTMMeeting);
router.get('/substitutions', controller.getSubstitutionInvigilationCenter);
router.get('/continuity', controller.getLearningContinuityWorkspace);

module.exports = router;
