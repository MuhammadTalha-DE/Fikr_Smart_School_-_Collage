const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ClassModel = require('../models/Class');
const BudgetPlan = require('../models/BudgetPlan');
const ComplianceDocument = require('../models/ComplianceDocument');
const StaffLeaveRequest = require('../models/StaffLeaveRequest');
const PurchaseRequest = require('../models/PurchaseRequest');
const HostelApplication = require('../models/HostelApplication');
const HostelLeave = require('../models/HostelLeave');
const StudentGatePass = require('../models/StudentGatePass');
const StaffGatePass = require('../models/StaffGatePass');
const HealthIncident = require('../models/HealthIncident');
const TeacherAttendance = require('../models/TeacherAttendance');
const HostelStudent = require('../models/HostelStudent');
const HostelComplaint = require('../models/HostelComplaint');
const Payment = require('../models/Payment');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const WeatherCurrent = require('../models/WeatherCurrent');
const LearningContinuityLog = require('../models/LearningContinuityLog');
const PTMMeeting = require('../models/PTMMeeting');
const StudentIntervention = require('../models/StudentIntervention');
const TransportIncident = require('../models/TransportIncident');
const TransportAllocation = require('../models/TransportAllocation');
const RouteModel = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const workflowNoteService = require('./workflowNoteService');
const generalLedgerService = require('./generalLedgerService');
const medicalClinicService = require('./medicalClinicService');
const securityGateService = require('./securityGateService');
const hrPayrollService = require('./hrPayrollService');
const notificationAutomationService = require('./notificationAutomationService');

const percent = (value, total) => (total ? Math.round((Number(value || 0) / Number(total || 1)) * 100) : 0);
const safeSum = (items, selector) => items.reduce((sum, item) => sum + Number(selector(item) || 0), 0);

const startOfMonth = (value = new Date()) => new Date(value.getFullYear(), value.getMonth(), 1);

const formatOwner = (user) => user?.name || user?.username || 'System';

const buildApprovalItem = ({ module, entityType, entityId, title, subtitle, requestedBy, requestedAt, priority = 'medium', dueAt = null, actionLabel = 'Review' }) => ({
  module,
  entityType,
  entityId: String(entityId),
  title,
  subtitle,
  requestedBy,
  requestedAt,
  priority,
  dueAt,
  actionLabel,
});

const normalizeBudget = (item) => {
  const allocated = Number(item.allocatedAmount || 0);
  const committed = Number(item.committedAmount || 0);
  const spent = Number(item.spentAmount || 0);
  const remaining = allocated - spent - committed;

  return {
    ...item.toObject?.() || item,
    allocatedAmount: allocated,
    committedAmount: committed,
    spentAmount: spent,
    remainingAmount: remaining,
    utilizationRate: percent(spent + committed, allocated),
    statusSignal:
      remaining < 0 ? 'overrun'
      : spent + committed >= allocated * 0.9 ? 'watch'
      : 'healthy',
  };
};

exports.getBudgetCenter = async () => {
  const [budgets, purchaseRequests, ledgerOverview] = await Promise.all([
    BudgetPlan.find().sort({ fiscalYear: -1, fiscalMonth: -1, department: 1, category: 1 }).lean(),
    PurchaseRequest.find({ status: { $in: ['pending', 'approved', 'ordered'] } }).lean(),
    generalLedgerService.getAdminOverview(),
  ]);

  const normalized = budgets.map((item) => normalizeBudget(item));
  const summary = {
    totalBudgets: normalized.length,
    allocatedAmount: safeSum(normalized, (item) => item.allocatedAmount),
    committedAmount: safeSum(normalized, (item) => item.committedAmount),
    spentAmount: safeSum(normalized, (item) => item.spentAmount),
    remainingAmount: safeSum(normalized, (item) => item.remainingAmount),
    overrunBudgets: normalized.filter((item) => item.remainingAmount < 0).length,
    watchBudgets: normalized.filter((item) => item.statusSignal === 'watch').length,
    pendingPurchaseValue: safeSum(
      purchaseRequests.filter((item) => item.status === 'pending'),
      (item) => item.totalEstimatedCost
    ),
    postedVouchers: ledgerOverview?.summary?.postedVouchers || 0,
  };

  return {
    summary,
    budgets: normalized,
    financeSignals: {
      totalIncome: ledgerOverview?.summary?.totalIncome || 0,
      totalExpense: ledgerOverview?.summary?.totalExpense || 0,
      cashBalance: ledgerOverview?.summary?.cashBalance || 0,
      bankBalance: ledgerOverview?.summary?.bankBalance || 0,
    },
  };
};

exports.createBudget = async (payload, userId) => {
  const record = await BudgetPlan.create({
    ...payload,
    fiscalYear: Number(payload.fiscalYear || new Date().getFullYear()),
    fiscalMonth: Number(payload.fiscalMonth || new Date().getMonth() + 1),
    allocatedAmount: Number(payload.allocatedAmount || 0),
    committedAmount: Number(payload.committedAmount || 0),
    spentAmount: Number(payload.spentAmount || 0),
    createdBy: userId,
  });

  return normalizeBudget(record);
};

exports.updateBudget = async (id, payload) => {
  const record = await BudgetPlan.findById(id);
  if (!record) {
    throw new Error('Budget record not found');
  }

  Object.assign(record, {
    department: payload.department ?? record.department,
    category: payload.category ?? record.category,
    fiscalYear: payload.fiscalYear !== undefined ? Number(payload.fiscalYear) : record.fiscalYear,
    fiscalMonth: payload.fiscalMonth !== undefined ? Number(payload.fiscalMonth) : record.fiscalMonth,
    allocatedAmount: payload.allocatedAmount !== undefined ? Number(payload.allocatedAmount) : record.allocatedAmount,
    committedAmount: payload.committedAmount !== undefined ? Number(payload.committedAmount) : record.committedAmount,
    spentAmount: payload.spentAmount !== undefined ? Number(payload.spentAmount) : record.spentAmount,
    status: payload.status ?? record.status,
    ownerRole: payload.ownerRole ?? record.ownerRole,
    notes: payload.notes ?? record.notes,
  });

  await record.save();
  return normalizeBudget(record);
};

exports.getComplianceCenter = async () => {
  const documents = await ComplianceDocument.find()
    .populate('updatedBy', 'name role')
    .sort({ dueDate: 1, updatedAt: -1 })
    .lean();

  const now = new Date();
  const reviewThreshold = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return {
    summary: {
      totalDocuments: documents.length,
      active: documents.filter((item) => item.status === 'active').length,
      reviewDue: documents.filter((item) => item.status === 'review_due' || (item.dueDate && new Date(item.dueDate) <= reviewThreshold)).length,
      expired: documents.filter((item) => item.status === 'expired' || (item.dueDate && new Date(item.dueDate) < now)).length,
      restricted: documents.filter((item) => item.visibility === 'restricted').length,
    },
    documents,
  };
};

exports.createComplianceDocument = async (payload, userId) => {
  return ComplianceDocument.create({
    ...payload,
    updatedBy: userId,
  });
};

exports.updateComplianceDocument = async (id, payload, userId) => {
  const record = await ComplianceDocument.findById(id);
  if (!record) {
    throw new Error('Compliance document not found');
  }

  Object.assign(record, {
    title: payload.title ?? record.title,
    category: payload.category ?? record.category,
    ownerRole: payload.ownerRole ?? record.ownerRole,
    linkedModule: payload.linkedModule ?? record.linkedModule,
    dueDate: payload.dueDate ?? record.dueDate,
    status: payload.status ?? record.status,
    visibility: payload.visibility ?? record.visibility,
    documentUrl: payload.documentUrl ?? record.documentUrl,
    summary: payload.summary ?? record.summary,
    tags: payload.tags ?? record.tags,
    updatedBy: userId,
  });

  await record.save();
  return record;
};

exports.getApprovalsCenter = async () => {
  const [purchases, hostelApplications, hostelLeaves, studentPasses, staffPasses, staffLeaves, incidents, transportIncidents] = await Promise.all([
    PurchaseRequest.find({ status: 'pending' }).populate('requestedBy', 'name role').sort({ createdAt: -1 }).lean(),
    HostelApplication.find({ status: 'pending' }).populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } }).sort({ createdAt: -1 }).lean(),
    HostelLeave.find({ status: 'pending' })
      .populate({ path: 'hostelStudentId', populate: { path: 'studentId', populate: { path: 'userId', select: 'name' } } })
      .sort({ createdAt: -1 })
      .lean(),
    StudentGatePass.find({ status: 'pending' }).populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } }).sort({ createdAt: -1 }).lean(),
    StaffGatePass.find({ status: 'pending' }).populate('userId', 'name role').sort({ createdAt: -1 }).lean(),
    StaffLeaveRequest.find({ status: 'pending' }).populate('userId', 'name role').sort({ createdAt: -1 }).lean(),
    HealthIncident.find({ status: 'open', severity: { $in: ['high', 'critical'] } })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 })
      .lean(),
    TransportIncident.find({ status: 'pending' })
      .populate('routeId', 'name')
      .populate('vehicleId', 'registrationNumber')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const items = [
    ...purchases.map((item) =>
      buildApprovalItem({
        module: 'Inventory',
        entityType: 'purchase_request',
        entityId: item._id,
        title: item.title,
        subtitle: `${item.department} | ${item.priority} | PKR ${Number(item.totalEstimatedCost || 0).toLocaleString()}`,
        requestedBy: formatOwner(item.requestedBy),
        requestedAt: item.createdAt,
        priority: item.priority,
      })
    ),
    ...hostelApplications.map((item) =>
      buildApprovalItem({
        module: 'Hostel',
        entityType: 'hostel_application',
        entityId: item._id,
        title: `${item.studentId?.userId?.name || 'Student'} hostel application`,
        subtitle: item.reason || 'Hostel admission request awaiting review',
        requestedBy: item.studentId?.userId?.name || 'Student',
        requestedAt: item.createdAt,
      })
    ),
    ...hostelLeaves.map((item) =>
      buildApprovalItem({
        module: 'Hostel',
        entityType: 'hostel_leave',
        entityId: item._id,
        title: `${item.hostelStudentId?.studentId?.userId?.name || 'Student'} leave request`,
        subtitle: `${item.leaveType} | ${new Date(item.fromDate).toLocaleDateString()} to ${new Date(item.toDate).toLocaleDateString()}`,
        requestedBy: item.hostelStudentId?.studentId?.userId?.name || 'Student',
        requestedAt: item.createdAt,
        priority: item.leaveType === 'medical' ? 'high' : 'medium',
      })
    ),
    ...studentPasses.map((item) =>
      buildApprovalItem({
        module: 'Security',
        entityType: 'student_gate_pass',
        entityId: item._id,
        title: `${item.studentId?.userId?.name || 'Student'} gate pass`,
        subtitle: `${item.passType} | ${item.reason}`,
        requestedBy: item.studentId?.userId?.name || 'Student',
        requestedAt: item.createdAt,
        priority: 'high',
      })
    ),
    ...staffPasses.map((item) =>
      buildApprovalItem({
        module: 'Security',
        entityType: 'staff_gate_pass',
        entityId: item._id,
        title: `${item.userId?.name || 'Staff'} staff gate pass`,
        subtitle: `${item.passType} | ${item.reason}`,
        requestedBy: item.userId?.name || 'Staff',
        requestedAt: item.createdAt,
      })
    ),
    ...staffLeaves.map((item) =>
      buildApprovalItem({
        module: 'HR',
        entityType: 'staff_leave_request',
        entityId: item._id,
        title: `${item.userId?.name || 'Staff'} leave request`,
        subtitle: `${item.leaveType} | ${new Date(item.fromDate).toLocaleDateString()} to ${new Date(item.toDate).toLocaleDateString()}`,
        requestedBy: item.userId?.name || 'Staff',
        requestedAt: item.createdAt,
      })
    ),
    ...incidents.map((item) =>
      buildApprovalItem({
        module: 'Clinic',
        entityType: 'medical_escalation',
        entityId: item._id,
        title: `${item.studentId?.userId?.name || 'Student'} medical escalation`,
        subtitle: `${item.incidentType} | ${item.severity} severity`,
        requestedBy: 'Clinic Desk',
        requestedAt: item.createdAt,
        priority: item.severity,
        actionLabel: 'Escalate',
      })
    ),
    ...transportIncidents.map((item) =>
      buildApprovalItem({
        module: 'Transport',
        entityType: 'transport_incident',
        entityId: item._id,
        title: item.title,
        subtitle: `${item.category} | ${item.routeId?.name || item.vehicleId?.registrationNumber || 'Shared route'}${item.delayMinutes ? ` | ${item.delayMinutes} min` : ''}`,
        requestedBy: formatOwner(item.createdBy),
        requestedAt: item.createdAt,
        priority: item.severity,
        actionLabel: 'Approve Notice',
      })
    ),
  ].sort((left, right) => new Date(right.requestedAt) - new Date(left.requestedAt));

  const notesMap = await workflowNoteService.getNotesForItems(items);

  return {
    summary: {
      totalPending: items.length,
      byModule: {
        inventory: items.filter((item) => item.module === 'Inventory').length,
        hostel: items.filter((item) => item.module === 'Hostel').length,
        security: items.filter((item) => item.module === 'Security').length,
        hr: items.filter((item) => item.module === 'HR').length,
        clinic: items.filter((item) => item.module === 'Clinic').length,
        transport: items.filter((item) => item.module === 'Transport').length,
      },
      critical: items.filter((item) => ['critical', 'high'].includes(item.priority)).length,
    },
    items: items.map((item) => {
      const notes = notesMap.get(`${item.entityType}:${item.entityId}`) || [];
      return {
        ...item,
        noteCount: notes.length,
        latestNote: notes[0]
          ? {
              actorRole: notes[0].actorRole,
              actionType: notes[0].actionType,
              note: notes[0].note,
              createdAt: notes[0].createdAt,
            }
          : null,
      };
    }),
  };
};

exports.applyApprovalAction = async ({ entityType, entityId, decision, note = '' }, reviewerId) => {
  const isApproved = decision === 'approved';

  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Unsupported approval decision');
  }

  let updated = null;

  if (entityType === 'purchase_request') {
    updated = await PurchaseRequest.findByIdAndUpdate(entityId, { status: decision }, { new: true });
  }

  if (entityType === 'hostel_application') {
    updated = await HostelApplication.findByIdAndUpdate(
      entityId,
      {
        status: decision,
        approvedBy: isApproved ? reviewerId : null,
        rejectionReason: isApproved ? '' : note,
      },
      { new: true }
    );
  }

  if (entityType === 'hostel_leave') {
    updated = await HostelLeave.findByIdAndUpdate(
      entityId,
      {
        status: decision,
        approvedBy: isApproved ? reviewerId : null,
        rejectionReason: isApproved ? '' : note,
      },
      { new: true }
    );
  }

  if (entityType === 'student_gate_pass') {
    updated = await StudentGatePass.findByIdAndUpdate(
      entityId,
      {
        status: decision,
        approvedBy: isApproved ? reviewerId : null,
      },
      { new: true }
    );
  }

  if (entityType === 'staff_gate_pass') {
    updated = await StaffGatePass.findByIdAndUpdate(
      entityId,
      {
        status: decision,
        approvedBy: isApproved ? reviewerId : null,
      },
      { new: true }
    );
  }

  if (entityType === 'staff_leave_request') {
    updated = await StaffLeaveRequest.findByIdAndUpdate(
      entityId,
      {
        status: decision,
        reviewedBy: reviewerId,
        reviewNote: note,
      },
      { new: true }
    );
  }

  if (entityType === 'medical_escalation') {
    updated = await HealthIncident.findByIdAndUpdate(
      entityId,
      {
        status: isApproved ? 'monitoring' : 'resolved',
        parentAlerted: isApproved ? true : undefined,
        actionTaken: note,
      },
      { new: true }
    );
  }

  if (entityType === 'transport_incident') {
    const incident = await TransportIncident.findById(entityId);
    if (!incident) {
      throw new Error('Workflow item not found');
    }

    incident.status = isApproved ? 'approved' : 'rejected';
    incident.approvedBy = isApproved ? reviewerId : null;
    incident.approvalNote = note;
    incident.reviewedAt = new Date();

    if (isApproved) {
      const [vehicle, route] = await Promise.all([
        incident.vehicleId ? Vehicle.findById(incident.vehicleId).lean() : Promise.resolve(null),
        incident.routeId ? RouteModel.findById(incident.routeId).lean() : Promise.resolve(null),
      ]);

      const allocationFilter = { isActive: true };
      if (incident.vehicleId) allocationFilter.vehicle = incident.vehicleId;
      if (incident.routeId) allocationFilter.route = incident.routeId;

      const allocations = await TransportAllocation.find(allocationFilter).select('student').lean();
      const audienceStudentIds = allocations.map((item) => item.student);
      const audienceUserIds = await notificationAutomationService.getAudienceForStudents(audienceStudentIds, {
        includeStudents: true,
        includeParents: true,
      });

      try {
        const notification = await notificationAutomationService.dispatch({
          title: incident.title,
          message: incident.description || `Transport operations reported a ${incident.category} affecting school routes${incident.delayMinutes ? ` with an estimated ${incident.delayMinutes}-minute delay` : ''}.`,
          type: 'transport',
          severity: incident.severity,
          channels: ['in_app', 'email'],
          roles: ['admin', 'transport'],
          userIds: audienceUserIds,
          metadata: {
            entity: 'TransportIncident',
            entityId: incident._id,
            link: '/notifications',
            context: {
              routeId: route?._id || null,
              routeName: route?.name || '',
              vehicleId: vehicle?._id || null,
              vehicleNumber: vehicle?.registrationNumber || '',
              delayMinutes: incident.delayMinutes,
              category: incident.category,
            },
          },
          sourceModule: 'transport',
        }, { _id: reviewerId, role: 'admin' });

        incident.parentNoticeStatus = 'sent';
        incident.parentNoticeSentAt = new Date();
        incident.audienceCount = audienceUserIds.length;
        incident.notificationId = notification?._id || null;
        incident.status = 'notified';
      } catch (dispatchError) {
        incident.parentNoticeStatus = 'failed';
      }
    }

    updated = await incident.save();
  }

  if (!updated) {
    throw new Error('Workflow item not found');
  }

  if (note) {
    await workflowNoteService.createNote({
      entityType,
      entityId,
      actorId: reviewerId,
      actorRole: 'admin',
      actionType: decision === 'approved' ? 'approve' : 'reject',
      note,
      visibility: 'shared',
    });
  }

  return updated;
};

exports.getClinicOperations = async () => {
  const [overview, criticalIncidents] = await Promise.all([
    medicalClinicService.getAdminOverview(),
    HealthIncident.find({ status: { $ne: 'resolved' }, severity: { $in: ['high', 'critical'] } })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    ...overview,
    summary: {
      ...(overview.summary || {}),
      criticalIncidents: criticalIncidents.length,
    },
    criticalIncidents,
  };
};

exports.getSecurityOperations = async () => {
  const overview = await securityGateService.getAdminOverview();

  return {
    ...overview,
    summary: {
      ...(overview.summary || {}),
      unresolvedVisitorActions: (overview.visitors || []).filter((item) => item.status === 'pending').length,
    },
  };
};

exports.getStaffSelfServiceOversight = async () => {
  const [hrOverview, leaveRequests, gatePasses, ptms] = await Promise.all([
    hrPayrollService.getAdminOverview(),
    StaffLeaveRequest.find().populate('userId', 'name role').sort({ createdAt: -1 }).limit(12).lean(),
    StaffGatePass.find().populate('userId', 'name role').sort({ createdAt: -1 }).limit(12).lean(),
    PTMMeeting.find().populate('teacherId').sort({ scheduledAt: -1 }).limit(8).lean(),
  ]);

  return {
    summary: {
      totalStaff: hrOverview.summary.totalStaff,
      pendingLeaveRequests: leaveRequests.filter((item) => item.status === 'pending').length,
      pendingGatePasses: gatePasses.filter((item) => item.status === 'pending').length,
      scheduledPTMs: ptms.filter((item) => item.status === 'scheduled').length,
    },
    hrOverview,
    leaveRequests,
    gatePasses,
    ptmMeetings: ptms,
  };
};

exports.getManagementBICenter = async () => {
  const monthStart = startOfMonth();
  const [users, students, teachers, classes, payments, approvals, complaints, continuityLogs, weather] = await Promise.all([
    User.countDocuments(),
    Student.countDocuments(),
    Teacher.countDocuments(),
    ClassModel.countDocuments(),
    Payment.find({ createdAt: { $gte: monthStart } }).lean(),
    exports.getApprovalsCenter(),
    HostelComplaint.countDocuments({ status: { $ne: 'resolved' } }),
    LearningContinuityLog.find({ date: { $gte: monthStart } }).lean(),
    WeatherCurrent.findOne().sort({ recordedAt: -1 }).lean(),
  ]);

  return {
    summary: {
      platformUsers: users,
      students,
      teachers,
      classes,
      monthlyCollections: safeSum(payments, (item) => item.amount),
      pendingApprovals: approvals.summary.totalPending,
      openComplaints: complaints,
      continuityScoreAverage: continuityLogs.length
        ? Math.round(safeSum(continuityLogs, (item) => item.continuityScore) / continuityLogs.length)
        : 0,
    },
    kpis: [
      { key: 'users', label: 'Platform Users', value: users },
      { key: 'students', label: 'Students', value: students },
      { key: 'teachers', label: 'Teachers', value: teachers },
      { key: 'collections', label: 'Monthly Collections', value: safeSum(payments, (item) => item.amount) },
      { key: 'approvals', label: 'Pending Approvals', value: approvals.summary.totalPending },
      { key: 'weather', label: 'Campus Temperature', value: Number(weather?.temperature || 0) },
    ],
  };
};

exports.getPrincipalCommandCenter = async () => {
  const [bi, clinic, security, staff, budgetCenter, announcements, notifications] = await Promise.all([
    exports.getManagementBICenter(),
    exports.getClinicOperations(),
    exports.getSecurityOperations(),
    exports.getStaffSelfServiceOversight(),
    exports.getBudgetCenter(),
    Announcement.countDocuments(),
    Notification.countDocuments(),
  ]);

  return {
    summary: {
      students: bi.summary.students,
      teachers: bi.summary.teachers,
      monthlyCollections: bi.summary.monthlyCollections,
      pendingApprovals: bi.summary.pendingApprovals,
      criticalHealthSignals: clinic.summary.criticalIncidents || 0,
      securityAlerts: security.summary.activeSecurityNotices || 0,
      staffPendingActions: (staff.summary.pendingLeaveRequests || 0) + (staff.summary.pendingGatePasses || 0),
    },
    leadershipSignals: [
      {
        label: 'Budget Health',
        value: `${budgetCenter.summary.overrunBudgets} overrun / ${budgetCenter.summary.watchBudgets} on watch`,
      },
      {
        label: 'Clinic Readiness',
        value: `${clinic.summary.openIncidents || 0} open incidents`,
      },
      {
        label: 'Security Readiness',
        value: `${security.summary.activeSecurityNotices || 0} active notices`,
      },
      {
        label: 'Campus Communication',
        value: `${announcements} announcements / ${notifications} notifications`,
      },
    ],
  };
};

exports.getAdminOverview = async () => {
  const [budgetCenter, approvals, compliance, clinicOps, securityOps, staffOversight, biCenter, principal] = await Promise.all([
    exports.getBudgetCenter(),
    exports.getApprovalsCenter(),
    exports.getComplianceCenter(),
    exports.getClinicOperations(),
    exports.getSecurityOperations(),
    exports.getStaffSelfServiceOversight(),
    exports.getManagementBICenter(),
    exports.getPrincipalCommandCenter(),
  ]);

  return {
    summary: {
      budgetLines: budgetCenter.summary.totalBudgets,
      pendingApprovals: approvals.summary.totalPending,
      complianceItems: compliance.summary.totalDocuments,
      criticalHealthSignals: clinicOps.summary.criticalIncidents || 0,
      activeSecurityNotices: securityOps.summary.activeSecurityNotices || 0,
      staffPendingActions: (staffOversight.summary.pendingLeaveRequests || 0) + (staffOversight.summary.pendingGatePasses || 0),
      monthlyCollections: biCenter.summary.monthlyCollections,
    },
    budgetCenter: budgetCenter.summary,
    approvals: approvals.summary,
    compliance: compliance.summary,
    clinicOps: clinicOps.summary,
    securityOps: securityOps.summary,
    staffOversight: staffOversight.summary,
    biCenter: biCenter.summary,
    principal: principal.summary,
    principalSignals: principal.leadershipSignals,
  };
};
