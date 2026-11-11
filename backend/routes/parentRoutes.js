const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getAllParents, getMyChildren, getParentById, updateParent } = require('../controllers/parentController');
const router = express.Router();

router.get('/', protect, getAllParents);
router.get('/my-children', protect, authorize('parent'), getMyChildren);
router.get('/:id', protect, authorize('admin'), getParentById);
router.put('/:id', protect, authorize('admin'), updateParent);

module.exports = router;
