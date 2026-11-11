const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();
const ctrl = require('../controllers/feeSetupController');

// Fee Heads
router.route('/fee-heads')
  .post(protect, authorize('admin'), ctrl.createFeeHead)
  .get(protect, authorize('admin'), ctrl.getFeeHeads);
router.route('/fee-heads/:id')
  .put(protect, authorize('admin'), ctrl.updateFeeHead)
  .delete(protect, authorize('admin'), ctrl.deleteFeeHead);

// Class Fee Plans
router.route('/class-fee-plans')
  .post(protect, authorize('admin'), ctrl.createClassFeePlan)
  .get(protect, authorize('admin'), ctrl.getClassFeePlans);
router.route('/class-fee-plans/:id')
  .put(protect, authorize('admin'), ctrl.updateClassFeePlan)
  .delete(protect, authorize('admin'), ctrl.deleteClassFeePlan);

module.exports = router;