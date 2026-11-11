const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const router = express.Router();
const SchoolPeriod = require('../models/SchoolPeriod');

// Get all periods
router.get('/', protect, async (req, res) => {
  const periods = await SchoolPeriod.find().sort('periodNumber');
  res.json(periods);
});

// Bulk save periods
router.post('/bulk', protect, authorize('admin'), async (req, res) => {
  await SchoolPeriod.deleteMany({});
  const periods = await SchoolPeriod.insertMany(req.body.periods);
  res.json(periods);
});

module.exports = router;