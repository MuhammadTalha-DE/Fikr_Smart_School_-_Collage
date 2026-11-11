const service = require('../services/teacherWorkspaceService');

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

exports.getSelfServiceCenter = async (req, res) => {
  try {
    success(res, await service.getSelfServiceCenter(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createLeaveRequest = async (req, res) => {
  try {
    success(res, await service.createLeaveRequest(req.user._id, req.body), 'Leave request submitted successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.createGatePass = async (req, res) => {
  try {
    success(res, await service.createGatePass(req.user._id, req.body), 'Staff gate pass submitted successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.getLessonDeliveryTracker = async (req, res) => {
  try {
    success(res, await service.getLessonDeliveryTracker(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.recordLessonDelivery = async (req, res) => {
  try {
    success(res, await service.recordLessonDelivery(req.user._id, req.body), 'Lesson delivery recorded successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.getInterventions = async (req, res) => {
  try {
    success(res, await service.getInterventions(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createIntervention = async (req, res) => {
  try {
    success(res, await service.createIntervention(req.user._id, req.body), 'Intervention created successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.updateIntervention = async (req, res) => {
  try {
    success(res, await service.updateIntervention(req.user._id, req.params.id, req.body), 'Intervention updated successfully');
  } catch (error) {
    failure(res, error);
  }
};

exports.getPTMCenter = async (req, res) => {
  try {
    success(res, await service.getPTMCenter(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createPTMMeeting = async (req, res) => {
  try {
    success(res, await service.createPTMMeeting(req.user._id, req.body), 'PTM meeting scheduled successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.updatePTMMeeting = async (req, res) => {
  try {
    success(res, await service.updatePTMMeeting(req.user._id, req.params.id, req.body), 'PTM meeting updated successfully');
  } catch (error) {
    failure(res, error);
  }
};

exports.getSubstitutionInvigilationCenter = async (req, res) => {
  try {
    success(res, await service.getSubstitutionInvigilationCenter(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getLearningContinuityWorkspace = async (req, res) => {
  try {
    success(res, await service.getLearningContinuityWorkspace(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getTeacherContext = async (req, res) => {
  try {
    success(res, await service.getTeacherContext(req.user._id));
  } catch (error) {
    failure(res, error, 500);
  }
};

