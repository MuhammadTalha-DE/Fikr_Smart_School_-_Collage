const Assignment = require('../models/Assignment');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const asyncHandler = require('express-async-handler');
const learningContinuityService = require('../services/learningContinuityService');

let cloudinary;
try {
  cloudinary = require('../config/cloudinary');
} catch (error) {
  console.warn('Cloudinary not available');
}
const fs = require('fs');

const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, classId, dueDate } = req.body;
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher profile not found');
  }

  const assignment = await Assignment.create({
    title,
    description,
    classId,
    teacherId: teacher._id,
    dueDate,
  });

  learningContinuityService.recordEvent({
    date: new Date(),
    teacher: teacher._id,
    classId,
    source: 'assignment',
    increments: {
      assignmentsPublished: 1,
      resourcesShared: 1,
    },
    setFields: {
      deliveryMode: 'hybrid',
    },
    metadata: {
      assignmentId: assignment._id,
      dueDate,
    },
  }).catch((error) => {
    console.error('Learning continuity assignment log failed:', error.message);
  });

  res.status(201).json(assignment);
});

const getAssignments = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;

  const assignments = await Assignment.find(filter)
    .populate('classId', 'name')
    .populate('teacherId', 'userId')
    .populate({ path: 'teacherId', populate: { path: 'userId', select: 'name' } })
    .lean();

  res.json(assignments);
});

const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  const student = await Student.findOne({ userId: req.user._id });
  if (!student || student.classId.toString() !== assignment.classId.toString()) {
    res.status(403);
    throw new Error('You are not enrolled in this class');
  }

  let fileUrl = req.body.fileUrl || '';
  if (req.file) {
    if (cloudinary) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'assignment_submissions',
        resource_type: 'auto',
      });
      fileUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    } else {
      fileUrl = `/uploads/assignments/${req.file.filename}`;
    }
  }
  if (!fileUrl) {
    res.status(400);
    throw new Error('A file or URL is required');
  }

  const existingIdx = assignment.submissions.findIndex(
    (submission) => submission.studentId.toString() === student._id.toString()
  );
  if (existingIdx !== -1) {
    assignment.submissions[existingIdx].submittedAt = new Date();
    assignment.submissions[existingIdx].fileUrl = fileUrl;
  } else {
    assignment.submissions.push({ studentId: student._id, submittedAt: new Date(), fileUrl });
  }
  await assignment.save();

  learningContinuityService.recordEvent({
    date: new Date(),
    classId: assignment.classId,
    source: 'submission',
    increments: {
      submissionsReceived: 1,
    },
    metadata: {
      assignmentId: assignment._id,
      studentId: student._id,
    },
  }).catch((error) => {
    console.error('Learning continuity submission log failed:', error.message);
  });

  res.json({ message: 'Assignment submitted successfully', fileUrl });
});

const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('submissions.studentId', 'userId rollNumber')
    .populate({ path: 'submissions.studentId', populate: { path: 'userId', select: 'name avatar' } })
    .lean();

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  res.json(assignment.submissions || []);
});

const gradeSubmission = asyncHandler(async (req, res) => {
  const { assignmentId, studentId, marks, feedback } = req.body;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  const submission = assignment.submissions.find(
    (item) => item.studentId.toString() === studentId
  );
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  submission.marks = marks;
  submission.feedback = feedback || '';
  await assignment.save();

  res.json({ success: true, submission });
});

const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('classId', 'name')
    .lean();

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  res.json(assignment);
});

const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  const { title, description, classId, dueDate } = req.body;
  if (title) assignment.title = title;
  if (description !== undefined) assignment.description = description;
  if (classId) assignment.classId = classId;
  if (dueDate) assignment.dueDate = dueDate;

  const updated = await assignment.save();
  res.json(updated);
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByIdAndDelete(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  res.json({ message: 'Assignment deleted' });
});

const getMySubmissions = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const assignments = await Assignment.find(
    { 'submissions.studentId': student._id },
    { title: 1, dueDate: 1, classId: 1, 'submissions.$': 1 }
  ).lean();

  const mySubmissions = assignments.map((assignment) => {
    const submission = assignment.submissions[0];
    return {
      assignmentId: assignment._id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      classId: assignment.classId,
      submittedAt: submission.submittedAt,
      fileUrl: submission.fileUrl,
      marks: submission.marks,
      feedback: submission.feedback,
    };
  });

  res.json(mySubmissions);
});

module.exports = {
  createAssignment,
  getAssignments,
  getMySubmissions,
  submitAssignment,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
};
