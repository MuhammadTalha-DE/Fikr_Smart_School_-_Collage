const Project = require('../models/Project');
const ProjectSubmission = require('../models/ProjectSubmission');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const asyncHandler = require('express-async-handler');

// ------------------- TEACHER / ADMIN -------------------

// GET /api/projects?classId=...&teacher=...
const getAllProjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  if (req.query.teacher) filter.teacher = req.query.teacher;

  const projects = await Project.find(filter)
    .populate('classId', 'name')
    .populate('teacher', 'userId')
    .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, projects });
});

// POST /api/projects
const createProject = asyncHandler(async (req, res) => {
  console.log('📥 createProject called');
  console.log('📥 req.user:', req.user);
  console.log('📥 req.body:', req.body);

  const { title, description, classId, dueDate, maxMarks, teacherId } = req.body;

  if (!title || !classId) {
    res.status(400);
    throw new Error('Title and class are required');
  }

  // Try multiple ways to get a teacher ID
  let finalTeacherId = teacherId;

  if (!finalTeacherId) {
    console.log('🔍 Looking up teacher profile for userId:', req.user._id);
    const teacherProfile = await Teacher.findOne({ userId: req.user._id });
    console.log('🔍 Teacher lookup result:', teacherProfile);
    if (teacherProfile) {
      finalTeacherId = teacherProfile._id;
    }
  }

  // Emergency fallback: if your user is directly linked to a teacher document via `teacher` field in the user model
  if (!finalTeacherId && req.user.teacher) {
    finalTeacherId = req.user.teacher;   // sometimes stored on user object
  }

  if (!finalTeacherId) {
    res.status(403);
    throw new Error('No teacher record found for your account. Please ask an admin to assign you to a teacher.');
  }

  console.log('✅ finalTeacherId:', finalTeacherId);

  const project = await Project.create({
    title,
    description,
    classId,
    teacher: finalTeacherId,
    dueDate: dueDate || undefined,
    maxMarks: maxMarks || 100,
  });

  await project.populate('classId', 'name');
  await project.populate('teacher', 'userId');
  await project.populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } });

  console.log('✅ Project created successfully:', project._id);
  res.status(201).json({ success: true, project });
});

// PUT /api/projects/:id
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('classId', 'name')
    .populate('teacher', 'userId')
    .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } });

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  res.json({ success: true, project });
});

// DELETE /api/projects/:id
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  // Also delete all submissions for this project
  await ProjectSubmission.deleteMany({ project: req.params.id });
  res.json({ success: true, message: 'Project deleted' });
});

// GET /api/projects/:projectId/submissions
const getSubmissions = asyncHandler(async (req, res) => {
  const submissions = await ProjectSubmission.find({ project: req.params.projectId })
    .populate('student', 'userId rollNumber')
    .populate({ path: 'student', populate: { path: 'userId', select: 'name email' } })
    .sort({ submittedAt: -1 })
    .lean();

  res.json({ success: true, submissions });
});

// ------------------- STUDENT SELF‑SERVICE -------------------

// GET /api/projects/my
const getMyProjects = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student || !student.classId) {
    return res.json([]);
  }

  const projects = await Project.find({ classId: student.classId })
    .populate('teacher', 'userId')
    .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 })
    .lean();

  res.json(projects);
});

// POST /api/projects/:projectId/submit
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

module.exports = {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getSubmissions,
  getMyProjects,
  submitProject,
};