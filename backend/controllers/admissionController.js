const Admission = require('../models/Admission');
const User = require('../models/User');
const Student = require('../models/Student');
const auditService = require('../services/auditService');
const Guardian = require('../models/Guardian');
const Class = require('../models/Class');
const Parent = require('../models/Parent');   // ← must be imported
const asyncHandler = require('express-async-handler');
const { generateTemporaryPassword } = require('../utils/passwordPolicy');

// ---------- CREATE ----------
const createAdmission = asyncHandler(async (req, res) => {
  const { guardians, ...admissionData } = req.body;
  const admission = await Admission.create({
    ...admissionData,
    guardians: guardians || [],
  });
  res.status(201).json({ success: true, admission });
});

// ---------- LIST ----------
const getAdmissions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.applicationStatus = req.query.status;
  if (req.query.class) filter.intendedClass = req.query.class;

  const admissions = await Admission.find(filter)
    .populate('intendedClass', 'name')
    .populate('createdUserId', 'name email')
    .populate('createdStudentId', 'rollNumber admissionNumber')
    .sort({ applicationDate: -1 });

  res.json({ success: true, admissions });
});

// ---------- SINGLE ----------
const getAdmissionById = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id)
    .populate('intendedClass', 'name')
    .populate('createdUserId', 'name email')
    .populate('createdStudentId', 'rollNumber admissionNumber');

  if (!admission) {
    res.status(404);
    throw new Error('Admission not found');
  }
  res.json({ success: true, admission });
});

// ---------- UPDATE ----------
const updateAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    res.status(404);
    throw new Error('Admission not found');
  }

  const { guardians, ...updateData } = req.body;

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      admission[key] = updateData[key];
    }
  });

  if (guardians !== undefined) {
    admission.guardians = guardians.filter(g => g.name && g.name.trim().length > 0);
  }

  const updatedAdmission = await admission.save();
  res.json({ success: true, admission: updatedAdmission });
});

// ---------- DELETE ----------
const deleteAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findByIdAndDelete(req.params.id);
  if (!admission) {
    res.status(404);
    throw new Error('Admission not found');
  }
  res.json({ success: true, message: 'Admission deleted' });
});

// ---------- ACCEPT (enroll student) ----------
const acceptAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    res.status(404);
    throw new Error('Admission not found');
  }
  if (admission.applicationStatus !== 'pending') {
    res.status(400);
    throw new Error('Admission can only be accepted from pending status');
  }

  // 1. Validate father exists
  const father = admission.guardians?.find(
    g => g.name && g.name.trim().length > 0 && g.relation?.toLowerCase() === 'father'
  );
  if (!father) {
    res.status(400);
    throw new Error('A father guardian with a valid name is required');
  }

  // 2. Create student user (username based on father)
  const generatedPassword = generateTemporaryPassword();
  const baseName = admission.studentName.trim().replace(/\s+/g, '').toLowerCase();
  const fatherName = father.name.trim();
  let preferredUsername = `${baseName}.${fatherName.replace(/\s+/g, '').toLowerCase()}`;
  if (preferredUsername.length > 30) preferredUsername = preferredUsername.substring(0, 30);

  let username = preferredUsername;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${preferredUsername}${counter}`;
    counter++;
  }
  const studentEmail = admission.email || `${username}@school.com`;

  const studentUser = await User.create({
    name: admission.studentName,
    email: studentEmail,
    username,
    password: generatedPassword,
    role: 'student',
  });

  // 3. Create Student document (include new fields)
  const student = await Student.create({
    userId: studentUser._id,
    classId: admission.intendedClass,
    rollNumber: req.body.rollNumber || undefined,
    admissionNumber: admission._id.toString().slice(-8).toUpperCase(),
    admissionDate: new Date(),
    dateOfBirth: admission.dateOfBirth,
    cnic: admission.cnic || '',
    formBNumber: admission.formBNumber || '',
    gender: admission.gender,
    bloodGroup: admission.bloodGroup,
    religion: admission.religion || '',
    country: admission.country || '',
    province: admission.province || '',
    address: admission.address,
    previousSchool: admission.previousSchool,
    section: admission.section || '',
    overallBehaviour: admission.overallBehaviour || 'Good',
    medicalNotes: req.body.medicalNotes || '',
    documents: admission.documents || [],
  });

  // 4. Create or link Parent (Father)
  let parentUser = father.email ? await User.findOne({ email: father.email }) : null;

  if (!parentUser) {
    const parentUsername = father.email
      ? father.email.split('@')[0]
      : `parent.${fatherName.replace(/\s+/g, '').toLowerCase()}`;
    const parentPassword = generateTemporaryPassword();
    parentUser = await User.create({
      name: father.name,
      email: father.email || `${parentUsername}@school.com`,
      username: parentUsername,
      password: parentPassword,
      role: 'parent',
    });
  }

  let parentProfile = await Parent.findOne({ userId: parentUser._id });
  if (!parentProfile) {
    parentProfile = await Parent.create({
      userId: parentUser._id,
      children: [student._id],
    });
  } else {
    await Parent.findByIdAndUpdate(parentProfile._id, {
      $addToSet: { children: student._id },
    });
  }

  student.parentId = parentProfile._id;
  await student.save();

  // 5. Create Guardian records (filter empty rows)
  const rawGuardians = admission.guardians || [];
  const validGuardians = rawGuardians.filter(g => g.name && g.name.trim().length > 0);
  if (validGuardians.length > 0) {
    try {
      await Guardian.insertMany(
        validGuardians.map(g => ({ ...g, student: student._id }))
      );
    } catch (guardianErr) {
      console.error('Guardian creation failed:', guardianErr.message);
    }
  }

  // 6. Add to class
  await Class.findByIdAndUpdate(admission.intendedClass, {
    $addToSet: { students: student._id },
  });

  // 7. Generate fees (optional)
  try {
    const feeGenerator = require('../services/feeGeneratorService');
    await feeGenerator.generateForStudent(student._id);
  } catch (feeErr) {
    console.error('Fee generation failed:', feeErr.message);
  }

  // 8. Mark admission as accepted
  admission.applicationStatus = 'accepted';
  admission.createdUserId = studentUser._id;
  admission.createdStudentId = student._id;
  await admission.save();
  try {
  await auditService.log({
    action: 'ACCEPT',
    entity: 'Admission',
    entityId: admission._id,
    description: `Admission accepted for ${studentUser.name}`,
    performedBy: {
      userId: req.user._id,
      role: req.user.role,
      name: req.user.name,
    },
    changes: {
      before: { status: 'pending' },
      after: { status: 'accepted' },
    },
    req,
  });
} catch (auditError) {
  console.error('Audit log write failed:', auditError.message);
}


  res.json({
    success: true,
    message: 'Student enrolled successfully',
    
    student,
    
    temporaryPassword: generatedPassword,
    
  });
  
});

// ---------- REJECT ----------
const rejectAdmission = asyncHandler(async (req, res) => {
  // 1. Fetch the existing admission to get the student name and current status
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    res.status(404);
    throw new Error('Admission not found');
  }

  // 2. Save the old status for the audit log
  const oldStatus = admission.applicationStatus;

  // 3. Update the admission
  admission.applicationStatus = 'rejected';
  admission.remarks = req.body.remarks || 'Rejected by admin';
  await admission.save();

  // 4. Audit log – safe block, won’t break the response
  try {
    await auditService.log({
      action: 'REJECT',
      entity: 'Admission',
      entityId: admission._id,
      description: `Admission rejected for ${admission.studentName || 'Unknown'}`,
      performedBy: {
        userId: req.user._id,
        role: req.user.role,
        name: req.user.name,
      },
      changes: {
        before: { status: oldStatus },
        after: { status: 'rejected' },
      },
      req,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }

  // 5. Send response
  res.json({ success: true, admission });
});

module.exports = {
  createAdmission,
  getAdmissions,
  getAdmissionById,
  updateAdmission,
  deleteAdmission,
  acceptAdmission,
  rejectAdmission,
};
