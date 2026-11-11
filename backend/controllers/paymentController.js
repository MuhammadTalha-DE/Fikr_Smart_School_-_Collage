const Payment = require('../models/Payment');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const FeeInstallment = require('../models/FeeInstallment');
const Student = require('../models/Student');            // added
const Parent = require('../models/Parent');
const auditService = require('../services/auditService'); // already present
const asyncHandler = require('express-async-handler');
const notificationAutomationService = require('../services/notificationAutomationService');
const realtimeService = require('../services/realtimeService');

// POST /api/fee-accounts/:accountId/pay
const recordPayment = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const { instalmentId, amount, mode, paymentDate, reference, remarks } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Valid amount is required');
  }

  const account = await StudentFeeAccount.findById(accountId);
  if (!account) {
    res.status(404);
    throw new Error('Fee account not found');
  }

  if (req.user.role === 'student') {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student || account.studentId.toString() !== student._id.toString()) {
    res.status(403);
    throw new Error('You can only pay your own fee account');
  }
} else if (req.user.role === 'parent') {
  const parent = await Parent.findOne({ userId: req.user._id });
  if (!parent || !parent.children.map(c => c.toString()).includes(account.studentId.toString())) {
    res.status(403);
    throw new Error('You can only pay for your child\'s fee account');
  }
}

  // Create payment record
  const payment = await Payment.create({
    studentFeeAccount: accountId,
    instalment: instalmentId || null,
    amount,
    mode: mode || 'cash',
    paymentDate: paymentDate || new Date(),
    reference,
    receivedBy: req.user._id,
    remarks,
  });

  // Update account paid amount and due amount
  account.paidAmount += amount;
  account.dueAmount = account.totalAmount - account.paidAmount;
  account.status = account.dueAmount <= 0 ? 'paid' : 'unpaid';

  // If an instalment is specified, update its status
  if (instalmentId) {
    const instalment = await FeeInstallment.findById(instalmentId);
    if (instalment) {
      instalment.status = 'paid';
      instalment.paidDate = paymentDate || new Date();
      await instalment.save();
    }
  }

  await account.save();

  // --------------------------------------------------
  // AUDIT LOG (non‑blocking)
  // --------------------------------------------------
  try {
    // 1. Fetch student name via the fee account
    const student = await Student.findById(account.studentId)
      .populate('userId', 'name')
      .lean();
    const studentName = student?.userId?.name || 'Unknown';

    // 2. Fetch instalment number if applicable
    let instalmentNumber = 'N/A';
    if (instalmentId) {
      const inst = await FeeInstallment.findById(instalmentId).lean();
      instalmentNumber = inst?.instalmentNumber || 'N/A';
    }

    // 3. Write the audit entry
    await auditService.log({
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment._id,
      description: `Payment of ${payment.amount} recorded for instalment #${instalmentNumber} (${studentName})`,
      performedBy: {
        userId: req.user._id,
        role: req.user.role,
        name: req.user.name,
      },
      changes: {
        before: null,
        after: {
          amount: payment.amount,
          mode: payment.mode,
          paymentDate: payment.paymentDate,
        },
      },
      req,
    });
  } catch (auditError) {
    console.error('Audit log failed:', auditError.message);
  }

  try {
    const audienceUserIds = await notificationAutomationService.getAudienceForStudents(
      [account.studentId],
      { includeStudents: true, includeParents: true }
    );

    realtimeService.emitFinanceUpdated({
      accountId,
      studentId: account.studentId,
      userIds: audienceUserIds,
      amount: payment.amount,
      dueAmount: account.dueAmount,
      status: account.status,
      actor: { userId: req.user._id, role: req.user.role, name: req.user.name },
    });

    notificationAutomationService.dispatch({
      title: 'Fee payment recorded',
      message: `A payment of PKR ${amount} has been recorded${reference ? ` (Ref: ${reference})` : ''}. Remaining due amount: PKR ${Math.max(account.dueAmount, 0)}.`,
      type: 'finance',
      severity: account.dueAmount <= 0 ? 'info' : 'low',
      channels: ['in_app', 'email'],
      roles: ['admin'],
      userIds: audienceUserIds,
      metadata: {
        entity: 'Payment',
        entityId: payment._id,
        link: '/notifications',
        context: {
          accountId,
          dueAmount: account.dueAmount,
          mode: payment.mode,
        },
      },
      sourceModule: 'fees',
    }, req.user, req).catch((error) => {
      console.error('Fee payment notification dispatch failed:', error.message);
    });
  } catch (notificationError) {
    console.error('Fee payment audience resolution failed:', notificationError.message);
  }

  res.status(201).json({ success: true, payment, account });
});

module.exports = { recordPayment };
