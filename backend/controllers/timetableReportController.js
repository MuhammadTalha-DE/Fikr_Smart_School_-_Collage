const asyncHandler = require('express-async-handler');
const reportService = require('../services/timetableReportService');

// Download PDF
const downloadPDF = asyncHandler(async (req, res) => {
  const { classId, term, academicYear } = req.query;
  const pdfBuffer = await reportService.generateClassTimetablePDF(classId, term, academicYear);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=timetable-${classId}.pdf`);
  res.send(pdfBuffer);
});

// Download Excel
const downloadExcel = asyncHandler(async (req, res) => {
  const { classId, term, academicYear } = req.query;
  const excelBuffer = await reportService.generateClassTimetableExcel(classId, term, academicYear);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=timetable-${classId}.xlsx`);
  res.send(excelBuffer);
});

// Teacher PDF
const downloadTeacherPDF = asyncHandler(async (req, res) => {
  const { teacherId } = req.query;
  const pdfBuffer = await reportService.generateTeacherSchedulePDF(teacherId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=teacher-schedule-${teacherId}.pdf`);
  res.send(pdfBuffer);
});

// Teacher Excel
const downloadTeacherExcel = asyncHandler(async (req, res) => {
  const { teacherId } = req.query;
  const excelBuffer = await reportService.generateTeacherScheduleExcel(teacherId);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=teacher-schedule-${teacherId}.xlsx`);
  res.send(excelBuffer);
});

module.exports = { downloadPDF, downloadExcel, downloadTeacherPDF, downloadTeacherExcel };