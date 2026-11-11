const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/transportController');

router.use(protect);

router.get('/my-allocation', authorize('student', 'parent'), ctrl.getMyAllocation);

router.get('/dashboard/overview', authorize('admin', 'transport'), ctrl.getDashboardOverview);
router.get('/delay-alerts', authorize('admin', 'transport'), ctrl.listDelayAlerts);
router.post('/delay-alerts', authorize('admin', 'transport'), ctrl.createDelayAlert);
router.put('/vehicles/:vehicleId/location', authorize('admin', 'transport', 'driver'), ctrl.updateVehicleLocation);

router.use(authorize('admin', 'transport'));

router.get('/routes', ctrl.getRoutes);
router.post('/routes', ctrl.createRoute);
router.get('/routes/:id', ctrl.getRouteById);
router.put('/routes/:id', ctrl.updateRoute);
router.delete('/routes/:id', ctrl.deleteRoute);

router.get('/vehicles', ctrl.getVehicles);
router.post('/vehicles', ctrl.createVehicle);
router.get('/vehicles/:id', ctrl.getVehicleById);
router.put('/vehicles/:id', ctrl.updateVehicle);
router.delete('/vehicles/:id', ctrl.deleteVehicle);

router.get('/allocations', ctrl.getAllocations);
router.post('/allocations', ctrl.createAllocation);
router.put('/allocations/:id', ctrl.updateAllocation);
router.delete('/allocations/:id', ctrl.deleteAllocation);

router.post('/allocations/:id/charge-fee', ctrl.chargeTransportFee);
router.post('/allocations/charge-all-fees', ctrl.chargeAllTransportFees);

router.get('/roster', ctrl.getRoster);
router.get('/trip-sheet', ctrl.getTripSheet);

module.exports = router;
