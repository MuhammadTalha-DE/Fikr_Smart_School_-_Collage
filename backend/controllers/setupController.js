const TeacherAvailability = require('../models/TeacherAvailability');
const WeeklyLoad = require('../models/WeeklyLoad');
const asyncHandler = require('express-async-handler');

// @desc    Set teacher availability
// @route   POST /api/setup/teacher-availability
const setTeacherAvailability = asyncHandler(async (req, res) => {
  const { teacherId, slots } = req.body;
  let avail = await TeacherAvailability.findOne({ teacherId });
  if (avail) {
    avail.slots = slots;
    await avail.save();
  } else {
    avail = await TeacherAvailability.create({ teacherId, slots });
  }
  res.json(avail);
});

// @desc    Set weekly load for a class
// @route   POST /api/setup/weekly-load
const setWeeklyLoad = asyncHandler(async (req, res) => {
  const { classId, loads } = req.body;
  let load = await WeeklyLoad.findOne({ classId });
  if (load) {
    load.loads = loads;
    await load.save();
  } else {
    load = await WeeklyLoad.create({ classId, loads });
  }
  res.json(load);
});

// @desc    Get teacher availability
const getTeacherAvailability = asyncHandler(async (req, res) => {
  const avail = await TeacherAvailability.findOne({ teacherId: req.params.teacherId });
  res.json(avail || null);
});

// @desc    Get weekly load for a class
const getWeeklyLoad = asyncHandler(async (req, res) => {
  const load = await WeeklyLoad.findOne({ classId: req.params.classId });
  res.json(load || null);
});

module.exports = { setTeacherAvailability, setWeeklyLoad, getTeacherAvailability, getWeeklyLoad };