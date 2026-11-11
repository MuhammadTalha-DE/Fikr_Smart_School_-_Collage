const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/parentWorkflowController');

const router = express.Router();

router.use(protect);
router.use(authorize('parent'));

router.get('/overview', controller.getOverview);
router.get('/ptm', controller.getPTMCenter);
router.put('/ptm/:id/respond', controller.respondToPTMMeeting);
router.get('/interventions', controller.getInterventions);
router.get('/clinic-alerts', controller.getClinicAlerts);
router.get('/security', controller.getSecurityCenter);
router.put('/security/gate-passes/:id/respond', controller.respondToGatePass);
router.post('/notes', controller.addWorkflowNote);

module.exports = router;
