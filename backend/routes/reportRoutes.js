const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');   // 🔥 Correct import
const ctrl = require('../controllers/reportController');

router.use(protect);

// All admin only except monthly-collection (can be used by any authenticated user)
router.get('/monthly-collection', ctrl.monthlyCollection);
router.get('/collection-summary', authorize('admin'), ctrl.collectionSummary);
router.get('/defaulters', authorize('admin'), ctrl.defaultersList);

module.exports = router;