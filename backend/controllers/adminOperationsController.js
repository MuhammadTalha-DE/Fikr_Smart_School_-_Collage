const service = require('../services/adminOperationsService');

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

exports.getBudgetCenter = async (req, res) => {
  try {
    success(res, await service.getBudgetCenter());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createBudget = async (req, res) => {
  try {
    success(res, await service.createBudget(req.body, req.user._id), 'Budget line created successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.updateBudget = async (req, res) => {
  try {
    success(res, await service.updateBudget(req.params.id, req.body), 'Budget line updated successfully');
  } catch (error) {
    failure(res, error);
  }
};

exports.getApprovalsCenter = async (req, res) => {
  try {
    success(res, await service.getApprovalsCenter());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.applyApprovalAction = async (req, res) => {
  try {
    success(
      res,
      await service.applyApprovalAction(req.body, req.user._id),
      `Workflow item ${req.body.decision} successfully`
    );
  } catch (error) {
    failure(res, error);
  }
};

exports.getComplianceCenter = async (req, res) => {
  try {
    success(res, await service.getComplianceCenter());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.createComplianceDocument = async (req, res) => {
  try {
    success(res, await service.createComplianceDocument(req.body, req.user._id), 'Compliance document created successfully', 201);
  } catch (error) {
    failure(res, error);
  }
};

exports.updateComplianceDocument = async (req, res) => {
  try {
    success(res, await service.updateComplianceDocument(req.params.id, req.body, req.user._id), 'Compliance document updated successfully');
  } catch (error) {
    failure(res, error);
  }
};

exports.getClinicOperations = async (req, res) => {
  try {
    success(res, await service.getClinicOperations());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getSecurityOperations = async (req, res) => {
  try {
    success(res, await service.getSecurityOperations());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getStaffSelfServiceOversight = async (req, res) => {
  try {
    success(res, await service.getStaffSelfServiceOversight());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getManagementBICenter = async (req, res) => {
  try {
    success(res, await service.getManagementBICenter());
  } catch (error) {
    failure(res, error, 500);
  }
};

exports.getPrincipalCommandCenter = async (req, res) => {
  try {
    success(res, await service.getPrincipalCommandCenter());
  } catch (error) {
    failure(res, error, 500);
  }
};

