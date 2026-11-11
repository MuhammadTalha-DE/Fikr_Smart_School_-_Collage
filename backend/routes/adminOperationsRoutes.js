const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const controller = require('../controllers/adminOperationsController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/overview', controller.getAdminOverview);
router.get('/budgets', controller.getBudgetCenter);
router.post('/budgets', controller.createBudget);
router.put('/budgets/:id', controller.updateBudget);
router.get('/approvals', controller.getApprovalsCenter);
router.post('/approvals/action', controller.applyApprovalAction);
router.get('/compliance', controller.getComplianceCenter);
router.post('/compliance', controller.createComplianceDocument);
router.put('/compliance/:id', controller.updateComplianceDocument);
router.get('/clinic-ops', controller.getClinicOperations);
router.get('/security-ops', controller.getSecurityOperations);
router.get('/staff-oversight', controller.getStaffSelfServiceOversight);
router.get('/bi-center', controller.getManagementBICenter);
router.get('/principal-command', controller.getPrincipalCommandCenter);

module.exports = router;
