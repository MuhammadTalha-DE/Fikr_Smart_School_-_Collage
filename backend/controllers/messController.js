const asyncHandler = require('express-async-handler');
const MessMenu = require('../models/MessMenu');
const auditService = require('../services/auditService');

// @desc    Create or update menu for a week
// @route   POST /api/mess-menu
const createMenu = asyncHandler(async (req, res) => {
  const { weekStart, days } = req.body;
  if (!weekStart || !days || !Array.isArray(days)) {
    res.status(400);
    throw new Error('weekStart and days array are required');
  }

  // Normalize weekStart to the start of the week (Monday)
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);

  let menu = await MessMenu.findOne({ weekStart: start });
  if (menu) {
    // Update existing menu
    menu.days = days;
    await menu.save();
  } else {
    // Create new menu
    menu = await MessMenu.create({
      weekStart: start,
      days,
      createdBy: req.user._id,
    });
  }

  auditService.log({
    action: menu.isNew ? 'CREATE' : 'UPDATE',
    entity: 'MessMenu',
    entityId: menu._id,
    description: `Mess menu for week of ${start.toLocaleDateString()}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.status(201).json(menu);
});

// @desc    Get the current week's menu (student/any authenticated user)
// @route   GET /api/mess-menu/current
const getCurrentMenu = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const menu = await MessMenu.findOne({
    weekStart: { $lte: today },
    // weekStart + 7 days > today
    $expr: { $lt: ['$weekStart', new Date(today.getTime() + 7 * 86400000)] },
  }).lean();

  if (!menu) {
    return res.json({ message: 'No menu for this week yet', days: [] });
  }
  res.json(menu);
});

// @desc    Get menu for a specific week (by date query)
// @route   GET /api/mess-menu?date=YYYY-MM-DD
const getMenuByWeek = asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  date.setHours(0, 0, 0, 0);

  const menu = await MessMenu.findOne({
    weekStart: { $lte: date },
    $expr: { $lt: ['$weekStart', new Date(date.getTime() + 7 * 86400000)] },
  }).lean();

  if (!menu) {
    return res.json({ message: 'No menu for that week', days: [] });
  }
  res.json(menu);
});

module.exports = { createMenu, getCurrentMenu, getMenuByWeek };