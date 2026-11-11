const Student = require('../models/Student');
const ClassFeePlan = require('../models/ClassFeePlan');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const FeeInstallment = require('../models/FeeInstallment');

// ────────────────────────────────
// 1. Generate fee account for ONE student (called on admission acceptance)
// ────────────────────────────────
exports.generateForStudent = async (studentId) => {
  // 1. Fetch student with class info
  const student = await Student.findById(studentId).populate('classId');
  if (!student || !student.classId) {
    console.warn(`[FeeGen] Student ${studentId} not found or no class assigned`);
    return;
  }

  // 2. Find the active fee plan for the student's class
  const plan = await ClassFeePlan.findOne({
    classId: student.classId._id,
    isActive: true,
  }).populate('feeItems.feeHeadId');

  if (!plan) {
    console.warn(`[FeeGen] No active fee plan found for class ${student.classId._id}`);
    return;
  }

  // 3. Check if an account already exists for this student + plan
  let account = await StudentFeeAccount.findOne({
    studentId: student._id,
    classFeePlanId: plan._id,
  });

  if (account) {
    console.log(`[FeeGen] Account already exists for student ${student._id}, skipping creation`);
    return;
  }

  // 4. Calculate total amount from plan’s fee items
  const totalAmount = plan.feeItems.reduce((sum, item) => sum + item.amount, 0);
  const instalmentCount = plan.instalmentCount || 1;
  const dueDay = plan.dueDay || 1;
  const instalmentAmount = Math.round(totalAmount / instalmentCount);

  // 5. Create the account
  account = await StudentFeeAccount.create({
    studentId: student._id,
    classFeePlanId: plan._id,
    totalAmount,
    amountDue: totalAmount,
  });

  // 6. Create installments
  const instalments = [];
  const today = new Date();
  for (let i = 0; i < instalmentCount; i++) {
    const dueDate = new Date(today.getFullYear(), today.getMonth() + i, dueDay);
    instalments.push({
      studentFeeAccountId: account._id,
      instalmentNumber: i + 1,
      amount: instalmentAmount,
      dueDate,
      status: 'unpaid',
    });
  }
  await FeeInstallment.insertMany(instalments);

  console.log(`[FeeGen] Account created for student ${student._id} with ${instalmentCount} installments`);
};

// ────────────────────────────────
// 2. Bulk generate / regenerate for a whole class (admin action)
//    If accounts already exist, it will NOT delete them by default.
//    Pass `forceRegenerate = true` to replace existing accounts.
// ────────────────────────────────
exports.generateAccountsForPlan = async (classFeePlanId, forceRegenerate = false) => {
  const plan = await ClassFeePlan.findById(classFeePlanId).populate('feeItems.feeHeadId');
  if (!plan) throw new Error('Class fee plan not found');

  const students = await Student.find({ classId: plan.classId });
  if (students.length === 0) {
    console.warn('[FeeGen] No students in this class');
    return { accountsCreated: 0, skipped: 0 };
  }

  const totalAmount = plan.feeItems.reduce((sum, item) => sum + item.amount, 0);
  const instalmentCount = plan.instalmentCount || 1;
  const dueDay = plan.dueDay || 1;
  const instalmentAmount = Math.round(totalAmount / instalmentCount);
  const dueDates = [];
  const today = new Date();
  for (let i = 0; i < instalmentCount; i++) {
    dueDates.push(new Date(today.getFullYear(), today.getMonth() + i, dueDay));
  }

  let created = 0;
  let skipped = 0;

  for (const student of students) {
    let account = await StudentFeeAccount.findOne({
      studentId: student._id,
      classFeePlanId: plan._id,
    });

    if (account && !forceRegenerate) {
      skipped++;
      continue;
    }

    // If forced, delete old account + installments
    if (account && forceRegenerate) {
      await FeeInstallment.deleteMany({ studentFeeAccountId: account._id });
      await StudentFeeAccount.findByIdAndDelete(account._id);
    }

    // Create fresh account
    account = await StudentFeeAccount.create({
      studentId: student._id,
      classFeePlanId: plan._id,
      totalAmount,
      amountDue: totalAmount,
    });

    const instalments = dueDates.map((dueDate, index) => ({
      studentFeeAccountId: account._id,
      instalmentNumber: index + 1,
      amount: instalmentAmount,
      dueDate,
      status: 'unpaid',
    }));
    await FeeInstallment.insertMany(instalments);
    created++;
  }

  console.log(`[FeeGen] Bulk generation complete: ${created} created, ${skipped} skipped`);
  return { accountsCreated: created, skipped, totalAmount, instalmentAmount, instalmentCount };
};