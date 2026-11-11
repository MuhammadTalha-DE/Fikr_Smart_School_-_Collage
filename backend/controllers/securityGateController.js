const service = require('../services/securityGateService');

const success = (res, data, message = null, status = 200) =>
  res.status(status).json({ success: true, ...(message ? { message } : {}), data });

const failure = (res, error, status = 400) =>
  res.status(status).json({ success: false, message: error.message });

exports.getAdminOverview = async (req, res) => {
  try {
    success(res, await service.getAdminOverview());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.listVisitors = async (req, res) => {
  try {
    success(res, await service.listVisitors());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createVisitor = async (req, res) => {
  try {
    success(res, await service.createVisitor(req.body), 'Visitor entry created successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.updateVisitor = async (req, res) => {
  try {
    success(res, await service.updateVisitor(req.params.id, req.body), 'Visitor entry updated successfully');
  } catch (error) {
    failure(res, error);
  }
};

exports.listStudentPasses = async (req, res) => {
  try {
    success(res, await service.listStudentPasses());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createStudentPass = async (req, res) => {
  try {
    success(res, await service.createStudentPass(req.body, req.user._id), 'Student gate pass created successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.updateStudentPass = async (req, res) => {
  try {
    success(res, await service.updateStudentPass(req.params.id, req.body), 'Student gate pass updated successfully');
  } catch (error) {
    failure(res, error);
  }
};

exports.listStaffPasses = async (req, res) => {
  try {
    success(res, await service.listStaffPasses());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createStaffPass = async (req, res) => {
  try {
    success(res, await service.createStaffPass(req.body, req.user._id), 'Staff gate pass created successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.updateStaffPass = async (req, res) => {
  try {
    success(res, await service.updateStaffPass(req.params.id, req.body), 'Staff gate pass updated successfully');
  } catch (error) {
    failure(res, error);
  }
};

exports.listVehicleLogs = async (req, res) => {
  try {
    success(res, await service.listVehicleLogs());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createVehicleLog = async (req, res) => {
  try {
    success(res, await service.createVehicleLog(req.body), 'Vehicle gate log created successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.listNotices = async (req, res) => {
  try {
    success(res, await service.listNotices());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createNotice = async (req, res) => {
  try {
    success(res, await service.createNotice(req.body, req.user._id), 'Security notice created successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.updateNotice = async (req, res) => {
  try {
    success(res, await service.updateNotice(req.params.id, req.body), 'Security notice updated successfully');
  } catch (error) {
    failure(res, error);
  }
};

