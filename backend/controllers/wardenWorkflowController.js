const service = require('../services/wardenWorkflowService');

const success = (res, data, message = null, status = 200) =>
  res.status(status).json({ success: true, ...(message ? { message } : {}), data });

const failure = (res, error, status = 400) =>
  res.status(status).json({ success: false, message: error.message });

exports.getOverview = async (req, res) => {
  try {
    success(res, await service.getOverview(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getPTMCenter = async (req, res) => {
  try {
    success(res, await service.getPTMCenter(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getInterventions = async (req, res) => {
  try {
    success(res, await service.getInterventions(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getClinicAlerts = async (req, res) => {
  try {
    success(res, await service.getClinicAlerts(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getSecurityCenter = async (req, res) => {
  try {
    success(res, await service.getSecurityCenter(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.addWorkflowNote = async (req, res) => {
  try {
    success(res, await service.addWorkflowNote(req.user._id, req.body), 'Workflow note added successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

