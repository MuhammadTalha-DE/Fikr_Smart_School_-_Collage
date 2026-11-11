const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getTemplates, generateCertificate } = require('../controllers/certificateController');
const router = express.Router();

router.get('/templates', protect, authorize('admin'), getTemplates);
router.post('/generate', protect, authorize('admin'), generateCertificate);

module.exports = router;