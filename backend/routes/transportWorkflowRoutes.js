const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/transportWorkflowController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'transport'));

router.get('/overview', controller.getOverview);
router.get('/incidents', controller.getIncidentCenter);
router.post('/incidents', controller.createIncident);
router.post('/notes', controller.addWorkflowNote);

module.exports = router;
