const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const Config = require('../models/Config');      
const auditService = require('../services/auditService');          // key-value config
const { generateCertificatePDF } = require('../utils/generateCertificate');

const buildValidationError = (message, errors) => {
  const error = new Error(message);
  error.statusCode = 422;
  error.errors = errors;
  return error;
};

// Fetch image from URL as buffer (Node 18+ uses global fetch)
const fetchImageBuffer = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn('Image fetch failed:', url);
    return null;
  }
};

// Get school info from Config keys
const getSchoolInfo = async () => {
  const keys = [
    'school_name', 'school_logo', 'school_street', 'school_city',
    'school_state', 'school_postal', 'principal_name', 'principal_signature', 'school_stamp',
  ];
  const entries = await Promise.all(keys.map(k => Config.findOne({ key: k })));
  const getVal = (key) => entries.find(e => e?.key === key)?.value || '';

  return {
    name: getVal('school_name') || 'Fikr Smart School',
    logo: getVal('school_logo') || null,
    address: [getVal('school_street'), getVal('school_city'), getVal('school_state'), getVal('school_postal')]
      .filter(Boolean).join(', '),
    principalName: getVal('principal_name') || 'Principal',
    principalSignature: getVal('principal_signature') || null,
    schoolStamp: getVal('school_stamp') || null,
  };
};

// Certificate templates
const defaultTemplates = [
  {
    name: 'Bonafide Certificate',
    type: 'bonafide',
    bodyTemplate: 'This is to certify that {{studentName}}, student of class {{className}}, is a bonafide student of this school. This certificate is issued on {{date}} for the purpose of {{reason}}.'
  },
  {
    name: 'Character Certificate',
    type: 'character',
    bodyTemplate: 'This is to certify that {{studentName}} of class {{className}} bears a good moral character during his/her stay in the school. Date: {{date}}'
  },
  {
    name: 'Leaving Certificate',
    type: 'leaving',
    bodyTemplate: '{{studentName}} has been a student of class {{className}} from ... to ... and is leaving due to {{reason}}. Date: {{date}}'
  }
];

// @desc    Get templates
const getTemplates = asyncHandler(async (req, res) => {
  res.json(defaultTemplates);
});

// @desc    Generate certificate PDF
const generateCertificate = asyncHandler(async (req, res) => {
  const { studentId, templateType, reason, issueDate, academicSession } = req.body;
  const requiredErrors = [];

  if (!studentId) requiredErrors.push('Student is required');
  if (!templateType) requiredErrors.push('Certificate template type is required');
  if (!issueDate || Number.isNaN(new Date(issueDate).getTime())) {
    requiredErrors.push('Valid issue date is required');
  }
  if (!String(academicSession || '').trim()) {
    requiredErrors.push('Academic session is required');
  }

  if (requiredErrors.length) {
    throw buildValidationError('Certificate cannot be generated until required fields are complete', requiredErrors);
  }

  const template = defaultTemplates.find(t => t.type === templateType);
  if (!template) {
    res.status(400);
    throw new Error('Invalid template type');
  }

  const student = await Student.findById(studentId)
    .populate('classId', 'name section')
    .populate('userId', 'name avatar')
    .populate('parentId', 'name phone');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // School info (logo, signature, etc.)
  const school = await getSchoolInfo();
  const schoolErrors = [];
  if (!String(school.principalName || '').trim()) schoolErrors.push('Principal name is required before generating certificates');
  if (!school.logo) schoolErrors.push('School logo is required before generating certificates');
  if (!school.principalSignature) schoolErrors.push('Principal signature is required before generating certificates');
  if (!school.schoolStamp) schoolErrors.push('School stamp is required before generating certificates');

  if (schoolErrors.length) {
    throw buildValidationError('Certificate cannot be generated until school profile assets are complete', schoolErrors);
  }

  // Fetch image buffers
  const logoBuffer = school.logo ? await fetchImageBuffer(school.logo) : null;
  const signatureBuffer = school.principalSignature ? await fetchImageBuffer(school.principalSignature) : null;
  const stampBuffer = school.schoolStamp ? await fetchImageBuffer(school.schoolStamp) : null;
  const photoBuffer = student.userId?.avatar ? await fetchImageBuffer(student.userId.avatar) : null;

  // Prepare body text
  const bodyText = template.bodyTemplate
    .replace('{{studentName}}', student.userId?.name || '')
    .replace('{{className}}', student.classId?.name || '')
    .replace('{{reason}}', reason || '')
    .replace('{{date}}', new Date(issueDate).toLocaleDateString('en-IN'));

  const data = {
    studentName: student.userId?.name || 'N/A',
    className: student.classId?.name || 'N/A',
    section: student.classId?.section || '',
    admissionNo: student.admissionNumber || student._id.toString().slice(-8),
    rollNo: student.rollNumber || '',
    dob: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN') : '',
    parentName: student.parentId?.name || '',
    parentPhone: student.parentId?.phone || '',
    bodyText,
    issueDate: new Date(issueDate).toLocaleDateString('en-IN'),
    academicSession: academicSession.trim(),
    schoolName: school.name,
    schoolAddress: school.address,
    principalName: school.principalName,
    schoolLogoBuffer: logoBuffer,
    signatureBuffer,
    stampBuffer,
    photoBuffer,
  };

  const pdfBuffer = await generateCertificatePDF(data);
      auditService.log({
  action: 'GENERATE',
  entity: 'Certificate',
  entityId: student._id,
  description: `Certificate (${template.name}) generated for ${student.userId?.name}`,
  performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name },
  req
});


  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Certificate_${data.studentName}.pdf"`);
  res.send(pdfBuffer);
});

module.exports = { getTemplates, generateCertificate };
