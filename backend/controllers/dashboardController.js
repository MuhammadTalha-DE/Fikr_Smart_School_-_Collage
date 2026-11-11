const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const Announcement = require('../models/Announcement');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Payment = require('../models/Payment');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const Book = require('../models/Book');
const LibraryTransaction = require('../models/LibraryTransaction');
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const TransportAllocation = require('../models/TransportAllocation');
const Hostel = require('../models/Hostel');
const HostelStudent = require('../models/HostelStudent');
const HostelApplication = require('../models/HostelApplication');
const HostelComplaint = require('../models/HostelComplaint');
const HostelLeave = require('../models/HostelLeave');
const EmergencyAlert = require('../models/EmergencyAlert');
const IncidentReport = require('../models/IncidentReport');
const EmergencyContact = require('../models/EmergencyContact');
const Admission = require('../models/Admission');
const Message = require('../models/Message');
const Exam = require('../models/Exam');

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const buildActivity = ({ id, module, type, action, time, href, tone = 'neutral' }) => ({
  id: `${module}-${type}-${id || time || Date.now()}`,
  module,
  type,
  action,
  time,
  href,
  tone,
});

const normalizeCurrency = (value) => Number((value || 0).toFixed(2));

// @desc    Get system-wide admin dashboard data
// @route   GET /api/dashboard/admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const next7Days = endOfDay(addDays(now, 7));
  const next14Days = endOfDay(addDays(now, 14));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = addDays(now, -7);

  const latestAttendanceRecord = await Attendance.findOne({})
    .sort({ date: -1 })
    .select('date')
    .lean();

  const attendanceRange = latestAttendanceRecord
    ? {
        $gte: startOfDay(latestAttendanceRecord.date),
        $lte: endOfDay(latestAttendanceRecord.date),
      }
    : null;

  const [
    totalUsers,
    roleBreakdown,
    totalStudents,
    totalTeachers,
    totalParents,
    totalClasses,
    totalAnnouncements,
    unreadMessages,
    messagesLast7Days,
    admissionSummary,
    upcomingAssignments,
    upcomingExams,
    financeSummary,
    monthlyCollectionResult,
    totalCollectionResult,
    librarySummary,
    currentIssuedLoans,
    overdueLoans,
    totalRoutes,
    activeRoutes,
    totalVehicles,
    activeVehicles,
    activeAllocations,
    totalHostels,
    activeHostels,
    activeResidents,
    pendingHostelApplications,
    openHostelComplaints,
    pendingHostelLeaves,
    totalAlerts,
    activeAlerts,
    criticalAlerts,
    totalIncidents,
    pendingIncidents,
    activeEmergencyContacts,
    performanceSummary,
    recentUsers,
    recentAnnouncements,
    recentAdmissions,
    recentPayments,
    recentAlerts,
    recentIncidents,
    recentHostelApplications,
    attendanceCounts,
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    Student.countDocuments(),
    Teacher.countDocuments(),
    Parent.countDocuments(),
    Class.countDocuments(),
    Announcement.countDocuments(),
    Message.countDocuments({ read: false }),
    Message.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Admission.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$applicationStatus', 'pending'] }, 1, 0],
            },
          },
          accepted: {
            $sum: {
              $cond: [{ $eq: ['$applicationStatus', 'accepted'] }, 1, 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ['$applicationStatus', 'rejected'] }, 1, 0],
            },
          },
        },
      },
    ]),
    Assignment.find({
      dueDate: { $gte: todayStart, $lte: next7Days },
    })
      .populate('classId', 'name')
      .select('title dueDate classId createdAt')
      .sort({ dueDate: 1 })
      .limit(8)
      .lean(),
    Exam.find({
      date: { $gte: todayStart, $lte: next14Days },
    })
      .populate('classId', 'name')
      .select('name date classId session createdAt')
      .sort({ date: 1 })
      .limit(8)
      .lean(),
    StudentFeeAccount.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalDue: { $sum: '$dueAmount' },
          paidAccounts: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
          },
          partialAccounts: {
            $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] },
          },
          pendingAccounts: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          unpaidAccounts: {
            $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] },
          },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { paymentDate: { $gte: monthStart, $lte: now } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Book.aggregate([
      {
        $group: {
          _id: null,
          titles: { $sum: 1 },
          copies: { $sum: '$totalQuantity' },
          availableCopies: { $sum: '$availableQuantity' },
        },
      },
    ]),
    LibraryTransaction.countDocuments({ status: 'issued' }),
    LibraryTransaction.countDocuments({
      $or: [
        { status: 'overdue' },
        { status: 'issued', dueDate: { $lt: now } },
      ],
    }),
    Route.countDocuments(),
    Route.countDocuments({ isActive: true }),
    Vehicle.countDocuments(),
    Vehicle.countDocuments({ isActive: true }),
    TransportAllocation.countDocuments({ isActive: true }),
    Hostel.countDocuments(),
    Hostel.countDocuments({ status: 'active' }),
    HostelStudent.countDocuments({ status: 'active' }),
    HostelApplication.countDocuments({ status: 'pending' }),
    HostelComplaint.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    HostelLeave.countDocuments({ status: 'pending' }),
    EmergencyAlert.countDocuments(),
    EmergencyAlert.countDocuments({ status: 'active' }),
    EmergencyAlert.countDocuments({ severity: 'critical', status: 'active' }),
    IncidentReport.countDocuments(),
    IncidentReport.countDocuments({ status: { $in: ['reported', 'investigating'] } }),
    EmergencyContact.countDocuments({ isActive: true }),
    Marks.aggregate([
      { $match: { totalMarks: { $gt: 0 } } },
      {
        $project: {
          classId: 1,
          percentage: {
            $multiply: [{ $divide: ['$marksObtained', '$totalMarks'] }, 100],
          },
        },
      },
      {
        $group: {
          _id: '$classId',
          average: { $avg: '$percentage' },
          recordCount: { $sum: 1 },
        },
      },
      { $sort: { average: -1 } },
    ]),
    User.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name role createdAt')
      .lean(),
    Announcement.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title createdAt')
      .lean(),
    Admission.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select('studentName applicationStatus createdAt')
      .lean(),
    Payment.find({})
      .sort({ paymentDate: -1 })
      .limit(3)
      .select('amount paymentDate mode')
      .lean(),
    EmergencyAlert.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title severity status createdAt')
      .lean(),
    IncidentReport.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title severity status createdAt')
      .lean(),
    HostelApplication.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select('status createdAt')
      .lean(),
    attendanceRange
      ? Attendance.aggregate([
          { $match: { date: attendanceRange } },
          {
            $group: {
              _id: null,
              present: {
                $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
              },
              absent: {
                $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
              },
            },
          },
        ])
      : Promise.resolve([]),
  ]);

  const roleCounts = roleBreakdown.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const finance = financeSummary[0] || {
    totalAmount: 0,
    totalPaid: 0,
    totalDue: 0,
    paidAccounts: 0,
    partialAccounts: 0,
    pendingAccounts: 0,
    unpaidAccounts: 0,
  };

  const library = librarySummary[0] || {
    titles: 0,
    copies: 0,
    availableCopies: 0,
  };

  const admissions = admissionSummary[0] || {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  };

  const attendance = attendanceCounts[0] || { present: 0, absent: 0 };
  const attendanceTotal = attendance.present + attendance.absent;
  const attendanceRate = attendanceTotal > 0
    ? Number(((attendance.present / attendanceTotal) * 100).toFixed(1))
    : 0;

  const classIds = performanceSummary
    .map((item) => item._id)
    .filter(Boolean);

  const classDetails = classIds.length
    ? await Class.find({ _id: { $in: classIds } })
        .select('name')
        .lean()
    : [];

  const classMap = classDetails.reduce((acc, item) => {
    acc[item._id.toString()] = item.name;
    return acc;
  }, {});

  const classPerformance = performanceSummary
    .map((item) => ({
      classId: item._id,
      name: classMap[item._id?.toString()] || 'Unknown Class',
      average: Number((item.average || 0).toFixed(1)),
      recordCount: item.recordCount || 0,
    }))
    .filter((item) => item.classId);

  const topClasses = classPerformance.slice(0, 5);
  const bottomClasses = [...classPerformance]
    .sort((a, b) => a.average - b.average)
    .slice(0, 5);

  const monthlyCollection = normalizeCurrency(monthlyCollectionResult[0]?.total);
  const totalCollection = normalizeCurrency(totalCollectionResult[0]?.total);

  const recentActivities = [
    ...recentUsers.map((item) =>
      buildActivity({
        id: item._id,
        module: 'users',
        type: 'created',
        action: `New ${item.role} account created: ${item.name}`,
        time: item.createdAt,
        href: '/admin/users',
        tone: 'info',
      })
    ),
    ...recentAnnouncements.map((item) =>
      buildActivity({
        id: item._id,
        module: 'announcements',
        type: 'published',
        action: `Announcement published: ${item.title}`,
        time: item.createdAt,
        href: '/admin/announcements',
        tone: 'info',
      })
    ),
    ...recentAdmissions.map((item) =>
      buildActivity({
        id: item._id,
        module: 'admissions',
        type: 'submitted',
        action: `Admission ${item.applicationStatus}: ${item.studentName}`,
        time: item.createdAt,
        href: '/admin/admissions',
        tone: item.applicationStatus === 'pending' ? 'warning' : 'success',
      })
    ),
    ...recentPayments.map((item) =>
      buildActivity({
        id: item._id,
        module: 'finance',
        type: 'payment',
        action: `Fee payment received: PKR ${Number(item.amount || 0).toLocaleString()}`,
        time: item.paymentDate || item.createdAt,
        href: '/admin/reports/collection',
        tone: 'success',
      })
    ),
    ...recentAlerts.map((item) =>
      buildActivity({
        id: item._id,
        module: 'safety',
        type: 'alert',
        action: `Safety alert ${item.status}: ${item.title}`,
        time: item.createdAt,
        href: '/admin/safety-dashboard',
        tone: item.severity === 'critical' ? 'danger' : 'warning',
      })
    ),
    ...recentIncidents.map((item) =>
      buildActivity({
        id: item._id,
        module: 'safety',
        type: 'incident',
        action: `Incident ${item.status}: ${item.title}`,
        time: item.createdAt,
        href: '/admin/safety-dashboard',
        tone: item.severity === 'critical' ? 'danger' : 'warning',
      })
    ),
    ...recentHostelApplications.map((item) =>
      buildActivity({
        id: item._id,
        module: 'hostel',
        type: 'application',
        action: `Hostel application ${item.status}`,
        time: item.createdAt,
        href: '/admin/hostel-applications',
        tone: item.status === 'pending' ? 'warning' : 'info',
      })
    ),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 12);

  const upcomingEvents = [
    ...upcomingAssignments.map((item) => ({
      id: `assignment-${item._id}`,
      type: 'assignment',
      title: item.title,
      subtitle: item.classId?.name || 'All Classes',
      date: item.dueDate,
      href: '/admin/analytics',
    })),
    ...upcomingExams.map((item) => ({
      id: `exam-${item._id}`,
      type: 'exam',
      title: item.name,
      subtitle: `${item.classId?.name || 'Class TBD'}${item.session ? ` • ${item.session}` : ''}`,
      date: item.date,
      href: '/admin/exams',
    })),
  ]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 12);

  const attentionItems = [
    {
      key: 'criticalAlerts',
      title: 'Critical safety alerts',
      count: criticalAlerts,
      description: 'Immediate action recommended for active critical alerts.',
      href: '/admin/safety-dashboard',
      tone: 'danger',
    },
    {
      key: 'pendingIncidents',
      title: 'Pending incident reports',
      count: pendingIncidents,
      description: 'Safety cases still reported or under investigation.',
      href: '/admin/safety-dashboard',
      tone: 'warning',
    },
    {
      key: 'outstandingFees',
      title: 'Accounts with outstanding balances',
      count: finance.partialAccounts + finance.pendingAccounts + finance.unpaidAccounts,
      description: 'Student fee accounts still need collection follow-up.',
      href: '/admin/student-fee-accounts',
      tone: 'warning',
    },
    {
      key: 'overdueLoans',
      title: 'Overdue library loans',
      count: overdueLoans,
      description: 'Library issues need reminders or recovery action.',
      href: '/library/issue-return',
      tone: 'warning',
    },
    {
      key: 'hostelApplications',
      title: 'Pending hostel applications',
      count: pendingHostelApplications,
      description: 'Hostel placement requests waiting for review.',
      href: '/admin/hostel-applications',
      tone: 'info',
    },
    {
      key: 'admissionsPending',
      title: 'Pending admissions',
      count: admissions.pending,
      description: 'Admissions pipeline items still waiting for a decision.',
      href: '/admin/admissions',
      tone: 'info',
    },
  ].filter((item) => item.count > 0);

  res.json({
    generatedAt: now.toISOString(),
    systemStatus: {
      realtime: true,
      autoRefreshSeconds: 30,
    },
    overview: {
      people: {
        totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        parents: totalParents,
        classes: totalClasses,
        admins: roleCounts.admin || 0,
        wardens: roleCounts.warden || 0,
        librarians: roleCounts.librarian || 0,
      },
      academics: {
        assignmentsDueSoon: upcomingAssignments.length,
        examsUpcoming: upcomingExams.length,
        attendanceRate,
        averagePerformance: classPerformance.length
          ? Number(
              (
                classPerformance.reduce((sum, item) => sum + item.average, 0) /
                classPerformance.length
              ).toFixed(1)
            )
          : 0,
      },
      finance: {
        monthlyCollection,
        totalCollection,
        billedAmount: normalizeCurrency(finance.totalAmount),
        paidAmount: normalizeCurrency(finance.totalPaid),
        outstandingAmount: normalizeCurrency(finance.totalDue),
        paidAccounts: finance.paidAccounts,
        partialAccounts: finance.partialAccounts,
        pendingAccounts: finance.pendingAccounts,
        unpaidAccounts: finance.unpaidAccounts,
      },
      library: {
        titles: library.titles,
        copies: library.copies,
        availableCopies: library.availableCopies,
        issuedLoans: currentIssuedLoans,
        overdueLoans,
      },
      transport: {
        routes: totalRoutes,
        activeRoutes,
        vehicles: totalVehicles,
        activeVehicles,
        activeAllocations,
      },
      hostel: {
        totalHostels,
        activeHostels,
        activeResidents,
        pendingApplications: pendingHostelApplications,
        openComplaints: openHostelComplaints,
        pendingLeaves: pendingHostelLeaves,
      },
      safety: {
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        totalIncidents,
        pendingIncidents,
        emergencyContacts: activeEmergencyContacts,
      },
      admissions,
      communication: {
        announcements: totalAnnouncements,
        unreadMessages,
        messagesLast7Days,
      },
    },
    recentActivities,
    upcomingEvents,
    attentionItems,
    attendance: {
      present: attendance.present,
      absent: attendance.absent,
      rate: attendanceRate,
      asOf: latestAttendanceRecord?.date || null,
    },
    topClasses,
    bottomClasses,
  });
});

module.exports = { getAdminDashboard };
