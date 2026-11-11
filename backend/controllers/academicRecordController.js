const AcademicRecord = require('../models/AcademicRecord');
const progressionService = require('../services/progressionService');
const asyncHandler = require('express-async-handler');

// GET /api/academic-records?student=...&academicYear=...
const getRecords = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.student) filter.student = req.query.student;
  if (req.query.academicYear) filter.academicYear = req.query.academicYear;

  const records = await AcademicRecord.find(filter)
    .populate('student', 'userId admissionNumber')
    .populate('class', 'name')
    .sort({ academicYear: -1 });

  res.json({ success: true, records });
});

// POST /api/academic-records/promote
const runPromotion = asyncHandler(async (req, res) => {
  const { classId, academicYear, options } = req.body;
  if (!classId || !academicYear) {
    res.status(400);
    throw new Error('classId and academicYear are required');
  }

  const result = await progressionService.evaluateAndPromote(classId, academicYear, options);
  res.json({ success: true, ...result });
});

module.exports = { getRecords, runPromotion };