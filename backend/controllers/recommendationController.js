const Recommendation = require('../models/Recommendation');
const asyncHandler = require('express-async-handler');

// GET /api/recommendations/my
const getMyRecommendations = asyncHandler(async (req, res) => {
  const recs = await Recommendation.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  res.json({ success: true, recommendations: recs });
});

// PUT /api/recommendations/:id/seen
const markSeen = asyncHandler(async (req, res) => {
  const rec = await Recommendation.findByIdAndUpdate(
    req.params.id,
    { seen: true },
    { new: true }
  );
  if (!rec) {
    res.status(404);
    throw new Error('Recommendation not found');
  }
  res.json({ success: true, recommendation: rec });
});

// PUT /api/recommendations/:id/acted
const markActed = asyncHandler(async (req, res) => {
  const rec = await Recommendation.findByIdAndUpdate(
    req.params.id,
    { acted_upon: true },
    { new: true }
  );
  if (!rec) {
    res.status(404);
    throw new Error('Recommendation not found');
  }
  res.json({ success: true, recommendation: rec });
});

// POST /api/recommendations/generate (for testing or manual trigger)
const generateRecommendations = asyncHandler(async (req, res) => {
  // This will be wired to the recommendation engine later
  const { userId, role, type, message, priority } = req.body;
  const rec = await Recommendation.create({
    user: userId,
    role,
    type,
    message,
    priority,
  });
  res.status(201).json({ success: true, recommendation: rec });
});

module.exports = { getMyRecommendations, markSeen, markActed, generateRecommendations };