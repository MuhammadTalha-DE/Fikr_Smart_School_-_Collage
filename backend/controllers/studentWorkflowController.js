const service = require('../services/studentWorkflowService');

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

exports.acknowledgePTMMeeting = async (req, res) => {
  try {
    success(res, await service.acknowledgePTMMeeting(req.user._id, req.params.id, req.body), 'PTM acknowledged successfully');
  } catch (error) {
    failure(res, error);
  }
};

exports.requestPTMReminder = async (req, res) => {
  try {
    success(res, await service.requestPTMReminder(req.user._id, req.params.id, req.body), 'PTM reminder requested successfully');
  } catch (error) {
    failure(res, error);
  }
};

exports.getGatePassCenter = async (req, res) => {
  try {
    success(res, await service.getGatePassCenter(req.user._id));
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

