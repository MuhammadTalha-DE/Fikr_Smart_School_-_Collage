const service = require('../services/parentWorkflowService');

const success = (res, data, message = null, status = 200) =>
  res.status(status).json({ success: true, ...(message ? { message } : {}), data });

const failure = (res, error, status = 400) =>
  res.status(status).json({ success: false, message: error.message });

exports.getOverview = async (req, res) => {
  try {
    success(res, await service.getOverview(req.user._id, req.query.studentId || ''));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getPTMCenter = async (req, res) => {
  try {
    success(res, await service.getPTMCenter(req.user._id, req.query.studentId || ''));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.respondToPTMMeeting = async (req, res) => {
  try {
    success(res, await service.respondToPTMMeeting(req.user._id, req.params.id, req.body), 'PTM response saved successfully');
  } catch (error) {
    failure(res, error);
  }
};

exports.getInterventions = async (req, res) => {
  try {
    success(res, await service.getInterventions(req.user._id, req.query.studentId || ''));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getClinicAlerts = async (req, res) => {
  try {
    success(res, await service.getClinicAlerts(req.user._id, req.query.studentId || ''));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getSecurityCenter = async (req, res) => {
  try {
    success(res, await service.getSecurityCenter(req.user._id, req.query.studentId || ''));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.respondToGatePass = async (req, res) => {
  try {
    success(res, await service.respondToGatePass(req.user._id, req.params.id, req.body), 'Gate pass response saved successfully');
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

