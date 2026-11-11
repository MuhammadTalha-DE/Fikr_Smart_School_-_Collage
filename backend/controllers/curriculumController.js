const Curriculum = require('../models/Curriculum');

// GET /api/curriculums?class=...&session=...
exports.getCurriculums = async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;
    if (req.query.session) filter.session = req.query.session;

    const curriculums = await Curriculum.find(filter)
      .populate('class', 'name')
      .populate('session', 'name')
      .populate('subjects.subject', 'name code credits type')
      .sort({ name: 1 });
    res.json({ success: true, curriculums });
  } catch (err) {
    throw err;
  }
};

// POST /api/curriculums
exports.createCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.create(req.body);
    // Populate before sending response
    await curriculum.populate('class', 'name');
    await curriculum.populate('session', 'name');
    await curriculum.populate('subjects.subject', 'name code credits type');
    res.status(201).json({ success: true, curriculum });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Curriculum already exists for this class and session' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/curriculums/:id
exports.updateCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('class', 'name')
      .populate('session', 'name')
      .populate('subjects.subject', 'name code credits type');
    if (!curriculum) return res.status(404).json({ success: false, message: 'Curriculum not found' });
    res.json({ success: true, curriculum });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/curriculums/:id
exports.deleteCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findByIdAndDelete(req.params.id);
    if (!curriculum) return res.status(404).json({ success: false, message: 'Curriculum not found' });
    res.json({ success: true, message: 'Curriculum deleted' });
  } catch (err) {
    throw err;
  }
};
