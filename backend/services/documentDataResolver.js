/**
 * Document Data Resolver Service
 * 
 * This is the central intelligence for the Document Generation System.
 * It dynamically extracts and resolves data from all existing school modules
 * to populate document templates with real-time data.
 * 
 * Data Sources:
 * - Student Profile
 * - Teacher Profile
 * - Class/Section
 * - Fee Account
 * - Attendance
 * - Marks/Result
 * - Hostel Allocation
 * - Transport Allocation
 * - School Settings
 * - Exam Records
 * - User/Auth
 */

const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const User = require('../models/User');
const Parent = require('../models/Parent');
const SchoolSettings = require('../models/SchoolSettings');
const Config = require('../models/Config');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const Marks = require('../models/Marks');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Attendance = require('../models/Attendance');
const HostelStudent = require('../models/HostelStudent');
const Hostel = require('../models/Hostel');
const HostelRoom = require('../models/HostelRoom');
const Bed = require('../models/Bed');
const TransportAllocation = require('../models/TransportAllocation');
const AcademicRecord = require('../models/AcademicRecord');
const { fetchImageBuffer, getImageMimeType } = require('../utils/imageBuffer');

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

/**
 * Fetch image from URL as base64 data URL
 */
async function fetchImageAsDataUrl(url) {
  if (!url) return null;
  const buffer = await fetchImageBuffer(url);
  if (!buffer) return null;
  const contentType = getImageMimeType(url);
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

/**
 * Get school information from Config
 */
async function getSchoolInfo() {
  const keys = [
    'school_name', 'school_logo', 'school_street', 'school_city',
    'school_state', 'school_postal', 'school_phone', 'school_email',
    'principal_name', 'principal_signature', 'school_stamp',
    'school_website', 'school_motto', 'affiliation_number',
    'board_name', 'school_code',
  ];
  const entries = await Promise.all(keys.map(k => Config.findOne({ key: k })));
  const getVal = (key) => entries.find(e => e?.key === key)?.value || '';

  return {
    name: getVal('school_name') || 'Fikr Smart School',
    logo: getVal('school_logo') || null,
    logoDataUrl: null,
    address: [
      getVal('school_street'),
      getVal('school_city'),
      getVal('school_state'),
      getVal('school_postal')
    ].filter(Boolean).join(', '),
    city: getVal('school_city'),
    state: getVal('school_state'),
    postal: getVal('school_postal'),
    phone: getVal('school_phone'),
    email: getVal('school_email'),
    website: getVal('school_website'),
    motto: getVal('school_motto'),
    principalName: getVal('principal_name'),
    principalSignature: getVal('principal_signature'),
    schoolStamp: getVal('school_stamp'),
    affiliationNumber: getVal('affiliation_number'),
    boardName: getVal('board_name'),
    schoolCode: getVal('school_code'),
  };
}

// ──────────────────────────────────────────────
// PUBLIC RESOLVERS
// ──────────────────────────────────────────────

/**
 * Resolve complete student data for document generation
 */
async function resolveStudentData(studentId) {
  const student = await Student.findById(studentId)
    .populate('classId', 'name section')
    .populate('userId', 'name email avatar phone address username')
    .populate({ path: 'parentId', populate: { path: 'userId', select: 'name phone email' } });

  if (!student) {
    throw new Error(`Student not found with ID: ${studentId}`);
  }

  const user = student.userId || {};
  const parent = student.parentId?.userId || {};
  const classData = student.classId || {};

  // Fetch photo
  const photoDataUrl = user.avatar ? await fetchImageAsDataUrl(user.avatar) : null;

  return {
    // Basic Info
    studentId: student._id.toString(),
    role: 'Student',
    admissionNumber: student.admissionNumber || '',
    rollNumber: student.rollNumber || '',
    name: user.name || 'N/A',
    firstName: (user.name || '').split(' ')[0] || '',
    lastName: (user.name || '').split(' ').slice(-1)[0] || '',
    email: user.email || '',
    phone: user.phone || '',
    mobile: user.phone || student.mobile || '',
    cnic: student.cnic || user.cnic || '',
    formBNumber: student.formBNumber || '',
    formB: student.formBNumber || '',
    passport: student.passport || user.passport || '',
    username: user.username || '',
    avatar: user.avatar || '',
    photoDataUrl,
    photoBuffer: photoDataUrl ? Buffer.from(photoDataUrl.split(',')[1], 'base64') : null,

    // Academic
    className: classData.name || 'N/A',
    classId: classData._id ? classData._id.toString() : '',
    section: classData.section || '',
    classSection: classData.name ? `${classData.name}${classData.section ? ' - ' + classData.section : ''}` : '',

    // Personal
    dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString().split('T')[0] : '',
    dobFormatted: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN') : '',
    gender: student.gender || '',
    bloodGroup: student.bloodGroup || '',
    address: student.address || user.address || '',
    medicalNotes: student.medicalNotes || '',
    previousSchool: student.previousSchool || '',

    // Parent/Guardian
    fatherName: parent.name || '',
    parentName: parent.name || '',
    parentPhone: parent.phone || '',
    parentEmail: parent.email || '',
    parentOccupation: parent.occupation || '',
    parentAddress: parent.address || '',

    // Timestamps
    createdAt: student.createdAt ? student.createdAt.toISOString() : '',
    updatedAt: student.updatedAt ? student.updatedAt.toISOString() : '',
    admissionDate: student.admissionDate ? student.admissionDate.toISOString().split('T')[0] : '',
  };
}

/**
 * Resolve complete teacher data for document generation
 */
async function resolveTeacherData(teacherId) {
  const teacher = await Teacher.findById(teacherId)
    .populate('userId', 'name email avatar phone address username')
    .populate('classes', 'name section');

  if (!teacher) {
    throw new Error(`Teacher not found with ID: ${teacherId}`);
  }

  const user = teacher.userId || {};
  const photoDataUrl = user.avatar ? await fetchImageAsDataUrl(user.avatar) : null;

  return {
    teacherId: teacher._id.toString(),
    role: 'Teacher',
    employeeId: teacher.employeeId || teacher._id.toString().slice(-8),
    name: user.name || 'N/A',
    firstName: (user.name || '').split(' ')[0] || '',
    lastName: (user.name || '').split(' ').slice(-1)[0] || '',
    email: user.email || '',
    phone: user.phone || '',
    mobile: user.phone || teacher.mobile || '',
    cnic: teacher.cnic || user.cnic || '',
    passport: teacher.passport || user.passport || '',
    username: user.username || '',
    avatar: user.avatar || '',
    photoDataUrl,
    photoBuffer: photoDataUrl ? Buffer.from(photoDataUrl.split(',')[1], 'base64') : null,
    address: user.address || '',

    // Professional
    classes: teacher.classes || [],
    classNames: (teacher.classes || []).map(c => c.name).join(', '),
    subjects: teacher.subjects || [],
    subjectsList: (teacher.subjects || []).join(', '),
    preferredSubjects: teacher.preferredSubjects || [],
    preferredGrades: teacher.preferredGrades || [],

    // Timestamps
    createdAt: teacher.createdAt ? teacher.createdAt.toISOString() : '',
    updatedAt: teacher.updatedAt ? teacher.updatedAt.toISOString() : '',
  };
}

/**
 * Resolve fee data for a student
 */
async function resolveFeeData(studentId) {
  try {
    const feeAccount = await StudentFeeAccount.findOne({ studentId })
      .populate('feePlanId', 'name totalAmount')
      .populate('classId', 'name');

    if (!feeAccount) {
      return {
        totalFees: 0,
        paidAmount: 0,
        dueAmount: 0,
        status: 'no_account',
        lastPaymentDate: '',
      };
    }

    return {
      accountId: feeAccount._id.toString(),
      totalFees: feeAccount.totalFee || 0,
      paidAmount: feeAccount.paidAmount || 0,
      dueAmount: (feeAccount.totalFee || 0) - (feeAccount.paidAmount || 0),
      dueAmountFormatted: `₹${((feeAccount.totalFee || 0) - (feeAccount.paidAmount || 0)).toLocaleString()}`,
      totalFeesFormatted: `₹${(feeAccount.totalFee || 0).toLocaleString()}`,
      paidAmountFormatted: `₹${(feeAccount.paidAmount || 0).toLocaleString()}`,
      status: feeAccount.status || 'unknown',
      feePlanName: feeAccount.feePlanId?.name || '',
      className: feeAccount.classId?.name || '',
      lastPaymentDate: feeAccount.lastPaymentDate
        ? new Date(feeAccount.lastPaymentDate).toLocaleDateString('en-IN')
        : '',
      dueDate: feeAccount.dueDate
        ? new Date(feeAccount.dueDate).toLocaleDateString('en-IN')
        : '',
      concessionAmount: feeAccount.concessionAmount || 0,
      fineAmount: feeAccount.fineAmount || 0,
    };
  } catch (err) {
    console.warn('Fee data resolve error:', err.message);
    return {
      totalFees: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'error',
    };
  }
}

/**
 * Resolve result data for a student
 */
async function resolveResultData(studentId, examId) {
  try {
    let query = { studentId };
    if (examId) query.examId = examId;

    const results = await Result.find(query)
      .populate('examId', 'name type subject')
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 });

    if (!results || results.length === 0) {
      return {
        hasResults: false,
        results: [],
        percentage: 0,
        grade: '',
        totalMarks: 0,
        obtainedMarks: 0,
      };
    }

    const latestResult = results[0];
    const totalMarks = results.reduce((sum, r) => sum + (r.maxMarks || 0), 0);
    const obtainedMarks = results.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
    const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : 0;

    let grade = '';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';
    else grade = 'F';

    return {
      hasResults: true,
      results: results.map(r => ({
        subject: r.subjectId?.name || r.subject || '',
        subjectCode: r.subjectId?.code || '',
        marksObtained: r.marksObtained || 0,
        maxMarks: r.maxMarks || 0,
        grade: r.grade || '',
        status: r.status || '',
      })),
      percentage: parseFloat(percentage),
      percentageFormatted: `${percentage}%`,
      grade,
      totalMarks,
      obtainedMarks,
      examName: latestResult.examId?.name || '',
      examType: latestResult.examId?.type || '',
      examDate: latestResult.createdAt
        ? new Date(latestResult.createdAt).toLocaleDateString('en-IN')
        : '',
      rank: latestResult.rank || '',
      resultStatus: latestResult.status || '',
    };
  } catch (err) {
    console.warn('Result data resolve error:', err.message);
    return {
      hasResults: false,
      results: [],
      percentage: 0,
      grade: '',
    };
  }
}

/**
 * Resolve marks data for a student
 */
async function resolveMarksData(studentId, examId) {
  try {
    let query = { studentId };
    if (examId) query.examId = examId;

    const marks = await Marks.find(query)
      .populate('examId', 'name type')
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 });

    if (!marks || marks.length === 0) {
      return { hasMarks: false, marks: [], total: 0, obtained: 0 };
    }

    return {
      hasMarks: true,
      marks: marks.map(m => ({
        subject: m.subjectId?.name || m.subjectName || '',
        subjectCode: m.subjectId?.code || '',
        marks: m.marks || 0,
        maxMarks: m.maxMarks || 0,
        grade: m.grade || '',
        remarks: m.remarks || '',
      })),
      total: marks.reduce((sum, m) => sum + (m.maxMarks || 0), 0),
      obtained: marks.reduce((sum, m) => sum + (m.marks || 0), 0),
    };
  } catch (err) {
    console.warn('Marks data resolve error:', err.message);
    return { hasMarks: false, marks: [], total: 0, obtained: 0 };
  }
}

/**
 * Resolve attendance data for a student
 */
async function resolveAttendanceData(studentId, startDate, endDate) {
  try {
    let query = { studentId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    if (!records || records.length === 0) {
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        leaveDays: 0,
        attendancePercentage: 0,
      };
    }

    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const leaveDays = records.filter(r => r.status === 'leave').length;
    const totalDays = records.length;
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      leaveDays,
      attendancePercentage: parseFloat(percentage),
      attendancePercentageFormatted: `${percentage}%`,
      records: records.slice(0, 30).map(r => ({
        date: r.date ? new Date(r.date).toLocaleDateString('en-IN') : '',
        status: r.status || '',
        subject: r.subject || '',
      })),
    };
  } catch (err) {
    console.warn('Attendance data resolve error:', err.message);
    return { totalDays: 0, presentDays: 0, absentDays: 0, leaveDays: 0, attendancePercentage: 0 };
  }
}

/**
 * Resolve hostel data for a student
 */
async function resolveHostelData(studentId) {
  try {
    const hostelStudent = await HostelStudent.findOne({ studentId })
      .populate('hostelId', 'name type address')
      .populate('roomId', 'roomNumber floor')
      .populate('bedId', 'bedNumber');

    if (!hostelStudent) {
      return {
        isHosteler: false,
        hostelName: '',
        roomNumber: '',
        bedNumber: '',
        floor: '',
      };
    }

    return {
      isHosteler: true,
      hostelId: hostelStudent.hostelId?._id?.toString() || '',
      hostelName: hostelStudent.hostelId?.name || '',
      hostelType: hostelStudent.hostelId?.type || '',
      hostelAddress: hostelStudent.hostelId?.address || '',
      roomId: hostelStudent.roomId?._id?.toString() || '',
      roomNumber: hostelStudent.roomId?.roomNumber || '',
      floor: hostelStudent.roomId?.floor || '',
      bedId: hostelStudent.bedId?._id?.toString() || '',
      bedNumber: hostelStudent.bedId?.bedNumber || '',
      checkInDate: hostelStudent.checkInDate
        ? new Date(hostelStudent.checkInDate).toLocaleDateString('en-IN')
        : '',
      status: hostelStudent.status || '',
    };
  } catch (err) {
    console.warn('Hostel data resolve error:', err.message);
    return { isHosteler: false };
  }
}

/**
 * Resolve transport data for a student
 */
async function resolveTransportData(studentId) {
  try {
    const allocation = await TransportAllocation.findOne({ studentId })
      .populate('routeId', 'routeName startPoint endPoint')
      .populate('vehicleId', 'vehicleNumber vehicleType driverName driverPhone')
      .populate('stopId', 'stopName stopOrder arrivalTime');

    if (!allocation) {
      return {
        hasTransport: false,
        routeName: '',
        vehicleNumber: '',
        driverName: '',
        stopName: '',
      };
    }

    return {
      hasTransport: true,
      routeId: allocation.routeId?._id?.toString() || '',
      routeName: allocation.routeId?.routeName || '',
      startPoint: allocation.routeId?.startPoint || '',
      endPoint: allocation.routeId?.endPoint || '',
      vehicleId: allocation.vehicleId?._id?.toString() || '',
      vehicleNumber: allocation.vehicleId?.vehicleNumber || '',
      vehicleType: allocation.vehicleId?.vehicleType || '',
      driverName: allocation.vehicleId?.driverName || '',
      driverPhone: allocation.vehicleId?.driverPhone || '',
      stopId: allocation.stopId?._id?.toString() || '',
      stopName: allocation.stopId?.stopName || '',
      stopOrder: allocation.stopId?.stopOrder || '',
      arrivalTime: allocation.stopId?.arrivalTime || '',
      pickupTime: allocation.pickupTime || '',
      dropTime: allocation.dropTime || '',
      status: allocation.status || '',
    };
  } catch (err) {
    console.warn('Transport data resolve error:', err.message);
    return { hasTransport: false };
  }
}

/**
 * Resolve exam data
 */
async function resolveExamData(examId) {
  try {
    const exam = await Exam.findById(examId)
      .populate('classId', 'name section')
      .populate('subjectIds', 'name code');

    if (!exam) {
      return { found: false };
    }

    return {
      found: true,
      examId: exam._id.toString(),
      name: exam.name || '',
      type: exam.type || '',
      classId: exam.classId?._id?.toString() || '',
      className: exam.classId?.name || '',
      section: exam.classId?.section || '',
      subjects: exam.subjectIds?.map(s => ({ name: s.name, code: s.code })) || [],
      subjectNames: (exam.subjectIds || []).map(s => s.name).join(', '),
      startDate: exam.startDate ? new Date(exam.startDate).toLocaleDateString('en-IN') : '',
      endDate: exam.endDate ? new Date(exam.endDate).toLocaleDateString('en-IN') : '',
      maxMarks: exam.maxMarks || 0,
      passingMarks: exam.passingMarks || 0,
      description: exam.description || '',
      status: exam.status || '',
    };
  } catch (err) {
    console.warn('Exam data resolve error:', err.message);
    return { found: false };
  }
}

/**
 * Resolve class data
 */
async function resolveClassData(classId) {
  try {
    const classData = await Class.findById(classId)
      .populate('teacherId', 'userId')
      .populate({
        path: 'teacherId',
        populate: { path: 'userId', select: 'name email' }
      });

    if (!classData) {
      return { found: false };
    }

    return {
      found: true,
      classId: classData._id.toString(),
      name: classData.name || '',
      section: classData.section || '',
      fullName: classData.name && classData.section
        ? `${classData.name} - ${classData.section}`
        : classData.name || '',
      teacherName: classData.teacherId?.userId?.name || '',
      teacherEmail: classData.teacherId?.userId?.email || '',
      roomNumber: classData.roomNumber || '',
      strength: classData.strength || 0,
      subjects: classData.subjects || [],
    };
  } catch (err) {
    console.warn('Class data resolve error:', err.message);
    return { found: false };
  }
}

/**
 * Resolve school settings / information
 */
async function resolveSchoolSettings() {
  const school = await getSchoolInfo();

  // Fetch logo as data URL
  const logoDataUrl = school.logo ? await fetchImageAsDataUrl(school.logo) : null;
  const signatureDataUrl = school.principalSignature
    ? await fetchImageAsDataUrl(school.principalSignature)
    : null;
  const stampDataUrl = school.schoolStamp
    ? await fetchImageAsDataUrl(school.schoolStamp)
    : null;

  return {
    ...school,
    logoDataUrl,
    signatureDataUrl,
    stampDataUrl,
    currentDate: new Date().toLocaleDateString('en-IN'),
    currentDateTime: new Date().toLocaleString('en-IN'),
    currentYear: new Date().getFullYear().toString(),
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    logoBuffer: school.logo ? await fetchImageBuffer(school.logo) : null,
    signatureBuffer: school.principalSignature ? await fetchImageBuffer(school.principalSignature) : null,
    stampBuffer: school.schoolStamp ? await fetchImageBuffer(school.schoolStamp) : null,
  };
}

/**
 * Resolve academic record for a student
 */
async function resolveAcademicRecordData(studentId) {
  try {
    const records = await AcademicRecord.find({ studentId })
      .populate('classId', 'name section')
      .sort({ academicYear: -1 });

    if (!records || records.length === 0) {
      return {
        hasRecords: false,
        records: [],
        currentClassName: '',
      };
    }

    return {
      hasRecords: true,
      records: records.map(r => ({
        className: r.classId?.name || '',
        section: r.classId?.section || '',
        academicYear: r.academicYear || '',
        status: r.status || '',
        percentage: r.percentage || 0,
        grade: r.grade || '',
        result: r.result || '',
      })),
      currentClassName: records[0]?.classId?.name || '',
      currentSection: records[0]?.classId?.section || '',
      currentAcademicYear: records[0]?.academicYear || '',
    };
  } catch (err) {
    console.warn('Academic record resolve error:', err.message);
    return { hasRecords: false, records: [] };
  }
}

/**
 * Master resolver - resolves ALL data for a given document context
 */
async function resolveAllDocumentData(context) {
  const {
    ownerType,     // 'student', 'teacher', 'staff'
    ownerId,       // MongoDB ObjectId
    documentType,  // Document type string
    examId,        // Optional exam ID for results
    classId,       // Optional class ID
  } = context;

  // Always resolve school settings
  const schoolData = await resolveSchoolSettings();

  let data = {
    school: schoolData,
    document: {
      type: documentType || '',
      generatedAt: new Date().toISOString(),
      generatedDate: new Date().toLocaleDateString('en-IN'),
      generatedDateTime: new Date().toLocaleString('en-IN'),
      year: new Date().getFullYear().toString(),
    },
  };

  // Resolve owner-specific data
  if (ownerType === 'student' && ownerId) {
    const studentData = await resolveStudentData(ownerId);
    data.student = studentData;

    // Resolve fee data for fee-related documents
    const feeDocs = [
      'fee_voucher', 'receipt', 'fee_clearance',
      'outstanding_notice', 'installment_plan', 'late_fee_notice',
      'monthly_fee_statement', 'annual_fee_statement', 'scholarship'
    ];
    if (feeDocs.includes(documentType)) {
      data.fee = await resolveFeeData(ownerId);
    }

    // Resolve result/marks for result-related documents
    const resultDocs = [
      'result_card', 'marks_sheet', 'transcript',
      'merit_certificate', 'admit_card', 'roll_number_slip',
      'exam_attendance_sheet'
    ];
    if (resultDocs.includes(documentType)) {
      data.result = await resolveResultData(ownerId, examId);
      data.marks = await resolveMarksData(ownerId, examId);
    }

    // Resolve attendance for attendance documents
    if (documentType === 'attendance_certificate') {
      data.attendance = await resolveAttendanceData(ownerId);
    }

    // Resolve hostel data
    const hostelDocs = ['hostel_certificate', 'id_card'];
    if (hostelDocs.includes(documentType)) {
      data.hostel = await resolveHostelData(ownerId);
    }

    // Resolve transport data
    const transportDocs = ['transport_pass', 'id_card'];
    if (transportDocs.includes(documentType)) {
      data.transport = await resolveTransportData(ownerId);
    }

    // Resolve academic records
    data.academicRecords = await resolveAcademicRecordData(ownerId);

  } else if (ownerType === 'teacher' && ownerId) {
    data.teacher = await resolveTeacherData(ownerId);
  } else if (ownerType === 'staff' && ownerId) {
    // Staff is similar to teacher
    data.teacher = await resolveTeacherData(ownerId);
  } else if (ownerType === 'user' && ownerId) {
    const user = await User.findById(ownerId).select('name username email role avatar phone address cnic passport');
    if (!user) throw new Error(`User not found with ID: ${ownerId}`);
    data.user = user.toObject();

    if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: user._id }).select('_id');
      if (teacher) data.teacher = await resolveTeacherData(teacher._id);
    } else if (user.role === 'parent') {
      const parent = await Parent.findOne({ userId: user._id }).populate({
        path: 'children', select: 'rollNumber admissionNumber classId',
        populate: [{ path: 'classId', select: 'name section' }, { path: 'userId', select: 'name' }],
      });
      if (parent) data.parent = { children: parent.children || [], name: user.name };
    }
  }

  // Resolve class data if classId provided
  if (classId) {
    data.class = await resolveClassData(classId);
  }

  // Resolve exam data if examId provided
  if (examId) {
    data.exam = await resolveExamData(examId);
  }

  return data;
}

module.exports = {
  resolveStudentData,
  resolveTeacherData,
  resolveFeeData,
  resolveResultData,
  resolveMarksData,
  resolveAttendanceData,
  resolveHostelData,
  resolveTransportData,
  resolveExamData,
  resolveClassData,
  resolveSchoolSettings,
  resolveAcademicRecordData,
  resolveAllDocumentData,
  getSchoolInfo,
  fetchImageAsDataUrl,
  fetchImageBuffer,
};
