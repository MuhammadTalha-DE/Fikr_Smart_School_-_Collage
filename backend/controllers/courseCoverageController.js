const CourseCoverage = require('../models/CourseCoverage');

// GET /api/course-coverage?teacher=...&class=...&subject=...
exports.getCoverage = async (req, res) => {
  try {
    const filter = {};
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.subject) filter.subject = req.query.subject;
    const coverage = await CourseCoverage.find(filter)
      .populate('teacher', 'userId')
      .populate('class', 'name')
      .populate('subject', 'name code')
      .populate('syllabusUnit', 'title unitNumber')
      .sort({ subject: 1, syllabusUnit: 1 });
    res.json({ success: true, coverage });
  } catch (err) {
    throw err;
  }
};

// POST /api/course-coverage (manual update)
exports.updateCoverage = async (req, res) => {
  try {
    const { teacher, class: cls, subject, syllabusUnit, coveredTopics, status, coveragePercentage } = req.body;
    let coverage = await CourseCoverage.findOne({ teacher, class: cls, subject, syllabusUnit });
    if (!coverage) {
      coverage = new CourseCoverage({ teacher, class: cls, subject, syllabusUnit });
    }
    if (coveredTopics) coverage.coveredTopics = coveredTopics;
    if (status) coverage.status = status;
    if (coveragePercentage !== undefined) coverage.coveragePercentage = coveragePercentage;
    await coverage.save();
    res.json({ success: true, coverage });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
