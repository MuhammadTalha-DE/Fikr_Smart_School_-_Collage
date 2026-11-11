const hrPayrollService = require('../services/hrPayrollService');

exports.getAdminOverview = async (req, res) => {
  try {
    const data = await hrPayrollService.getAdminOverview();
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

exports.getStaffDirectory = async (req, res) => {
  try {
    const data = await hrPayrollService.getStaffDirectory({
      search: req.query.search || '',
      limit: Number(req.query.limit || 250),
    });
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

exports.getAttendanceCenter = async (req, res) => {
  try {
    const data = await hrPayrollService.getAttendanceCenter();
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

exports.getPayrollCenter = async (req, res) => {
  try {
    const data = await hrPayrollService.getPayrollCenter();
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

