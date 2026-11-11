/*
const Class = require('../models/Class');
const asyncHandler = require('express-async-handler');

// @desc    Get all unique subjects across classes
// @route   GET /api/subjects
const getAllSubjects = asyncHandler(async (req, res) => {
  const classes = await Class.find({}, 'subjects');
  const subjectSet = new Set();
  classes.forEach(cls => {
    if (Array.isArray(cls.subjects)) {
      cls.subjects.forEach(sub => subjectSet.add(sub));
    }
  });
  const uniqueSubjects = Array.from(subjectSet).sort();
  res.json(uniqueSubjects);
});

module.exports = { getAllSubjects };

*/
const Subject = require('../models/Subject');

// GET /api/subjects

exports.getSubjects = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.active) filter.isActive = req.query.active === 'true';

    const subjects = await Subject.find(filter)
      .populate('prerequisites', 'name code')
      .sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (err) {
    throw err;
  }
};

// POST /api/subjects
exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, subject });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/subjects/:id
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('prerequisites', 'name code');
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, subject });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/subjects/:id
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject deleted' });
  } catch (err) {
    throw err;
  }
};
