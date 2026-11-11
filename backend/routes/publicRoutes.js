const express = require('express');
const router = express.Router();
const { getPublicStats } = require('../controllers/publicController');
const { cacheResponse } = require('../middleware/cacheMiddleware');

router.get('/stats', cacheResponse({ namespace: 'public', ttlSeconds: 120 }), getPublicStats);

module.exports = router;
