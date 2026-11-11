const FeeHead = require('../models/FeeHead');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const FeeInstallment = require('../models/FeeInstallment');

/**
 * Add a fine instalment to a student’s fee account.
 * @param {ObjectId} studentId – the Student document _id
 * @param {number} amount
 * @returns {Object} the created FeeInstallment
 */
exports.addLibraryFineToStudent = async (studentId, amount) => {
  if (!amount || amount <= 0) return null;

  // 1. Find or create a "Library Fine" FeeHead
  let fineHead = await FeeHead.findOne({ name: 'Library Fine' });
  if (!fineHead) {
    fineHead = await FeeHead.create({
      name: 'Library Fine',
      type: 'fine',   // optional custom field
      isActive: true,
    });
  }

  // 2. Find student fee account (must exist)
  const account = await StudentFeeAccount.findOne({ studentId });
  if (!account) {
    // If no fee account exists, create a minimal one (or throw)
    account = await StudentFeeAccount.create({
      studentId,
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'unpaid',
    });
  }

  // 3. Create instalment
  const instalment = await FeeInstallment.create({
    studentFeeAccount: account._id,
    feeHead: fineHead._id,
    amount,
    dueDate: new Date(),       // immediately due
    status: 'unpaid',
  });

  // 4. Update account totals
  account.totalAmount += amount;
  account.dueAmount += amount;
  account.status = account.dueAmount <= 0 ? 'paid' : 'unpaid';
  await account.save();

  return instalment;
};