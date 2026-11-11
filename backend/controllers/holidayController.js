const Holiday = require('../models/Holiday');
const asyncHandler = require('express-async-handler');

// GET all holidays (with optional year filter)
const getHolidays = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const filter = {};
  if (year) {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    filter.date = { $gte: start, $lt: end };
  }
  const holidays = await Holiday.find(filter).sort('date');
  res.json(holidays);
});

// POST create holiday
const createHoliday = asyncHandler(async (req, res) => {
  const { name, date, isRecurring, description } = req.body;
  const holiday = await Holiday.create({ name, date, isRecurring, description });
  res.status(201).json(holiday);
});

// DELETE holiday
const deleteHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) throw new Error('Holiday not found');
  await holiday.deleteOne();
  res.json({ message: 'Holiday deleted' });
});

module.exports = { getHolidays, createHoliday, deleteHoliday };