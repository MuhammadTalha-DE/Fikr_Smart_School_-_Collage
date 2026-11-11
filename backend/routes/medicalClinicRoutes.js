const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/medicalClinicController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/admin/overview', controller.getAdminOverview);
router.get('/profiles', controller.listProfiles);
router.post('/profiles', controller.upsertProfile);
router.get('/visits', controller.listVisits);
router.post('/visits', controller.createVisit);
router.get('/medicines', controller.listMedicineLogs);
router.post('/medicines', controller.createMedicineLog);
router.get('/incidents', controller.listIncidents);
router.post('/incidents', controller.createIncident);

module.exports = router;
