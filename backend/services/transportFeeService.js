const FeeHead = require('../models/FeeHead');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const FeeInstallment = require('../models/FeeInstallment');

/**
 * Add a transport fee instalment for a student.
 * @param {ObjectId} studentId – Student document _id
 * @param {number} amount – monthly fee amount
 * @returns {Object} the created instalment
 */
exports.addTransportFeeForStudent = async (studentId, amount) => {
  if (!amount || amount <= 0) return null;

  // 1. Find or create "Transport Fee" fee head
  let feeHead = await FeeHead.findOne({ name: 'Transport Fee' });
  if (!feeHead) {
    feeHead = await FeeHead.create({
      name: 'Transport Fee',
      type: 'fee',
      isActive: true,
    });
  }

  // 2. Find student fee account (may not exist – create minimal one)
  let account = await StudentFeeAccount.findOne({ studentId });
  if (!account) {
    // Create a minimal account if none exists
    account = await StudentFeeAccount.create({
      studentId,
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'unpaid',
    });
  }

  // 3. Create instalment (due immediately)
  const instalment = await FeeInstallment.create({
    studentFeeAccount: account._id,
    feeHead: feeHead._id,
    amount,
    dueDate: new Date(),
    status: 'unpaid',
  });

  // 4. Update account totals
  account.totalAmount += amount;
  account.dueAmount += amount;
  account.status = account.dueAmount <= 0 ? 'paid' : 'unpaid';
  await account.save();

  return instalment;
};