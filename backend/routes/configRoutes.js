const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getLoadConfig, updateLoadConfig } = require('../controllers/configController');

const router = express.Router();

router.get('/default-load', protect, authorize('admin'), getLoadConfig);
router.put('/default-load', protect, authorize('admin'), updateLoadConfig);

module.exports = router;