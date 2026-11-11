const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/generalLedgerController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/admin/overview', controller.getAdminOverview);
router.get('/accounts', controller.listAccounts);
router.post('/accounts', controller.createAccount);
router.put('/accounts/:id', controller.updateAccount);
router.get('/vouchers', controller.listVouchers);
router.post('/vouchers', controller.createVoucher);
router.put('/vouchers/:id', controller.updateVoucher);

module.exports = router;
