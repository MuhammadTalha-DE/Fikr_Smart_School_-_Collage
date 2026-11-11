const service = require('../services/transportWorkflowService');

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

exports.getIncidentCenter = async (req, res) => {
  try {
    success(res, await service.getIncidentCenter());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createIncident = async (req, res) => {
  try {
    success(res, await service.createIncident(req.user._id, req.body), 'Transport incident submitted for approval', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.addWorkflowNote = async (req, res) => {
  try {
    success(res, await service.addWorkflowNote(req.user._id, req.body), 'Workflow note added successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

