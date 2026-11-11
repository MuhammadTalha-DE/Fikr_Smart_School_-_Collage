const StudentAcademicSummary = require('../models/StudentAcademicSummary');
const { refreshStudentSummary } = require('../services/studentSummaryService');
const asyncHandler = require('express-async-handler');

// GET /api/summaries/student/:studentId
const getStudentSummary = asyncHandler(async (req, res) => {
  let summary = await StudentAcademicSummary.findOne({ student: req.params.studentId }).lean();
  if (!summary) {
    summary = await refreshStudentSummary(req.params.studentId);
  }
  res.json({ success: true, summary });
});

// POST /api/summaries/refresh/:studentId
const refreshSummary = asyncHandler(async (req, res) => {
  const summary = await refreshStudentSummary(req.params.studentId);
  res.json({ success: true, summary });
});

module.exports = { getStudentSummary, refreshSummary };