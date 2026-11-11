const StudentFeeAccount = require('../models/StudentFeeAccount');
const FeeInstallment = require('../models/FeeInstallment');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Concession = require('../models/Concession');
const Payment = require('../models/Payment');
const asyncHandler = require('express-async-handler');
const notificationAutomationService = require('../services/notificationAutomationService');
const realtimeService = require('../services/realtimeService');

const uniqueStudentCount = (ids) => new Set((ids || []).map((item) => String(item))).size;

// ──────────────────────────────────────────────
// HELPER: attach instalments to an account object
// ──────────────────────────────────────────────
const attachInstalments = async (accounts) => {
  const ids = Array.isArray(accounts) ? accounts.map(a => a._id) : [accounts._id];
  const instalments = await FeeInstallment.find({ studentFeeAccount: { $in: ids } })
    .sort('instalmentNumber')
    .lean();

  const map = {};
  instalments.forEach(i => {
    const accId = i.studentFeeAccount.toString();
    if (!map[accId]) map[accId] = [];
    map[accId].push(i);
  });

  if (Array.isArray(accounts)) {
    accounts.forEach(acc => { acc.instalments = map[acc._id.toString()] || []; });
  } else {
    accounts.instalments = map[accounts._id.toString()] || [];
  }
};

// ──────────────────────────────────────────────
// GET /api/fee-accounts?class=<classId>&hostel=<hostelId>
// Admin – list all fee accounts (filterable)
// ──────────────────────────────────────────────
const getAccounts = asyncHandler(async (req, res) => {
  const filter = {};

  // Filter by class
  if (req.query.class) {
    const studentsInClass = await Student.find({ classId: req.query.class }).select('_id');
    filter.studentId = { $in: studentsInClass.map(s => s._id) };
  }

  // Filter by hostel
  if (req.query.hostel) {
    filter.hostelId = req.query.hostel;
  }

  const accounts = await StudentFeeAccount.find(filter)
    .populate({
      path: 'studentId',
      select: 'userId classId rollNumber admissionNumber',
      populate: { path: 'userId', select: 'name email' },
    })
    .populate('classFeePlanId', 'name')
    .populate('hostelId', 'name')               // ← hostel name now appears
    .lean();

  await attachInstalments(accounts);

  res.json({ success: true, accounts });
});

// ──────────────────────────────────────────────
// GET /api/fee-accounts/:id
// Admin – single account details with payments etc.
// ──────────────────────────────────────────────
const getAccountById = asyncHandler(async (req, res) => {
  const account = await StudentFeeAccount.findById(req.params.id)
    .populate({
      path: 'studentId',
      select: 'userId classId rollNumber admissionNumber',
      populate: { path: 'userId', select: 'name email avatar' },
    })
    .populate('classFeePlanId', 'name instalmentCount dueDay')
    .populate('hostelId', 'name')
    .lean();

  if (!account) {
    res.status(404);
    throw new Error('Fee account not found');
  }

  await attachInstalments(account);

  const payments = await Payment.find({ studentFeeAccount: account._id })
    .populate('receivedBy', 'name')
    .sort({ paymentDate: -1 })
    .lean();

  const concessions = await Concession.find({ studentFeeAccount: account._id })
    .populate('appliedBy', 'name')
    .sort({ date: -1 })
    .lean();

  account.payments = payments;
  account.concessions = concessions;

  res.json({ success: true, account });
});

// ──────────────────────────────────────────────
// GET /api/fee-accounts/my
// Student/Parent – get ALL fee accounts (tuition + hostel)
// ──────────────────────────────────────────────
const getMyAccounts = asyncHandler(async (req, res) => {
  // 1. Determine the student ID(s)
  let studentIds = [];
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      res.status(404);
      throw new Error('Student profile not found');
    }
    studentIds = [student._id];
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ userId: req.user._id });
    if (!parent || !parent.children || parent.children.length === 0) {
      res.status(404);
      throw new Error('No children linked');
    }
    studentIds = parent.children;   // array of ObjectIds
  } else {
    res.status(403);
    throw new Error('Access denied');
  }

  // 2. Fetch all fee accounts for these students
  const accounts = await StudentFeeAccount.find({ studentId: { $in: studentIds } })
    .populate({
      path: 'studentId',
      select: 'userId classId rollNumber',
      populate: { path: 'userId', select: 'name email' },
    })
    .populate('classFeePlanId', 'name')
    .populate('hostelId', 'name')
    .lean();

  await attachInstalments(accounts);

  res.json({ success: true, accounts });
});

// ──────────────────────────────────────────────
// POST /api/fee-accounts/my/pay   (DEPRECATED)
// We keep it for backward compatibility but it now
// redirects to the proper payment endpoint.
// You can remove it after the frontend is updated.
// ──────────────────────────────────────────────
const selfPay = asyncHandler(async (req, res) => {
  // This endpoint is no longer the preferred way.
  // Instead, use POST /api/fee-accounts/:accountId/payments
  res.status(400).json({ message: 'Use /api/fee-accounts/:accountId/payments' });
});

// ──────────────────────────────────────────────
// POST /api/fee-accounts/apply-late-fees
// Admin utility to add late fees to overdue instalments
// ──────────────────────────────────────────────
const applyLateFees = asyncHandler(async (req, res) => {
  const { lateFeeAmount = 50 } = req.body;
  const today = new Date();
  const overdueInstalments = await FeeInstallment.find({
    status: 'unpaid',
    dueDate: { $lt: today }
  });

  let updatedCount = 0;
  const affectedStudentIds = [];
  for (const inst of overdueInstalments) {
    inst.amount += lateFeeAmount;
    await inst.save();

    const account = await StudentFeeAccount.findById(inst.studentFeeAccount);
    if (account) {
      account.totalAmount += lateFeeAmount;
      account.dueAmount = account.totalAmount - account.paidAmount;
      account.status = account.dueAmount <= 0 ? 'paid' : 'unpaid';
      await account.save();
      affectedStudentIds.push(account.studentId);
    }
    updatedCount++;
  }

  if (affectedStudentIds.length) {
    try {
      const audienceUserIds = await notificationAutomationService.getAudienceForStudents(affectedStudentIds, {
        includeStudents: true,
        includeParents: true,
      });

      realtimeService.emitFinanceUpdated({
        accountId: null,
        studentId: null,
        userIds: audienceUserIds,
        amount: lateFeeAmount,
        dueAmount: null,
        status: 'late_fee_applied',
        actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
      });

      notificationAutomationService.dispatch({
        title: 'Late fee applied',
        message: `A late fee of PKR ${lateFeeAmount} has been applied to one or more overdue instalments. Please review the updated due amount in the fee portal.`,
        type: 'finance',
        severity: 'medium',
        channels: ['in_app', 'email'],
        userIds: audienceUserIds,
        roles: ['admin'],
        metadata: {
          entity: 'FeeInstallment',
          tags: ['late-fee'],
          link: '/notifications',
          context: {
            affectedAccounts: uniqueStudentCount(affectedStudentIds),
            lateFeeAmount,
          },
        },
        sourceModule: 'fees',
      }).catch((error) => {
        console.error('Late fee notification dispatch failed:', error.message);
      });
    } catch (notificationError) {
      console.error('Late fee audience resolution failed:', notificationError.message);
    }
  }

  res.json({ success: true, message: `Late fees applied to ${updatedCount} instalments.` });
});
const getParentChildAccounts = asyncHandler(async (req, res) => {
  if (req.user.role !== 'parent') {
    res.status(403);
    throw new Error('Only parents can access');
  }

  const parent = await Parent.findOne({ userId: req.user._id });
  if (!parent) throw new Error('Parent not found');

  const studentId = req.query.studentId;
  if (!studentId || !parent.children.map(c => c.toString()).includes(studentId)) {
    res.status(403);
    throw new Error('Invalid child');
  }

  const accounts = await StudentFeeAccount.find({ studentId })
    .populate('classFeePlanId', 'name')
    .populate('hostelId', 'name')
    .lean();

  await attachInstalments(accounts);
  res.json({ success: true, accounts });
});

module.exports = {
  getAccounts,
  getAccountById,
  getMyAccounts,
  getParentChildAccounts,
  selfPay,            // kept for now, but can be removed later
  applyLateFees,
};
