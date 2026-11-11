const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/wardenWorkflowController');

const router = express.Router();

router.use(protect);
router.use(authorize('warden'));

router.get('/overview', controller.getOverview);
router.get('/ptm', controller.getPTMCenter);
router.get('/interventions', controller.getInterventions);
router.get('/clinic-alerts', controller.getClinicAlerts);
router.get('/security', controller.getSecurityCenter);
router.post('/notes', controller.addWorkflowNote);

module.exports = router;
