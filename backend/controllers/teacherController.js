const Teacher = require('../models/Teacher');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const Class = require('../models/Class');
const AcademicSession = require('../models/AcademicSession');
const asyncHandler = require('express-async-handler');
const {
  getActiveScheduleType,
  getDayBounds,
  validOnDateFilter,
} = require('../services/scheduleService');
const { applyCalendarEffectsToTimetable } = require('../services/effectiveScheduleService');

// @desc    Get all teachers with populated user info
// @route   GET /api/teachers
const getAllTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find({}).populate('userId', 'name email');
  res.json(teachers);
});

// @desc    Get the weekly schedule for the logged‑in teacher
// @route   GET /api/teachers/schedule
const getTeacherSchedule = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher profile not found');
  }

  const { start } = getDayBounds(req.query.date);
  const activeSession = await AcademicSession.findOne({ isActive: true }).lean();
  const academicYear = req.query.academicYear || activeSession?.name;
  const activeTerm = activeSession?.terms?.find((term) => (
    new Date(term.startDate) <= start && new Date(term.endDate) >= start
  ));
  const term = req.query.term || activeTerm?.name;
  const filter = {
    isActive: true,
    status: 'published',
    ...validOnDateFilter(start),
  };
  if (req.query.scheduleType) filter.scheduleType = req.query.scheduleType;
  if (academicYear) filter.academicYear = academicYear;
  if (term) filter.term = term;

  const candidateTimetables = await Timetable.find(filter)
    .populate('classId', 'name')
    .populate('slots.teacherId', 'userId')
    .populate({ path: 'slots.teacherId', populate: { path: 'userId', select: 'name' } })
    .sort({ updatedAt: -1 })
    .lean();

  const candidatesByClass = new Map();
  for (const timetable of candidateTimetables) {
    const classId = timetable.classId?._id?.toString() || timetable.classId?.toString();
    if (!classId) continue;
    if (!candidatesByClass.has(classId)) candidatesByClass.set(classId, []);
    candidatesByClass.get(classId).push(timetable);
  }

  const timetablesByClass = new Map();
  for (const [classId, timetables] of candidatesByClass.entries()) {
    const activeScheduleType = req.query.scheduleType
      || await getActiveScheduleType(start, academicYear, { classId });
    const preferred = timetables.find((timetable) => timetable.scheduleType === activeScheduleType)
      || (!req.query.scheduleType ? timetables.find((timetable) => timetable.scheduleType === 'regular') : null)
      || timetables[0];

    if (preferred) {
      timetablesByClass.set(classId, await applyCalendarEffectsToTimetable(preferred, start, {
        classId,
        academicYear,
      }));
    }
  }

  const schedule = [];
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (const tt of timetablesByClass.values()) {
    for (const slot of tt.slots) {
      if (slot.teacherId && slot.teacherId._id.toString() === teacher._id.toString()) {
        schedule.push({
          day: slot.day,
          period: slot.period,
          subject: slot.subject,
          class: tt.classId?.name,
          classId: tt.classId?._id,
          term: tt.term,
          academicYear: tt.academicYear,
          scheduleType: tt.scheduleType,
        });
      }
    }
  }

  schedule.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.period - b.period);
  res.json(schedule);
});

// @desc    Get single teacher by ID
const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id)
    .populate('userId', 'name username email avatar')
    .populate('classes', 'name subjects')
    .lean();

  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }
  res.json(teacher);
});

// @desc    Update teacher profile (classes, subjects, preferences)
const updateTeacher = asyncHandler(async (req, res) => {
  let teacher = await Teacher.findById(req.params.id);

  // If no Teacher profile exists, try to find the user by that ID and create one
  if (!teacher) {
    const user = await User.findById(req.params.id);
    if (user && user.role === 'teacher') {
      teacher = await Teacher.create({ userId: user._id });
    } else {
      res.status(404);
      throw new Error('Teacher not found');
    }
  }

  const { name, email, classes, subjects, preferredSubjects, preferredGrades } = req.body;

  // Update associated User document (name, email)
  if (name || email) {
    const user = await User.findById(teacher.userId);
    if (user) {
      if (name) user.name = name;
      if (email) {
        const exists = await User.findOne({ email, _id: { $ne: user._id } });
        if (exists) {
          res.status(400);
          throw new Error('Email already in use');
        }
        user.email = email;
      }
      await user.save();
    }
  }

  // Update teacher‑specific fields
  if (classes !== undefined) teacher.classes = classes;
  if (subjects !== undefined) teacher.subjects = subjects;
  if (preferredSubjects !== undefined) teacher.preferredSubjects = preferredSubjects;
  if (preferredGrades !== undefined) teacher.preferredGrades = preferredGrades;

  await teacher.save();

  // Return fully populated teacher
  const updated = await Teacher.findById(teacher._id)
    .populate('userId', 'name username email avatar')
    .populate('classes', 'name subjects');
  res.json(updated);
});

// @desc    Delete teacher and optionally the linked user
// @route   DELETE /api/teachers/:id
const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  // Optionally also delete the user account (if you want full cleanup)
  // await User.findByIdAndDelete(teacher.userId);

  await Teacher.findByIdAndDelete(req.params.id);
  res.json({ message: 'Teacher deleted' });
});

module.exports = {
  getAllTeachers,
  getTeacherSchedule,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};

