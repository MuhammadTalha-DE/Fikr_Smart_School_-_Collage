const User = require('../models/User');
const Teacher = require('../models/Teacher');
const TeacherAttendance = require('../models/TeacherAttendance');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const STAFF_ROLES = ['admin', 'teacher', 'librarian', 'warden', 'transport', 'driver'];

const ROLE_TO_DEPARTMENT = {
  admin: 'Administration',
  teacher: 'Academics',
  librarian: 'Library Services',
  warden: 'Hostel Operations',
  transport: 'Transport Operations',
  driver: 'Transport Operations',
};

const ROLE_TO_DESIGNATION = {
  admin: 'Administrator',
  teacher: 'Teacher',
  librarian: 'Librarian',
  warden: 'Hostel Warden',
  transport: 'Transport Officer',
  driver: 'Driver',
};

const PAYROLL_COMPONENTS = {
  allowances: [
    { key: 'housing', label: 'Housing Allowance' },
    { key: 'transport', label: 'Transport Allowance' },
    { key: 'meal', label: 'Meal Allowance' },
  ],
  deductions: [
    { key: 'tax', label: 'Tax' },
    { key: 'advance', label: 'Advance Recovery' },
    { key: 'lateness', label: 'Late Arrival Deduction' },
  ],
};

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

const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);

const staffSearchFilter = (search = '') => {
  const filter = { role: { $in: STAFF_ROLES } };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
};

const buildTeacherDirectoryMap = async (users) => {
  const teacherUserIds = users
    .filter((user) => user.role === 'teacher')
    .map((user) => user._id);

  if (!teacherUserIds.length) {
    return new Map();
  }

  const teacherProfiles = await Teacher.find({ userId: { $in: teacherUserIds } })
    .populate('classes', 'name')
    .lean();

  return new Map(teacherProfiles.map((profile) => [String(profile.userId), profile]));
};

const toStaffRecord = (user, teacherProfile) => {
  const department = ROLE_TO_DEPARTMENT[user.role] || 'General';
  const designation = ROLE_TO_DESIGNATION[user.role] || 'Staff';
  const classes = teacherProfile?.classes || [];
  const subjects = teacherProfile?.subjects || [];

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    phone: user.phone || '',
    role: user.role,
    department,
    designation,
    employeeCode: String(user.username || user._id).toUpperCase(),
    subjects,
    subjectCount: subjects.length,
    classes: classes.map((item) => ({ _id: item._id, name: item.name })),
    classCount: classes.length,
    joinedAt: user.createdAt,
    profileCompleteness: [
      user.name,
      user.email,
      user.phone,
      department,
      designation,
    ].filter(Boolean).length,
  };
};

const getStaffDirectory = async ({ search = '', limit = 250 } = {}) => {
  const users = await User.find(staffSearchFilter(search))
    .sort({ name: 1 })
    .limit(limit)
    .lean();

  const teacherMap = await buildTeacherDirectoryMap(users);

  return users.map((user) => toStaffRecord(user, teacherMap.get(String(user._id))));
};

const getDepartmentBreakdown = (staffRecords) => {
  const counts = staffRecords.reduce((acc, record) => {
    if (!acc[record.department]) {
      acc[record.department] = {
        department: record.department,
        total: 0,
        roles: {},
      };
    }

    acc[record.department].total += 1;
    acc[record.department].roles[record.role] = (acc[record.department].roles[record.role] || 0) + 1;
    return acc;
  }, {});

  return Object.values(counts).sort((left, right) => right.total - left.total);
};

const getTeacherAttendanceSnapshot = async () => {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const monthStart = startOfMonth();
  const now = new Date();

  const [todayRecords, monthRecords, dailyTrend] = await Promise.all([
    TeacherAttendance.find({ date: { $gte: todayStart, $lte: todayEnd } }).lean(),
    TeacherAttendance.find({ date: { $gte: monthStart, $lte: now } }).lean(),
    TeacherAttendance.aggregate([
      {
        $match: {
          date: { $gte: new Date(now.getTime() - (6 * 24 * 60 * 60 * 1000)), $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]),
  ]);

  const summarize = (records) => {
    const summary = {
      total: records.length,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      halfDay: 0,
      totalLateMinutes: 0,
    };

    records.forEach((record) => {
      if (record.status === 'present') summary.present += 1;
      if (record.status === 'absent') summary.absent += 1;
      if (record.status === 'late') summary.late += 1;
      if (record.status === 'leave') summary.leave += 1;
      if (record.status === 'half_day') summary.halfDay += 1;
      summary.totalLateMinutes += Number(record.lateMinutes || 0);
    });

    summary.percentage = summary.total ? Math.round((summary.present / summary.total) * 100) : 0;
    return summary;
  };

  return {
    today: summarize(todayRecords),
    month: summarize(monthRecords),
    dailyTrend,
    lastMarkedAt: todayRecords.length
      ? todayRecords
          .map((record) => new Date(record.updatedAt || record.createdAt || record.date))
          .sort((left, right) => right - left)[0]
      : null,
  };
};

const getRecentSignals = async () => {
  const [notifications, audits] = await Promise.all([
    Notification.find({
      $or: [
        { 'audience.sendToAll': true },
        { 'audience.roles': { $in: STAFF_ROLES } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    AuditLog.find({
      module: { $in: ['notifications', 'attendance', 'dashboard', 'finance', 'transport', 'hostels'] },
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
  ]);

  return { notifications, audits };
};

exports.getAdminOverview = async () => {
  const [staffRecords, teacherAttendance, recentSignals] = await Promise.all([
    getStaffDirectory(),
    getTeacherAttendanceSnapshot(),
    getRecentSignals(),
  ]);

  const departmentBreakdown = getDepartmentBreakdown(staffRecords);
  const teachers = staffRecords.filter((record) => record.role === 'teacher');
  const operationsStaff = staffRecords.filter((record) => record.role !== 'teacher');
  const currentMonthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return {
    summary: {
      totalStaff: staffRecords.length,
      teachers: teachers.length,
      operationsStaff: operationsStaff.length,
      departments: departmentBreakdown.length,
      notifications: recentSignals.notifications.length,
      auditSignals: recentSignals.audits.length,
    },
    teacherAttendance,
    departmentBreakdown,
    recentStaff: staffRecords
      .slice()
      .sort((left, right) => new Date(right.joinedAt) - new Date(left.joinedAt))
      .slice(0, 8),
    recentSignals,
    payrollWindow: {
      monthLabel: currentMonthLabel,
      payableStaff: staffRecords.length,
      attendanceBackedTeachers: teacherAttendance.month.total,
      cycleStatus: teacherAttendance.month.total ? 'attendance-ready' : 'awaiting-attendance-input',
      components: PAYROLL_COMPONENTS,
    },
    moduleReadiness: [
      { key: 'staff-master', label: 'Staff master records', status: 'active' },
      { key: 'departments', label: 'Departments and designations', status: 'active' },
      { key: 'attendance', label: 'Employee attendance monitoring', status: 'active' },
      { key: 'notifications', label: 'HR notifications', status: 'active' },
      { key: 'audit', label: 'HR audit visibility', status: 'active' },
      { key: 'leave', label: 'Leave management workflow', status: 'next' },
      { key: 'payroll', label: 'Monthly payroll engine', status: 'next' },
      { key: 'payslips', label: 'Payslip distribution', status: 'next' },
      { key: 'appraisal', label: 'Performance and appraisal', status: 'next' },
    ],
  };
};

exports.getStaffDirectory = async (options = {}) => {
  const records = await getStaffDirectory(options);

  return {
    total: records.length,
    records,
    departments: getDepartmentBreakdown(records),
  };
};

exports.getAttendanceCenter = async () => {
  const [staffRecords, teacherAttendance] = await Promise.all([
    getStaffDirectory(),
    getTeacherAttendanceSnapshot(),
  ]);

  return {
    summary: {
      totalStaff: staffRecords.length,
      teacherCount: staffRecords.filter((record) => record.role === 'teacher').length,
      nonTeachingCount: staffRecords.filter((record) => record.role !== 'teacher').length,
      trackedRoles: ['teacher'],
      untrackedRoles: ['admin', 'librarian', 'warden', 'transport', 'driver'],
    },
    teacherAttendance,
  };
};

exports.getPayrollCenter = async () => {
  const [staffRecords, teacherAttendance] = await Promise.all([
    getStaffDirectory(),
    getTeacherAttendanceSnapshot(),
  ]);

  const totalStaff = staffRecords.length;
  const contactReady = staffRecords.filter((record) => record.email && record.phone).length;

  return {
    summary: {
      payrollMonth: new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
      totalStaff,
      contactReady,
      attendanceReadyTeachers: teacherAttendance.month.total,
      setupCoverage: totalStaff ? Math.round((contactReady / totalStaff) * 100) : 0,
    },
    components: PAYROLL_COMPONENTS,
    recommendedActions: [
      'Finalize salary structures for each department and designation.',
      'Add allowance and deduction rules before running the first monthly cycle.',
      'Connect staff leave approvals to payroll cut-off logic.',
      'Enable payslip publishing through the Notification Center when payroll runs are approved.',
    ],
  };
};
