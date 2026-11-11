const CampusVisitorEntry = require('../models/CampusVisitorEntry');
const StudentGatePass = require('../models/StudentGatePass');
const StaffGatePass = require('../models/StaffGatePass');
const VehicleGateLog = require('../models/VehicleGateLog');
const SecurityNotice = require('../models/SecurityNotice');

const startOfDay = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

exports.getAdminOverview = async () => {
  const today = startOfDay();

  const [visitors, studentPasses, staffPasses, vehicleLogs, notices] = await Promise.all([
    CampusVisitorEntry.find().sort({ entryTime: -1 }).limit(12).lean(),
    StudentGatePass.find()
      .populate({ path: 'studentId', select: 'admissionNumber', populate: { path: 'userId', select: 'name' } })
      .populate('approvedBy', 'name')
      .sort({ exitTime: -1 })
      .limit(12)
      .lean(),
    StaffGatePass.find()
      .populate('userId', 'name role')
      .populate('approvedBy', 'name')
      .sort({ exitTime: -1 })
      .limit(12)
      .lean(),
    VehicleGateLog.find().sort({ loggedAt: -1 }).limit(12).lean(),
    SecurityNotice.find().populate('createdBy', 'name').sort({ createdAt: -1 }).limit(12).lean(),
  ]);

  return {
    summary: {
      activeVisitors: visitors.filter((item) => item.status === 'checked_in').length,
      pendingStudentPasses: studentPasses.filter((item) => item.status === 'pending').length,
      pendingStaffPasses: staffPasses.filter((item) => item.status === 'pending').length,
      vehicleLogsToday: vehicleLogs.filter((item) => new Date(item.loggedAt) >= today).length,
      activeSecurityNotices: notices.filter((item) => item.status === 'active').length,
      lockdownNotices: notices.filter((item) => item.noticeType === 'lockdown' && item.status === 'active').length,
    },
    visitors,
    studentPasses,
    staffPasses,
    vehicleLogs,
    notices,
  };
};

exports.listVisitors = () =>
  CampusVisitorEntry.find().sort({ entryTime: -1 }).lean();

exports.createVisitor = (payload) =>
  CampusVisitorEntry.create(payload);

exports.updateVisitor = (id, payload) =>
  CampusVisitorEntry.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();

exports.listStudentPasses = () =>
  StudentGatePass.find()
    .populate({ path: 'studentId', select: 'admissionNumber', populate: { path: 'userId', select: 'name' } })
    .populate('approvedBy', 'name')
    .sort({ exitTime: -1 })
    .lean();

exports.createStudentPass = (payload, userId) =>
  StudentGatePass.create({ ...payload, issuedBy: userId });

exports.updateStudentPass = (id, payload) =>
  StudentGatePass.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
    .populate({ path: 'studentId', select: 'admissionNumber', populate: { path: 'userId', select: 'name' } })
    .populate('approvedBy', 'name')
    .lean();

exports.listStaffPasses = () =>
  StaffGatePass.find()
    .populate('userId', 'name role')
    .populate('approvedBy', 'name')
    .sort({ exitTime: -1 })
    .lean();

exports.createStaffPass = (payload, userId) =>
  StaffGatePass.create({ ...payload, issuedBy: userId });

exports.updateStaffPass = (id, payload) =>
  StaffGatePass.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
    .populate('userId', 'name role')
    .populate('approvedBy', 'name')
    .lean();

exports.listVehicleLogs = () =>
  VehicleGateLog.find().sort({ loggedAt: -1 }).lean();

exports.createVehicleLog = (payload) =>
  VehicleGateLog.create(payload);

exports.listNotices = () =>
  SecurityNotice.find().populate('createdBy', 'name').sort({ createdAt: -1 }).lean();

exports.createNotice = (payload, userId) =>
  SecurityNotice.create({ ...payload, createdBy: userId });

exports.updateNotice = (id, payload) =>
  SecurityNotice.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
    .populate('createdBy', 'name')
    .lean();
