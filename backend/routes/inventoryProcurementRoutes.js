const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/inventoryProcurementController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/admin/overview', controller.getAdminOverview);

router.get('/items', controller.listItems);
router.post('/items', controller.createItem);
router.put('/items/:id', controller.updateItem);

router.get('/vendors', controller.listVendors);
router.post('/vendors', controller.createVendor);
router.put('/vendors/:id', controller.updateVendor);

router.get('/purchase-requests', controller.listPurchaseRequests);
router.post('/purchase-requests', controller.createPurchaseRequest);
router.put('/purchase-requests/:id', controller.updatePurchaseRequest);

router.get('/purchase-orders', controller.listPurchaseOrders);
router.post('/purchase-orders', controller.createPurchaseOrder);
router.put('/purchase-orders/:id', controller.updatePurchaseOrder);

router.get('/transactions', controller.listTransactions);
router.post('/transactions', controller.createTransaction);

router.get('/maintenance', controller.listMaintenanceLogs);
router.post('/maintenance', controller.createMaintenanceLog);
router.put('/maintenance/:id', controller.updateMaintenanceLog);

module.exports = router;
