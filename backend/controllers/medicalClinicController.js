const service = require('../services/medicalClinicService');

const handleSuccess = (res, data, message = null, status = 200) =>
  res.status(status).json({ success: true, ...(message ? { message } : {}), data });

const handleError = (res, error, status = 400) =>
  res.status(status).json({ success: false, message: error.message });

exports.getAdminOverview = async (req, res) => {
  try {
    handleSuccess(res, await service.getAdminOverview());
  } catch (error) {
    handleError(res, error, 500);
  }
};

exports.listProfiles = async (req, res) => {
  try {
    handleSuccess(res, await service.listProfiles());
  } catch (error) {
    handleError(res, error, 500);
  }
};

exports.upsertProfile = async (req, res) => {
  try {
    handleSuccess(res, await service.upsertProfile(req.body), 'Medical profile saved successfully', 201);
  } catch (error) {
    handleError(res, error);
  }
};

exports.listVisits = async (req, res) => {
  try {
    handleSuccess(res, await service.listVisits());
  } catch (error) {
    handleError(res, error, 500);
  }
};

exports.createVisit = async (req, res) => {
  try {
    handleSuccess(res, await service.createVisit(req.body, req.user._id), 'Clinic visit recorded successfully', 201);
  } catch (error) {
    handleError(res, error);
  }
};

exports.listMedicineLogs = async (req, res) => {
  try {
    handleSuccess(res, await service.listMedicineLogs());
  } catch (error) {
    handleError(res, error, 500);
  }
};

exports.createMedicineLog = async (req, res) => {
  try {
    handleSuccess(res, await service.createMedicineLog(req.body, req.user._id), 'Medicine log created successfully', 201);
  } catch (error) {
    handleError(res, error);
  }
};

exports.listIncidents = async (req, res) => {
  try {
    handleSuccess(res, await service.listIncidents());
  } catch (error) {
    handleError(res, error, 500);
  }
};

exports.createIncident = async (req, res) => {
  try {
    handleSuccess(res, await service.createIncident(req.body, req.user._id), 'Health incident recorded successfully', 201);
  } catch (error) {
    handleError(res, error);
  }
};
