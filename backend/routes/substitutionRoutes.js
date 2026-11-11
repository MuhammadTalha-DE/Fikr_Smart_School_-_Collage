const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();
const ctrl = require('../controllers/substitutionController');

router.get('/affected-slots', protect, authorize('admin'), ctrl.getAffectedSlots);
router.get('/eligible-substitutes', protect, authorize('admin'), ctrl.getEligibleSubstitutes);
router.post('/assign', protect, authorize('admin'), ctrl.assignSubstitute);
router.get('/', protect, ctrl.getSubstitutions);

module.exports = router;