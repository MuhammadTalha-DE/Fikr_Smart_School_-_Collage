const User = require('../models/User');
const Class = require('../models/Class');
const asyncHandler = require('express-async-handler');

// @desc    Get public dashboard statistics
// @route   GET /api/public/stats
const getPublicStats = asyncHandler(async (req, res) => {
  const [students, teachers, parents, classes] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'parent' }),
    Class.countDocuments(),
  ]);

  // For parent rating, we could compute an average if a rating system exists.
  // For now, we'll return a default high value (e.g., 4.9) or you can later tie it to real feedback.
  const parentRating = 4.9; // placeholder – replace with real calculation if available

  res.json({
    teachers,
    students,
    parents,
    classes,
    parentRating,
  });
});

module.exports = { getPublicStats };