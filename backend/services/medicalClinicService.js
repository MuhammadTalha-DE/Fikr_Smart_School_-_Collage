const MedicalProfile = require('../models/MedicalProfile');
const ClinicVisit = require('../models/ClinicVisit');
const MedicineLog = require('../models/MedicineLog');
const HealthIncident = require('../models/HealthIncident');

exports.getAdminOverview = async () => {
  const [profiles, visits, medicines, incidents] = await Promise.all([
    MedicalProfile.find()
      .populate({ path: 'studentId', select: 'admissionNumber classId', populate: [{ path: 'userId', select: 'name' }, { path: 'classId', select: 'name' }] })
      .sort({ updatedAt: -1 })
      .lean(),
    ClinicVisit.find()
      .populate({ path: 'studentId', select: 'admissionNumber classId', populate: [{ path: 'userId', select: 'name' }, { path: 'classId', select: 'name' }] })
      .populate('recordedBy', 'name')
      .sort({ visitDate: -1 })
      .limit(12)
      .lean(),
    MedicineLog.find()
      .populate({ path: 'studentId', select: 'admissionNumber', populate: { path: 'userId', select: 'name' } })
      .populate('administeredBy', 'name')
      .sort({ administeredAt: -1 })
      .limit(12)
      .lean(),
    HealthIncident.find()
      .populate({ path: 'studentId', select: 'admissionNumber', populate: { path: 'userId', select: 'name' } })
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean(),
  ]);

  return {
    summary: {
      profiles: profiles.length,
      clinicVisits: visits.length,
      medicineLogs: medicines.length,
      openIncidents: incidents.filter((item) => item.status !== 'resolved').length,
      parentAlerts: visits.filter((item) => item.parentAlerted).length + incidents.filter((item) => item.parentAlerted).length,
      hostelHealthIncidents: incidents.filter((item) => item.incidentType === 'hostel').length,
    },
    profiles,
    recentVisits: visits,
    medicineLogs: medicines,
    incidents,
  };
};

exports.listProfiles = () =>
  MedicalProfile.find()
    .populate({ path: 'studentId', select: 'admissionNumber classId', populate: [{ path: 'userId', select: 'name' }, { path: 'classId', select: 'name' }] })
    .sort({ updatedAt: -1 })
    .lean();

exports.upsertProfile = async (payload) => {
  const profile = await MedicalProfile.findOneAndUpdate(
    { studentId: payload.studentId },
    payload,
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return MedicalProfile.findById(profile._id)
    .populate({ path: 'studentId', select: 'admissionNumber classId', populate: [{ path: 'userId', select: 'name' }, { path: 'classId', select: 'name' }] })
    .lean();
};

exports.listVisits = () =>
  ClinicVisit.find()
    .populate({ path: 'studentId', select: 'admissionNumber classId', populate: [{ path: 'userId', select: 'name' }, { path: 'classId', select: 'name' }] })
    .populate('recordedBy', 'name')
    .sort({ visitDate: -1 })
    .lean();

exports.createVisit = async (payload, userId) => {
  const visit = await ClinicVisit.create({ ...payload, recordedBy: userId });
  return ClinicVisit.findById(visit._id)
    .populate({ path: 'studentId', select: 'admissionNumber classId', populate: [{ path: 'userId', select: 'name' }, { path: 'classId', select: 'name' }] })
    .populate('recordedBy', 'name')
    .lean();
};

exports.listMedicineLogs = () =>
  MedicineLog.find()
    .populate({ path: 'studentId', select: 'admissionNumber', populate: { path: 'userId', select: 'name' } })
    .populate('administeredBy', 'name')
    .sort({ administeredAt: -1 })
    .lean();

exports.createMedicineLog = async (payload, userId) => {
  const log = await MedicineLog.create({ ...payload, administeredBy: userId });
  return MedicineLog.findById(log._id)
    .populate({ path: 'studentId', select: 'admissionNumber', populate: { path: 'userId', select: 'name' } })
    .populate('administeredBy', 'name')
    .lean();
};

exports.listIncidents = () =>
  HealthIncident.find()
    .populate({ path: 'studentId', select: 'admissionNumber', populate: { path: 'userId', select: 'name' } })
    .populate('recordedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

exports.createIncident = async (payload, userId) => {
  const incident = await HealthIncident.create({ ...payload, recordedBy: userId });
  return HealthIncident.findById(incident._id)
    .populate({ path: 'studentId', select: 'admissionNumber', populate: { path: 'userId', select: 'name' } })
    .populate('recordedBy', 'name')
    .lean();
};
