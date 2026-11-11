const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/securityGateController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/admin/overview', controller.getAdminOverview);
router.get('/visitors', controller.listVisitors);
router.post('/visitors', controller.createVisitor);
router.put('/visitors/:id', controller.updateVisitor);
router.get('/student-passes', controller.listStudentPasses);
router.post('/student-passes', controller.createStudentPass);
router.put('/student-passes/:id', controller.updateStudentPass);
router.get('/staff-passes', controller.listStaffPasses);
router.post('/staff-passes', controller.createStaffPass);
router.put('/staff-passes/:id', controller.updateStaffPass);
router.get('/vehicle-logs', controller.listVehicleLogs);
router.post('/vehicle-logs', controller.createVehicleLog);
router.get('/notices', controller.listNotices);
router.post('/notices', controller.createNotice);
router.put('/notices/:id', controller.updateNotice);

module.exports = router;
