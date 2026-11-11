const SpecialSchedule = require('../models/SpecialSchedule');
const asyncHandler = require('express-async-handler');

// @desc    Get all special schedules
// @route   GET /api/special-schedules
const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await SpecialSchedule.find().sort('-startDate');
  res.json(schedules);
});

// @desc    Create a special schedule
// @route   POST /api/special-schedules
const createSchedule = asyncHandler(async (req, res) => {
  const { name, scheduleType, academicYear, startDate, endDate, description } = req.body;
  const schedule = await SpecialSchedule.create({
    name, scheduleType, academicYear, startDate, endDate, description,
    createdBy: req.user._id,
  });
  res.status(201).json(schedule);
});

// @desc    Update a special schedule
// @route   PUT /api/special-schedules/:id
const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await SpecialSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!schedule) throw new Error('Schedule not found');
  res.json(schedule);
});

// @desc    Delete a special schedule
// @route   DELETE /api/special-schedules/:id
const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await SpecialSchedule.findById(req.params.id);
  if (!schedule) throw new Error('Schedule not found');
  await schedule.deleteOne();
  res.json({ message: 'Schedule deleted' });
});

module.exports = { getSchedules, createSchedule, updateSchedule, deleteSchedule };