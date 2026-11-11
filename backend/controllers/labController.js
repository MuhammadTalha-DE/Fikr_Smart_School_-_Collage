const Lab = require('../models/Lab');
const LabSession = require('../models/LabSession');
const PracticalMarks = require('../models/PracticalMarks');
const Project = require('../models/Project');
const ProjectSubmission = require('../models/ProjectSubmission');
const Student = require('../models/Student');
const asyncHandler = require('express-async-handler');
const Teacher = require('../models/Teacher');

// ---------- Labs ----------
const createLab = asyncHandler(async (req, res) => {
  const { name, description, location, inCharge } = req.body;
  let finalInCharge = inCharge || null;

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (teacher) {
      finalInCharge = teacher._id;
    }
  }

  const lab = await Lab.create({
    name,
    description,
    location,
    inCharge: finalInCharge,
  });

  res.status(201).json(lab);
});

const getLabs = asyncHandler(async (req, res) => {
  const labs = await Lab.find()
    .populate('inCharge', 'userId')
    .populate({ path: 'inCharge', populate: { path: 'userId', select: 'name' } });
  res.json(labs);
});

// ---------- Lab Sessions ----------
const createLabSession = asyncHandler(async (req, res) => {
  let teacherId = req.body.teacherId;
  if (!req.body.classId) {
    res.status(400);
    throw new Error('Class is required');
  }

  if (req.user.role === 'teacher') {
    const teacherProfile = await Teacher.findOne({ userId: req.user._id });
    if (!teacherProfile) {
      res.status(404);
      throw new Error('Teacher profile not found');
    }
    teacherId = teacherProfile._id;
  }

  if (!teacherId) {
    res.status(400);
    throw new Error('teacherId is required');
  }

  const session = await LabSession.create({
    ...req.body,
    teacherId,
  });

  res.status(201).json(session);
});

const getLabSessions = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  const sessions = await LabSession.find(filter)
    .populate('labId', 'name')
    .populate('teacherId', 'userId')
    .populate({ path: 'teacherId', populate: { path: 'userId', select: 'name' } })
    .populate('attendance.studentId', 'userId rollNumber')
    .populate({ path: 'attendance.studentId', populate: { path: 'userId', select: 'name' } });
  res.json(sessions);
});

// ---------- Lab Attendance ----------
const markLabAttendance = asyncHandler(async (req, res) => {
  const { sessionId, records } = req.body;
  const session = await LabSession.findById(sessionId);
  if (!session) throw new Error('Session not found');
  session.attendance = records;
  await session.save();
  res.json({ message: 'Attendance saved' });
});

const getLabAttendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await LabSession.findById(sessionId)
    .populate('attendance.studentId', 'userId rollNumber')
    .populate({ path: 'attendance.studentId', populate: { path: 'userId', select: 'name' } });
  res.json(session.attendance);
});

// ---------- Practical Marks ----------
const addPracticalMarks = asyncHandler(async (req, res) => {
  const { marksData } = req.body;
  const records = marksData.map(item => ({ ...item, gradedBy: req.user._id }));
  await PracticalMarks.insertMany(records);
  res.status(201).json({ message: 'Marks saved' });
});

const getPracticalMarks = asyncHandler(async (req, res) => {
  const { studentId, labSessionId } = req.query;
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (labSessionId) filter.labSessionId = labSessionId;
  const marks = await PracticalMarks.find(filter)
    .populate('studentId', 'userId rollNumber')
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } });
  res.json(marks);
});

// ---------- Projects (FIXED) ----------
const createProject = asyncHandler(async (req, res) => {
  const { title, description, classId, subject, dueDate, maxMarks } = req.body;
  let teacherId = null;

  // Automatically resolve teacher from logged-in user
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      res.status(404);
      throw new Error('Teacher profile not found');
    }
    teacherId = teacher._id;
  }

  // If the request already contains a teacherId, it will be ignored for teachers (safety)
  if (!teacherId && req.body.teacherId) {
    teacherId = req.body.teacherId;
  }

  if (!teacherId) {
    res.status(400);
    throw new Error('Teacher ID is required');
  }

  const project = await Project.create({
    title,
    description,
    classId,
    subject,
    teacher: teacherId,          // ✅ correct field name
    dueDate,
    maxMarks,
  });

  // Populate teacher info for response
  await project.populate('teacher', 'userId');
  await project.populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } });

  res.status(201).json({ success: true, project });
});

const getProjects = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  const projects = await Project.find(filter)
    .populate('teacher', 'userId')
    .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } });
  res.json({ success: true, projects });
});

// ---------- Project Submission ----------
const submitProject = asyncHandler(async (req, res) => {
  const { projectId, fileUrl } = req.body;
  if (!projectId || !fileUrl) {
    res.status(400);
    throw new Error('Project ID and file URL are required');
  }

  // Find the student profile for the logged-in user
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    res.status(403);
    throw new Error('Student profile not found');
  }

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if the student already submitted (update or create)
  const existing = await ProjectSubmission.findOne({
    project: project._id,
    student: student._id,
  });

  if (existing) {
    existing.fileUrl = fileUrl;
    existing.submittedAt = new Date();
    await existing.save();
    return res.json({ success: true, submission: existing });
  }

  const submission = await ProjectSubmission.create({
    project: project._id,        // ✅ correct field
    student: student._id,        // ✅ correct field
    fileUrl,
  });

  res.status(201).json({ success: true, submission });
});

const getProjectSubmissions = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const submissions = await ProjectSubmission.find({ project: projectId })
    .populate({
      path: 'student',
      select: 'userId rollNumber',
      populate: { path: 'userId', select: 'name avatar' }
    })
    .sort({ submittedAt: -1 })
    .lean();
  res.json(submissions);
});

const gradeProject = asyncHandler(async (req, res) => {
  const { submissionId, marks, feedback } = req.body;

  const submission = await ProjectSubmission.findOneAndUpdate(
    { _id: submissionId },
    {
      $set: {
        marksObtained: marks,
        feedback: feedback || '',
        gradedBy: req.user._id,
        gradedAt: new Date(),
      },
    },
    { new: true, upsert: false }
  );

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  res.json(submission);
});
// ---------- Student self-service ----------
const getStudentLabSessions = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student || !student.classId) return res.json([]);
  const sessions = await LabSession.find({ classId: student.classId })
    .populate('labId', 'name')
    .populate('teacherId', 'userId')
    .populate({ path: 'teacherId', populate: { path: 'userId', select: 'name' } })
    .populate('attendance.studentId', 'userId')
    .sort({ date: -1 });
  res.json(sessions);
});

const getMyProjectSubmissions = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new Error('Student profile not found');
  const submissions = await ProjectSubmission.find({ student: student._id })
    .populate('project', 'title subject maxMarks')
    .populate('gradedBy', 'name')
    .sort('-submittedAt');
  res.json(submissions);
});
// ---------- Labs (update / delete) ----------
const updateLab = asyncHandler(async (req, res) => {
  const { name, description, location, inCharge } = req.body;
  const updatedLab = await Lab.findByIdAndUpdate(
    req.params.id,
    { name, description, location, inCharge: inCharge || null },
    { new: true, runValidators: true }
  )
    .populate('inCharge', 'userId')
    .populate({ path: 'inCharge', populate: { path: 'userId', select: 'name' } });
  if (!updatedLab) {
    res.status(404);
    throw new Error('Lab not found');
  }
  res.json(updatedLab);
});

const deleteLab = asyncHandler(async (req, res) => {
  const lab = await Lab.findById(req.params.id);
  if (!lab) {
    res.status(404);
    throw new Error('Lab not found');
  }
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher || lab.inCharge?.toString() !== teacher._id.toString()) {
      res.status(403);
      throw new Error('You can only delete labs where you are the in‑charge');
    }
  }
  await lab.deleteOne();
  res.json({ message: 'Lab deleted' });
});

const getLabSessionById = asyncHandler(async (req, res) => {
  const session = await LabSession.findById(req.params.sessionId)
    .populate('labId', 'name')
    .populate('classId', 'name')
    .populate('teacherId', 'userId')
    .populate({ path: 'teacherId', populate: { path: 'userId', select: 'name' } })
    .populate('attendance.studentId', 'userId rollNumber')
    .populate({ path: 'attendance.studentId', populate: { path: 'userId', select: 'name' } });
  if (!session) {
    res.status(404);
    throw new Error('Lab session not found');
  }
  res.json(session);
});

const deleteLabSession = asyncHandler(async (req, res) => {
  const session = await LabSession.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Lab session not found');
  }
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher || session.teacherId.toString() !== teacher._id.toString()) {
      res.status(403);
      throw new Error('You can only delete your own lab sessions');
    }
  }
  await PracticalMarks.deleteMany({ labSessionId: session._id });
  await session.deleteOne();
  res.json({ message: 'Lab session deleted' });
});
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('teacher', 'userId')
    .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } })
    .populate('classId', 'name');
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  res.json({ success: true, project });
});

module.exports = {
  createLab, getLabs,
  createLabSession, getLabSessions,getProjectById,
  markLabAttendance, getLabAttendance,
  addPracticalMarks, getPracticalMarks,
  createProject, getProjects,
  submitProject, getProjectSubmissions, gradeProject,
  getStudentLabSessions, getMyProjectSubmissions,
  updateLab, deleteLab, getLabSessionById, deleteLabSession,
};