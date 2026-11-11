const FeeInstallment = require('../models/FeeInstallment');
const StudentFeeAccount = require('../models/StudentFeeAccount');

exports.applyLateFees = async () => {
  const today = new Date();
  const overdueInstalments = await FeeInstallment.find({
    status: 'unpaid',
    dueDate: { $lt: today }
  });

  for (const inst of overdueInstalments) {
    // For example, add a fixed late fee of 50 (or configurable)
    const lateFee = 50;
    // Update instalment (optional: add penalty field)
    inst.amount += lateFee; // increase instalment amount
    await inst.save();

    // Update account balances
    const account = await StudentFeeAccount.findById(inst.studentFeeAccount);
    if (account) {
      account.totalAmount += lateFee;
      account.dueAmount = account.totalAmount - account.paidAmount;
      account.status = account.dueAmount <= 0 ? 'paid' : 'unpaid';
      await account.save();
    }
  }
  return overdueInstalments.length;
};