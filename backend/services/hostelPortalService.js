const Hostel = require('../models/Hostel');
const HostelRoom = require('../models/HostelRoom');
const HostelBed = require('../models/HostelBed');
const HostelStudent = require('../models/HostelStudent');
const HostelApplication = require('../models/HostelApplication');
const HostelLeave = require('../models/HostelLeave');
const HostelVisitor = require('../models/HostelVisitor');
const HostelComplaint = require('../models/HostelComplaint');
const HostelAttendance = require('../models/HostelAttendance');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const Student = require('../models/Student');
const Parent = require('../models/Parent');

const startOfDay = (date = new Date()) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date = new Date()) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const getStudentByUser = async (userId) =>
  Student.findOne({ userId }).populate('userId', 'name').populate('classId', 'name').lean();

const getParentByUser = async (userId) =>
  Parent.findOne({ userId })
    .populate({
      path: 'children',
      populate: [
        { path: 'userId', select: 'name' },
        { path: 'classId', select: 'name' },
      ],
    })
    .lean();

const buildOccupancySnapshot = async (hostelId) => {
  const rooms = await HostelRoom.find({ hostelId }).lean();
  const roomIds = rooms.map((room) => room._id);
  const [totalBeds, occupiedBeds, activeResidents] = await Promise.all([
    HostelBed.countDocuments({ roomId: { $in: roomIds } }),
    HostelBed.countDocuments({ roomId: { $in: roomIds }, status: 'occupied' }),
    HostelStudent.countDocuments({ hostelId, status: 'active' }),
  ]);

  return {
    totalBeds,
    occupiedBeds,
    availableBeds: Math.max(0, totalBeds - occupiedBeds),
    occupancyRate: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    activeResidents,
    roomCount: rooms.length,
  };
};

const getResidentAttendanceSummary = async (resident) => {
  if (!resident) {
    return {
      totalDays: 0,
      present: 0,
      absent: 0,
      onLeave: 0,
      attendanceRate: 0,
      recent: [],
    };
  }

  const records = await HostelAttendance.find({
    hostelId: resident.hostelId?._id || resident.hostelId,
    'records.hostelStudentId': resident._id,
  })
    .sort({ date: -1 })
    .limit(30)
    .lean();

  const recent = records.map((entry) => {
    const residentRecord = (entry.records || []).find(
      (record) => String(record.hostelStudentId) === String(resident._id)
    );
    return {
      date: entry.date,
      status: residentRecord?.status || 'unknown',
      remark: residentRecord?.remark || '',
    };
  });

  const present = recent.filter((item) => item.status === 'present').length;
  const absent = recent.filter((item) => item.status === 'absent').length;
  const onLeave = recent.filter((item) => item.status === 'on_leave').length;
  const totalDays = recent.length;

  return {
    totalDays,
    present,
    absent,
    onLeave,
    attendanceRate: totalDays ? Math.round((present / totalDays) * 100) : 0,
    recent,
  };
};

const getFeeSummary = async ({ studentId = null, hostelId = null } = {}) => {
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (hostelId) filter.hostelId = hostelId;
  if (!hostelId) filter.hostelId = { $ne: null };

  const accounts = await StudentFeeAccount.find(filter).populate('hostelId', 'name').lean();
  const totalAmount = accounts.reduce((sum, account) => sum + Number(account.totalAmount || 0), 0);
  const paidAmount = accounts.reduce((sum, account) => sum + Number(account.paidAmount || 0), 0);

  return {
    accounts,
    totalAmount,
    paidAmount,
    dueAmount: Math.max(0, totalAmount - paidAmount),
    paidRate: totalAmount ? Math.round((paidAmount / totalAmount) * 100) : 0,
  };
};

const getStudentResidentOverview = async (studentId) => {
  const resident = await HostelStudent.findOne({ studentId, status: 'active' })
    .populate('hostelId', 'name type address status')
    .populate('roomId', 'roomNumber floor roomType capacity')
    .populate('bedId', 'bedNumber status')
    .lean();

  const [attendance, leaves, visitors, complaints, applications, feeSummary] = await Promise.all([
    getResidentAttendanceSummary(resident),
    resident
      ? HostelLeave.find({ hostelStudentId: resident._id }).sort({ createdAt: -1 }).limit(5).lean()
      : Promise.resolve([]),
    resident
      ? HostelVisitor.find({ hostelStudentId: resident._id }).sort({ createdAt: -1 }).limit(5).lean()
      : Promise.resolve([]),
    resident
      ? HostelComplaint.find({ hostelStudentId: resident._id }).sort({ createdAt: -1 }).limit(5).lean()
      : Promise.resolve([]),
    HostelApplication.find({ studentId }).sort({ createdAt: -1 }).limit(3).lean(),
    resident ? getFeeSummary({ studentId, hostelId: resident.hostelId?._id || resident.hostelId }) : Promise.resolve({ accounts: [], totalAmount: 0, paidAmount: 0, dueAmount: 0, paidRate: 0 }),
  ]);

  const latestApplication = applications[0] || null;

  return {
    resident,
    attendance,
    leaves,
    visitors,
    complaints,
    applications,
    latestApplication,
    feeSummary,
    actionSummary: {
      pendingLeaves: leaves.filter((item) => item.status === 'pending').length,
      pendingVisitors: visitors.filter((item) => item.status === 'pending').length,
      openComplaints: complaints.filter((item) => item.status !== 'resolved').length,
    },
  };
};

exports.getStudentOverview = async (userId) => {
  const student = await getStudentByUser(userId);
  if (!student) {
    throw new Error('Student profile not found');
  }

  const overview = await getStudentResidentOverview(student._id);

  return {
    student: {
      _id: student._id,
      name: student.userId?.name || 'Student',
      className: student.classId?.name || 'Not assigned',
      admissionNumber: student.admissionNumber || '',
    },
    ...overview,
  };
};

exports.getStudentStatus = async (userId) => {
  const overview = await exports.getStudentOverview(userId);
  const resident = overview.resident;

  if (!resident) {
    return {
      status: overview.latestApplication?.status || 'not_applied',
      hostel: null,
      room: null,
      bed: null,
    };
  }

  return {
    status: 'active',
    hostel: resident.hostelId,
    room: resident.roomId,
    bed: resident.bedId,
  };
};

exports.getParentOverview = async (userId, selectedChildId = '') => {
  const parent = await getParentByUser(userId);
  if (!parent) {
    throw new Error('Parent profile not found');
  }

  const children = parent.children || [];
  const chosenChild = children.find((child) => String(child._id) === String(selectedChildId)) || children[0] || null;

  let childOverview = null;
  if (chosenChild) {
    childOverview = await getStudentResidentOverview(chosenChild._id);
  }

  return {
    children: children.map((child) => ({
      _id: child._id,
      name: child.userId?.name || 'Child',
      className: child.classId?.name || 'Not assigned',
      admissionNumber: child.admissionNumber || '',
    })),
    selectedChildId: chosenChild?._id || null,
    childOverview: chosenChild ? {
      child: {
        _id: chosenChild._id,
        name: chosenChild.userId?.name || 'Child',
        className: chosenChild.classId?.name || 'Not assigned',
        admissionNumber: chosenChild.admissionNumber || '',
      },
      ...childOverview,
    } : null,
  };
};

exports.getWardenOverview = async (userId) => {
  const hostel = await Hostel.findOne({ wardenId: userId }).lean();
  if (!hostel) {
    throw new Error('You are not assigned to a hostel');
  }

  const residents = await HostelStudent.find({ hostelId: hostel._id, status: 'active' })
    .populate({
      path: 'studentId',
      select: 'admissionNumber classId',
      populate: [
        { path: 'userId', select: 'name' },
        { path: 'classId', select: 'name' },
      ],
    })
    .populate('roomId', 'roomNumber')
    .populate('bedId', 'bedNumber')
    .sort({ createdAt: -1 })
    .lean();

  const residentIds = residents.map((resident) => resident._id);
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const [occupancy, todayAttendance, recentLeaves, recentVisitors, recentComplaints, feeSummary] = await Promise.all([
    buildOccupancySnapshot(hostel._id),
    HostelAttendance.findOne({ hostelId: hostel._id, date: { $gte: todayStart, $lte: todayEnd } }).lean(),
    HostelLeave.find({ hostelStudentId: { $in: residentIds } })
      .populate({ path: 'hostelStudentId', populate: { path: 'studentId', select: 'userId', populate: { path: 'userId', select: 'name' } } })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    HostelVisitor.find({ hostelStudentId: { $in: residentIds } })
      .populate({ path: 'hostelStudentId', populate: { path: 'studentId', select: 'userId', populate: { path: 'userId', select: 'name' } } })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    HostelComplaint.find({ hostelStudentId: { $in: residentIds } })
      .populate({ path: 'hostelStudentId', populate: { path: 'studentId', select: 'userId', populate: { path: 'userId', select: 'name' } } })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    getFeeSummary({ hostelId: hostel._id }),
  ]);

  const attendanceRecords = todayAttendance?.records || [];

  return {
    hostel,
    occupancy,
    todayAttendance: {
      present: attendanceRecords.filter((item) => item.status === 'present').length,
      absent: attendanceRecords.filter((item) => item.status === 'absent').length,
      onLeave: attendanceRecords.filter((item) => item.status === 'on_leave').length,
      total: attendanceRecords.length,
    },
    residentPreview: residents.slice(0, 8),
    queues: {
      pendingLeaves: recentLeaves.filter((item) => item.status === 'pending').length,
      pendingVisitors: recentVisitors.filter((item) => item.status === 'pending').length,
      openComplaints: recentComplaints.filter((item) => item.status !== 'resolved').length,
    },
    recentLeaves,
    recentVisitors,
    recentComplaints,
    feeSummary,
  };
};

exports.getAdminOverview = async () => {
  const hostels = await Hostel.find().populate('wardenId', 'name email').sort({ name: 1 }).lean();

  const hostelCards = await Promise.all(
    hostels.map(async (hostel) => ({
      ...hostel,
      ...(await buildOccupancySnapshot(hostel._id)),
    }))
  );

  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const [applications, recentLeaves, recentVisitors, recentComplaints, feeSummary, todayAttendanceRecords] = await Promise.all([
    HostelApplication.find()
      .populate({
        path: 'studentId',
        select: 'admissionNumber classId',
        populate: [
          { path: 'userId', select: 'name' },
          { path: 'classId', select: 'name' },
        ],
      })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    HostelLeave.find()
      .populate({ path: 'hostelStudentId', populate: { path: 'studentId', select: 'userId', populate: { path: 'userId', select: 'name' } } })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    HostelVisitor.find()
      .populate({ path: 'hostelStudentId', populate: { path: 'studentId', select: 'userId', populate: { path: 'userId', select: 'name' } } })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    HostelComplaint.find()
      .populate({ path: 'hostelStudentId', populate: { path: 'studentId', select: 'userId', populate: { path: 'userId', select: 'name' } } })
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    getFeeSummary(),
    HostelAttendance.find({ date: { $gte: todayStart, $lte: todayEnd } }).lean(),
  ]);

  const totalAttendanceRecords = todayAttendanceRecords.flatMap((entry) => entry.records || []);

  return {
    hostels: hostelCards,
    summary: {
      totalHostels: hostelCards.length,
      activeHostels: hostelCards.filter((item) => item.status === 'active').length,
      activeResidents: hostelCards.reduce((sum, item) => sum + Number(item.activeResidents || 0), 0),
      availableBeds: hostelCards.reduce((sum, item) => sum + Number(item.availableBeds || 0), 0),
      pendingApplications: applications.filter((item) => item.status === 'pending').length,
      pendingLeaves: recentLeaves.filter((item) => item.status === 'pending').length,
      pendingVisitors: recentVisitors.filter((item) => item.status === 'pending').length,
      openComplaints: recentComplaints.filter((item) => item.status !== 'resolved').length,
      attendanceRate: totalAttendanceRecords.length
        ? Math.round((totalAttendanceRecords.filter((item) => item.status === 'present').length / totalAttendanceRecords.length) * 100)
        : 0,
    },
    feeSummary,
    recentApplications: applications,
    recentLeaves,
    recentVisitors,
    recentComplaints,
  };
};
