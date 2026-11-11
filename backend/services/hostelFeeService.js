// services/hostelFeeService.js
const StudentFeeAccount = require('../models/StudentFeeAccount');
const FeeInstallment = require('../models/FeeInstallment');
const ClassFeePlan = require('../models/ClassFeePlan');  // we reuse this model
const Hostel = require('../models/Hostel');
const auditService = require('./auditService');

/**
 * Create a hostel fee account and instalments for a newly allocated student.
 * @param {ObjectId} studentId
 * @param {ObjectId} hostelId
 * @param {Request}  [req] - Express request object for audit logging
 * @returns {StudentFeeAccount}
 */
const createHostelFeeAccount = async (studentId, hostelId, req = null) => {
  // 1. Find the active hostel fee plan
  const plan = await ClassFeePlan.findOne({ hostelId, status: 'active' });
  if (!plan) {
    throw new Error('No active fee plan found for this hostel. Please set it up first.');
  }

  // 2. Check if student already has a hostel fee account for this hostel
  const existing = await StudentFeeAccount.findOne({ studentId, hostelId, status: { $ne: 'void' } });
  if (existing) {
    // already exists, no action needed
    return existing;
  }

  // 3. Create the fee account
  const account = await StudentFeeAccount.create({
    studentId,
    classId: null,               // not linked to a class
    hostelId,
    totalAmount: plan.totalAmount,
    paidAmount: 0,
    dueAmount: plan.totalAmount,
    status: 'unpaid',
  });

  // 4. Generate instalments (same logic as your feeGeneratorService)
  if (plan.instalmentCount > 0) {
    const instalmentAmount = plan.totalAmount / plan.instalmentCount;
    const instalments = [];
    for (let i = 0; i < plan.instalmentCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i); // one instalment per month; adjust as needed
      instalments.push({
        studentFeeAccountId: account._id,
        instalmentNumber: i + 1,
        amount: instalmentAmount,
        dueDate,
        status: 'Pending',
      });
    }
    await FeeInstallment.insertMany(instalments);
  }

  // 5. Audit log (fire‑and‑forget)
  if (req) {
    auditService.log({
      action: 'CREATE',
      entity: 'StudentFeeAccount',
      entityId: account._id,
      description: `Hostel fee account created for student ${studentId} (hostel: ${hostelId})`,
      performedBy: { userId: req.user?._id, role: req.user?.role, name: req.user?.name },
      req,
    });
  }

  return account;
};

module.exports = { createHostelFeeAccount };