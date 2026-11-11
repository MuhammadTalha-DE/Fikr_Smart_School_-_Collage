const asyncHandler = require('express-async-handler');
const auditService = require('../services/auditService');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Config = require('../models/Config');
const { generatePDF } = require('../services/pdfGeneratorService');
const { fetchImageBuffer } = require('../utils/imageBuffer');

const ID_CARD_TEMPLATE = {
  type: 'id_card',
  name: 'Official School Identity Card',
  layout: {
    width: 540,
    height: 340,
    orientation: 'landscape',
    margins: { top: 16, right: 18, bottom: 16, left: 18 },
    backgroundColor: '#ffffff',
    borderColor: '#1e3a8a',
    borderWidth: 2,
  },
  fields: [],
};

async function renderUnifiedIdCard({ school, person, role, verificationCode }) {
  const schoolData = {
    ...school,
    logoBuffer: await fetchImageBuffer(school.logo),
    signatureBuffer: await fetchImageBuffer(school.principalSignature),
    stampBuffer: await fetchImageBuffer(school.schoolStamp),
  };
  const ownerData = { ...person, role };
  const data = {
    school: schoolData,
    document: { type: 'id_card', name: ID_CARD_TEMPLATE.name },
    student: role === 'Student' ? ownerData : {},
    teacher: role === 'Student' ? {} : ownerData,
  };
  return generatePDF(ID_CARD_TEMPLATE, data, { verificationCode });
}

const getSchoolInfo = async () => {
  const keys = [
    'school_name', 'school_logo', 'school_street', 'school_city',
    'school_state', 'school_postal', 'school_phone', 'school_email',
    'principal_name', 'principal_signature', 'school_stamp',
  ];
  const entries = await Promise.all(keys.map(key => Config.findOne({ key })));
  const getVal = key => entries.find(entry => entry?.key === key)?.value || '';

  return {
    name: getVal('school_name') || 'Fikr Smart School',
    logo: getVal('school_logo') || null,
    address: [getVal('school_street'), getVal('school_city'), getVal('school_state'), getVal('school_postal')]
      .filter(Boolean).join(', '),
    phone: getVal('school_phone'),
    email: getVal('school_email'),
    principalName: getVal('principal_name'),
    principalSignature: getVal('principal_signature') || null,
    schoolStamp: getVal('school_stamp') || null,
  };
};

const getStudentIdCard = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('classId', 'name section')
    .populate('userId', 'name email avatar phone')
    .populate({ path: 'parentId', populate: { path: 'userId', select: 'name phone' } });

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const school = await getSchoolInfo();
  const classSection = [student.classId?.name, student.classId?.section].filter(Boolean).join(' / ');
  const person = {
    name: student.userId?.name || 'N/A',
    className: student.classId?.name || '',
    classSection,
    section: student.classId?.section || '',
    admissionNumber: student.admissionNumber || student._id.toString().slice(-8),
    rollNumber: student.rollNumber || '',
    dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB') : '',
    dobFormatted: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB') : '',
    bloodGroup: student.bloodGroup || '',
    parentName: student.parentId?.userId?.name || '',
    parentPhone: student.parentId?.userId?.phone || '',
    mobile: student.userId?.phone || '',
    email: student.userId?.email || '',
    cnic: student.cnic || '',
    formBNumber: student.formBNumber || '',
    photoBuffer: await fetchImageBuffer(student.userId?.avatar),
  };
  const verificationCode = student.admissionNumber || student._id.toString();
  const pdfBuffer = await renderUnifiedIdCard({ school, person, role: 'Student', verificationCode });

  await auditService.log({
    action: 'GENERATE',
    entity: 'IDCard',
    entityId: student._id,
    description: `Student ID card generated for ${person.name}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ID_${person.admissionNumber}.pdf"`);
  res.send(pdfBuffer);
});

const getTeacherIdCard = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id)
    .populate('userId', 'name email avatar phone')
    .populate('classes', 'name section');

  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  const school = await getSchoolInfo();
  const person = {
    name: teacher.userId?.name || 'N/A',
    employeeId: teacher.employeeId || teacher._id.toString().slice(-8),
    dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString('en-GB') : '',
    dobFormatted: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString('en-GB') : '',
    bloodGroup: teacher.bloodGroup || '',
    cnic: teacher.cnic || '',
    mobile: teacher.userId?.phone || '',
    phone: teacher.userId?.phone || '',
    email: teacher.userId?.email || '',
    department: teacher.department || '',
    subjectsList: (teacher.subjects || []).join(', '),
    photoBuffer: await fetchImageBuffer(teacher.userId?.avatar),
  };
  const pdfBuffer = await renderUnifiedIdCard({
    school,
    person,
    role: 'Teacher',
    verificationCode: person.employeeId,
  });

  await auditService.log({
    action: 'GENERATE',
    entity: 'IDCard',
    entityId: teacher._id,
    description: `Teacher ID card generated for ${person.name}`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
    req,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ID_${person.employeeId}.pdf"`);
  res.send(pdfBuffer);
});

const bulkStudentIdCards = asyncHandler(async (req, res) => {
  res.status(501).json({ message: 'Bulk generation not yet implemented' });
});

module.exports = { getStudentIdCard, getTeacherIdCard, bulkStudentIdCards };
