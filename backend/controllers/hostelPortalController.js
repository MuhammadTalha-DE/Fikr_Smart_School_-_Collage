const hostelPortalService = require('../services/hostelPortalService');

exports.getAdminOverview = async (req, res) => {
  try {
    const data = await hostelPortalService.getAdminOverview();
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

exports.getWardenOverview = async (req, res) => {
  try {
    const data = await hostelPortalService.getWardenOverview(req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getStudentOverview = async (req, res) => {
  try {
    const data = await hostelPortalService.getStudentOverview(req.user._id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getParentOverview = async (req, res) => {
  try {
    const data = await hostelPortalService.getParentOverview(req.user._id, req.query.studentId || '');
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getStudentStatus = async (req, res) => {
  try {
    const data = await hostelPortalService.getStudentStatus(req.user._id);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

