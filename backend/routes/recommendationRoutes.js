const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/recommendationController');

router.use(protect);

router.get('/my', ctrl.getMyRecommendations);
router.put('/:id/seen', ctrl.markSeen);
router.put('/:id/acted', ctrl.markActed);
router.post('/generate', ctrl.generateRecommendations);   // optional

module.exports = router;