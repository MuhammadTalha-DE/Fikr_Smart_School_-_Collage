const SyllabusUnit = require('../models/SyllabusUnit');

// GET /api/syllabusUnits?subject=...&curriculum=...
exports.getUnits = async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.curriculum) filter.curriculum = req.query.curriculum;

    const units = await SyllabusUnit.find(filter)
      .populate('subject', 'name code')
      .populate('curriculum', 'name')
      .sort({ unitNumber: 1 });
    res.json({ success: true, units });
  } catch (err) {
    throw err;
  }
};

// POST /api/syllabusUnits
exports.createUnit = async (req, res) => {
  try {
    const unit = await SyllabusUnit.create(req.body);
    await unit.populate('subject', 'name code');
    await unit.populate('curriculum', 'name');
    res.status(201).json({ success: true, unit });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Unit number already exists for this subject and curriculum' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/syllabusUnits/:id
exports.updateUnit = async (req, res) => {
  try {
    const unit = await SyllabusUnit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('subject', 'name code')
      .populate('curriculum', 'name');
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    res.json({ success: true, unit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/syllabusUnits/:id
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await SyllabusUnit.findByIdAndDelete(req.params.id);
    if (!unit) return res.status(404).json({ success: false, message: 'Unit not found' });
    res.json({ success: true, message: 'Unit deleted' });
  } catch (err) {
    throw err;
  }
};

// Bulk create units from a predefined structure (optional â€“ for syllabus planning)
exports.bulkCreateUnits = async (req, res) => {
  try {
    const { units } = req.body; // array of unit objects
    if (!Array.isArray(units) || units.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of units' });
    }
    const created = await SyllabusUnit.insertMany(units);
    res.status(201).json({ success: true, units: created });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
