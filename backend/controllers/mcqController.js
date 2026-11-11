const McqExam = require('../models/McqExam');
const Teacher = require('../models/Teacher');
const asyncHandler = require('express-async-handler');

// ─── TEACHER CRUD ───────────────────────────────────

// POST /api/mcq-exams
const createExam = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    res.status(403);
    throw new Error('Teacher profile not found');
  }

  const exam = await McqExam.create({
    ...req.body,
    teacherId: teacher._id,
  });
  const validateQuestions = (questions) => {
  if (!questions || questions.length === 0) return true; // allow saving draft with no questions
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.questionText || q.questionText.trim() === '') {
      throw new Error(`Question ${i + 1}: Question text is required`);
    }
    if (!q.options || q.options.length !== 4) {
      throw new Error(`Question ${i + 1}: Exactly 4 options are required`);
    }
    if (q.options.some(opt => opt.trim() === '')) {
      throw new Error(`Question ${i + 1}: All options must be filled`);
    }
    if (q.correctOption === undefined || q.correctOption < 0 || q.correctOption > 3) {
      throw new Error(`Question ${i + 1}: A valid correct option (0‑3) is required`);
    }
  }
};

  res.status(201).json({ success: true, exam });
});

// GET /api/mcq-exams (my exams)
// GET /api/mcq-exams (my exams)
const getMyExams = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) return res.json([]);

  const filter = { teacherId: teacher._id };
  if (req.query.classId) filter.classId = req.query.classId;

  const exams = await McqExam.find(filter)
    .populate('classId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  // 🔥 Fetch all subjects to resolve names
  const Subject = require('../models/Subject');
  const allSubjects = await Subject.find().lean();
  const subjectMap = {};
  allSubjects.forEach(s => {
    subjectMap[s._id.toString()] = s.name;
  });

  // Attach resolved subject name to each exam
  const examsWithSubjectNames = exams.map(exam => ({
    ...exam,
    subjectName: subjectMap[String(exam.subject)] || exam.subject, // name or fallback
  }));

  res.json({ success: true, exams: examsWithSubjectNames });
});

// GET /api/mcq-exams/:id
const getExamById = asyncHandler(async (req, res) => {
  const exam = await McqExam.findById(req.params.id)
    .populate('classId', 'name')
    .lean();

  if (!exam) {
    res.status(404);
    throw new Error('MCQ Exam not found');
  }

  res.json({ success: true, exam });
});

// PUT /api/mcq-exams/:id
const updateExam = asyncHandler(async (req, res) => {
  const exam = await McqExam.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!exam) {
    res.status(404);
    throw new Error('MCQ Exam not found');
  }
  const validateQuestions = (questions) => {
  if (!questions || questions.length === 0) return true; // allow saving draft with no questions
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.questionText || q.questionText.trim() === '') {
      throw new Error(`Question ${i + 1}: Question text is required`);
    }
    if (!q.options || q.options.length !== 4) {
      throw new Error(`Question ${i + 1}: Exactly 4 options are required`);
    }
    if (q.options.some(opt => opt.trim() === '')) {
      throw new Error(`Question ${i + 1}: All options must be filled`);
    }
    if (q.correctOption === undefined || q.correctOption < 0 || q.correctOption > 3) {
      throw new Error(`Question ${i + 1}: A valid correct option (0‑3) is required`);
    }
  }
};

  res.json({ success: true, exam });
});

// DELETE /api/mcq-exams/:id
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await McqExam.findByIdAndDelete(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('MCQ Exam not found');
  }
  res.json({ success: true, message: 'MCQ Exam deleted' });
});

// PUT /api/mcq-exams/:id/publish
const togglePublish = asyncHandler(async (req, res) => {
  const exam = await McqExam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error('MCQ Exam not found');
  }
  
  // Prevent publishing if no questions exist
  if (!exam.isPublished && (!exam.questions || exam.questions.length === 0)) {
    res.status(400);
    throw new Error('Cannot publish an exam with no questions');
  }
  
  exam.isPublished = !exam.isPublished;
  await exam.save();
  res.json({ success: true, exam });
});
const McqSubmission = require('../models/McqSubmission');
const Student = require('../models/Student');

// ─── STUDENT SELF‑SERVICE ─────────────────────────

// GET /api/mcq-exams/available
const getAvailableExams = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student || !student.classId) {
    return res.json([]);
  }

  const exams = await McqExam.find({
    classId: student.classId,
    isPublished: true,
  })
    .populate('teacherId', 'userId')
    .populate({ path: 'teacherId', populate: { path: 'userId', select: 'name' } })
    .select('title description subject duration questions')
    .lean();

  // 🔥 Fetch all subjects to resolve names
  const Subject = require('../models/Subject');
  const allSubjects = await Subject.find().lean();
  const subjectMap = {};
  allSubjects.forEach(s => {
    subjectMap[s._id.toString()] = s.name;
  });

  const safeExams = exams.map(exam => ({
    ...exam,
    subjectName: subjectMap[String(exam.subject)] || exam.subject,  // show name or fallback to ID
    questionsCount: exam.questions?.length || 0,
    questions: undefined,
  }));

  res.json({ success: true, exams: safeExams });
});

// GET /api/mcq-exams/:id/take
const getExamForStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    res.status(403);
    throw new Error('Student profile not found');
  }

  const exam = await McqExam.findById(req.params.id).lean();
  if (!exam || !exam.isPublished) {
    res.status(404);
    throw new Error('Exam not available');
  }

  const alreadySubmitted = await McqSubmission.findOne({
    examId: exam._id,
    studentId: student._id,
  });
  if (alreadySubmitted) {
    res.status(400);
    throw new Error('You have already taken this exam');
  }

  // 🔥 Fetch subject name
  const Subject = require('../models/Subject');
  const subject = await Subject.findById(exam.subject).lean();
  const subjectName = subject ? subject.name : exam.subject;

  const safeQuestions = exam.questions.map(q => ({
    _id: q._id,
    questionText: q.questionText,
    options: q.options,
    marks: q.marks,
  }));

  res.json({
    success: true,
    exam: {
      _id: exam._id,
      title: exam.title,
      subject: subjectName,   // ✅ now shows the name
      subjectId: exam.subject, // keep original ID if needed
      duration: exam.duration,
      questions: safeQuestions,
    },
  });
});
// POST /api/mcq-exams/:id/submit
// POST /api/mcq-exams/:id/submit (with timer enforcement)
const submitExam = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    res.status(403);
    throw new Error('Student profile not found');
  }

  const exam = await McqExam.findById(req.params.id);
  if (!exam || !exam.isPublished) {
    res.status(404);
    throw new Error('Exam not available');
  }

  // Check duplicate submission
  const existing = await McqSubmission.findOne({
    examId: exam._id,
    studentId: student._id,
  });
  if (existing) {
    res.status(400);
    throw new Error('You have already submitted this exam');
  }

  const { answers, timeTaken, startTime } = req.body;

  if (!answers || !Array.isArray(answers)) {
    res.status(400);
    throw new Error('Answers are required');
  }

  // ⏱️ Timer enforcement – reject if time exceeded (with 10‑second grace period)
  if (startTime) {
    const examStart = new Date(startTime);
    const examEnd = new Date(examStart.getTime() + exam.duration * 60 * 1000);
    const now = new Date();
    const gracePeriod = 10 * 1000; // 10 seconds extra for network delay

    if (now.getTime() > examEnd.getTime() + gracePeriod) {
      res.status(400);
      throw new Error('Time limit exceeded. Your submission was rejected.');
    }
  }

  // Auto‑grade
  let score = 0;
  const gradedAnswers = answers.map(ans => {
    const question = exam.questions[ans.questionIndex];
    const isCorrect = question && ans.selectedOption === question.correctOption;
    if (isCorrect) score += question.marks || 1;
    return {
      questionIndex: ans.questionIndex,
      selectedOption: ans.selectedOption,
      isCorrect,
    };
  });

  const totalMarks = exam.questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  const submission = await McqSubmission.create({
    examId: exam._id,
    studentId: student._id,
    answers: gradedAnswers,
    score,
    totalMarks,
    timeTaken: timeTaken || 0,
  });

  // Record tab switches if provided (optional)
  if (req.body.tabSwitches !== undefined) {
    // You could store this in the submission or a separate log
    console.log(`Student ${student._id} had ${req.body.tabSwitches} tab switches`);
  }

  res.status(201).json({
    success: true,
    submission: {
      _id: submission._id,
      score,
      totalMarks,
      percentage: Math.round((score / totalMarks) * 100),
    },
  });
});

// GET /api/mcq-exams/:id/my-result
// GET /api/mcq-exams/:id/my-result
const getMyResult = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    res.status(403);
    throw new Error('Student profile not found');
  }

  const submission = await McqSubmission.findOne({
    examId: req.params.id,
    studentId: student._id,
  }).lean();

  if (!submission) {
    res.status(404);
    throw new Error('No submission found');
  }

  // Fetch exam to show correct answers and explanations
  const exam = await McqExam.findById(req.params.id).lean();

  // 🔥 Fetch subject name
  const Subject = require('../models/Subject');
  const subject = await Subject.findById(exam.subject).lean();
  const subjectName = subject ? subject.name : exam.subject;

  // Merge correct answers and explanations into the submission
  const enrichedAnswers = submission.answers.map(ans => {
    const question = exam?.questions[ans.questionIndex];
    return {
      ...ans,
      questionText: question?.questionText || '',
      options: question?.options || [],
      correctOption: question?.correctOption,
      explanation: question?.explanation || '',
      marks: question?.marks || 1,
    };
  });

  res.json({
    success: true,
    submission: {
      ...submission,
      answers: enrichedAnswers,
      examTitle: exam?.title || '',
      subject: subjectName,   // ✅ now shows the name instead of raw ID
    },
  });
});
// ─── TEACHER ANALYTICS ────────────────────────────

// GET /api/mcq-exams/:id/results
const getExamResults = asyncHandler(async (req, res) => {
  const submissions = await McqSubmission.find({ examId: req.params.id })
    .populate('studentId', 'userId rollNumber')
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name avatar' } })
    .sort({ score: -1 })
    .lean();

  res.json({ success: true, submissions });
});

// GET /api/mcq-exams/:id/analytics
const getExamAnalytics = asyncHandler(async (req, res) => {
  const exam = await McqExam.findById(req.params.id).lean();
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  const submissions = await McqSubmission.find({ examId: req.params.id }).lean();
  const totalStudents = submissions.length;

  // Per‑question stats
  const questionStats = exam.questions.map((q, idx) => {
    const answersForThisQ = submissions
      .map(sub => sub.answers.find(a => a.questionIndex === idx))
      .filter(Boolean);

    const correctCount = answersForThisQ.filter(a => a.isCorrect).length;
    const optionDistribution = [0, 1, 2, 3].map(optIdx => ({
      option: String.fromCharCode(65 + optIdx),
      count: answersForThisQ.filter(a => a.selectedOption === optIdx).length,
    }));

    return {
      questionIndex: idx,
      questionText: q.questionText,
      correctOption: q.correctOption,
      totalAnswers: answersForThisQ.length,
      correctCount,
      correctPercentage: totalStudents > 0 ? Math.round((correctCount / totalStudents) * 100) : 0,
      optionDistribution,
    };
  });

  // Overall stats
  const scores = submissions.map(s => s.score);
  const averageScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  res.json({
    success: true,
    analytics: {
      totalStudents,
      averageScore,
      highestScore,
      lowestScore,
      questionStats,
    },
  });
});

module.exports = {
  createExam,
  getMyExams,
  getExamById,
  updateExam,
  deleteExam,
  togglePublish,
  getAvailableExams,        // new
  getExamForStudent,        // new
  submitExam,               // new
  getMyResult,
   getExamResults,      // new
  getExamAnalytics, 
};