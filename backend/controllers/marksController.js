const Marks = require('../models/Marks');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');   // added
const Exam = require('../models/Exam');     
    // added
const auditService = require('../services/auditService'); // added
const asyncHandler = require('express-async-handler');

// --------------------------------------------------------
// ADD MARKS (bulk insert)
// --------------------------------------------------------
const addMarks = asyncHandler(async (req, res) => {
  const { classId, subject, examType, marksData } = req.body;

  // 1. Authorization (original)
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher.classes.includes(classId)) {
      res.status(403);
      throw new Error('Not assigned to this class');
    }
  }

  // 2. Build records
  const records = marksData.map(item => ({
    studentId: item.studentId,
    classId,
    subject,
    examType,
    marksObtained: item.marksObtained,
    totalMarks: item.totalMarks,
    examId: item.examId || null,
    enteredBy: req.user._id,
  }));

  // 3. Insert
  const insertedDocs = await Marks.insertMany(records);

  // 4. Audit log (after successful insert)
  try {
    // Collect all unique student and exam IDs to batch-fetch names
    const studentIds = [...new Set(insertedDocs.map(doc => doc.studentId))];
    const examIds = [...new Set(insertedDocs.map(doc => doc.examId).filter(Boolean))];

    // Fetch all relevant students and exams in one go
    const [students, exams] = await Promise.all([
      Student.find({ _id: { $in: studentIds } }).populate('userId', 'name').lean(),
      Exam.find({ _id: { $in: examIds } }).lean(),
    ]);

    // Build lookup maps for speed
    const studentMap = new Map(students.map(s => [s._id.toString(), s]));
    const examMap = new Map(exams.map(e => [e._id.toString(), e]));

    // Log each inserted mark
    const logPromises = insertedDocs.map(doc => {
      const student = studentMap.get(doc.studentId.toString());
      const exam = doc.examId ? examMap.get(doc.examId.toString()) : null;
      const studentName = student?.userId?.name || 'Unknown';
      const examName = exam?.name || 'Exam';

      return auditService.log({
        action: 'CREATE',
        entity: 'Marks',
        entityId: doc._id,
        description: `Marks entered for ${studentName} in ${examName}`,
        performedBy: {
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name,
        },
        changes: null, // no previous state
        req,
      });
    });

    await Promise.all(logPromises);
  } catch (auditError) {
    console.error('Audit log failed:', auditError.message);
  }

  res.status(201).json({ message: 'Marks saved' });
});

// --------------------------------------------------------
// GET MARKS (no audit needed)
// --------------------------------------------------------
const getMarks = asyncHandler(async (req, res) => {
  const { classId, subject, examType } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (subject) filter.subject = subject;
  if (examType) filter.examType = examType;

  const marks = await Marks.find(filter).lean();
  res.json(marks);
});

// --------------------------------------------------------
// SAVE MARKS (delete + insert – effectively an upsert)
// --------------------------------------------------------
const saveMarks = asyncHandler(async (req, res) => {
  const { classId, subject, examType, marksData } = req.body;

  if (!classId || !subject || !examType) {
    res.status(400);
    throw new Error('classId, subject, and examType are required');
  }

  // 1. Remove existing marks for this exact combination (original)
  await Marks.deleteMany({ classId, subject, examType });

  // 2. Prepare new documents
  const documents = marksData.map(m => ({
    studentId: m.studentId,
    classId,
    subject,
    examType,
    marksObtained: m.marksObtained,
    totalMarks: m.totalMarks,
    ...(req.body.examId && { examId: req.body.examId }),
  }));

  if (documents.length === 0) {
    return res.json({ message: 'No marks to save' });
  }

  // 3. Insert new marks
  const created = await Marks.insertMany(documents);

  // 4. Audit log (after successful insert)
  try {
    // Collect unique student & exam IDs
    const studentIds = [...new Set(created.map(doc => doc.studentId))];
    const examIds = [...new Set(created.map(doc => doc.examId).filter(Boolean))];

    const [students, exams] = await Promise.all([
      Student.find({ _id: { $in: studentIds } }).populate('userId', 'name').lean(),
      Exam.find({ _id: { $in: examIds } }).lean(),
    ]);

    const studentMap = new Map(students.map(s => [s._id.toString(), s]));
    const examMap = new Map(exams.map(e => [e._id.toString(), e]));

    const logPromises = created.map(doc => {
      const student = studentMap.get(doc.studentId.toString());
      const exam = doc.examId ? examMap.get(doc.examId.toString()) : null;
      const studentName = student?.userId?.name || 'Unknown';
      const examName = exam?.name || 'Exam';

      return auditService.log({
        action: 'UPDATE',   // because old marks were deleted and new ones set
        entity: 'Marks',
        entityId: doc._id,
        description: `Marks updated for ${studentName} in ${examName}`,
        performedBy: {
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name,
        },
        changes: {
          before: { status: 'previous marks removed' },
          after: { marksObtained: doc.marksObtained, totalMarks: doc.totalMarks },
        },
        req,
      });
    });

    await Promise.all(logPromises);
  } catch (auditError) {
    console.error('Audit log failed:', auditError.message);
  }

  res.status(201).json(created);
});

module.exports = { addMarks, getMarks, saveMarks };