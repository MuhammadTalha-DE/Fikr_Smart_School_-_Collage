/*
const asyncHandler = require('express-async-handler');
const groqService = require('../services/groqService');
const auditService = require('../services/auditService');
const ChatbotConversation = require('../models/ChatbotConversation');
// Import models that we'll need
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Exam = require('../models/Exam');
const Timetable = require('../models/Timetable');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const FeeInstallment = require('../models/FeeInstallment');
const HostelStudent = require('../models/HostelStudent');
const HostelLeave = require('../models/HostelLeave');
const HostelComplaint = require('../models/HostelComplaint');
const HostelVisitor = require('../models/HostelVisitor');
const MessMenu = require('../models/MessMenu');
const Book = require('../models/Book');
const LibraryTransaction = require('../models/LibraryTransaction');
const TransportAllocation = require('../models/TransportAllocation');
const Announcement = require('../models/Announcement');
const AcademicEvent = require('../models/AcademicEvent');
const User = require('../models/User');




// ─── ALL SYSTEM TOOLS ───────────────────────────────
const systemTools = [
  // ── Attendance ──
  {
    type: 'function',
    function: {
      name: 'get_my_attendance',
      description: 'Get my own attendance summary for a given date or date range.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date', description: 'Start date (YYYY-MM-DD)' },
          endDate:   { type: 'string', format: 'date', description: 'End date (optional)' }
        },
        required: ['startDate']
      }
    }
  },
  // ── Marks ──
  {
    type: 'function',
    function: {
      name: 'get_my_marks',
      description: 'Get my exam marks, optionally filtered by exam name or subject.',
      parameters: {
        type: 'object',
        properties: {
          examName: { type: 'string', description: 'Optional exam name (e.g., Midterm)' },
          subject:  { type: 'string', description: 'Optional subject name' }
        }
      }
    }
  },
  // ── Timetable ──
  {
    type: 'function',
    function: {
      name: 'get_my_timetable',
      description: 'Get my class timetable for today or a specific day.',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'string', description: 'Day of the week (Monday, Tuesday, ...) or "today"' }
        }
      }
    }
  },
  // ── Fees ──
  {
    type: 'function',
    function: {
      name: 'get_my_fee_status',
      description: 'Get my fee account status: total, paid, due, and instalments.',
      parameters: { type: 'object', properties: {} }
    }
  },
  // ── Hostel ──
  {
    type: 'function',
    function: {
      name: 'get_my_hostel_info',
      description: 'Get my hostel room, bed, and leave/visitor/complaint summary.',
      parameters: { type: 'object', properties: {} }
    }
  },
  // ── Library ──
  {
    type: 'function',
    function: {
      name: 'get_my_library_books',
      description: 'Get list of books I have borrowed and due dates.',
      parameters: { type: 'object', properties: {} }
    }
  },
  // ── Transport ──
  {
    type: 'function',
    function: {
      name: 'get_my_transport',
      description: 'Get my assigned transport route and vehicle details.',
      parameters: { type: 'object', properties: {} }
    }
  },
  // ── Announcements ──
  {
    type: 'function',
    function: {
      name: 'get_announcements',
      description: 'Get recent school announcements (last 5).',
      parameters: { type: 'object', properties: {} }
    }
  },
  // ── Academic Calendar ──
  {
    type: 'function',
    function: {
      name: 'get_upcoming_events',
      description: 'Get upcoming academic events / holidays / exams.',
      parameters: {
        type: 'object',
        properties: {
          daysAhead: { type: 'number', description: 'Number of days ahead to look (default 7)' }
        }
      }
    }
  },
  // ── Exam Schedule ──
  {
    type: 'function',
    function: {
      name: 'get_exam_schedule',
      description: 'Get upcoming exams for my class.',
      parameters: { type: 'object', properties: {} }
    }
  },
  // ── Profile ──
  {
    type: 'function',
    function: {
      name: 'get_my_profile',
      description: 'Get my user profile information.',
      parameters: { type: 'object', properties: {} }
    }
  },
  // ── Mess Menu ──
  {
    type: 'function',
    function: {
      name: 'get_mess_menu',
      description: 'Get the current week\'s mess menu.',
      parameters: { type: 'object', properties: {} }
    }
  },
  // ── General school info ──
  {
    type: 'function',
    function: {
      name: 'get_school_info',
      description: 'Get basic school information (name, address, contact).',
      parameters: { type: 'object', properties: {} }
    }
  }
];

// ─── TOOL HANDLERS ─────────────────────────────────
const toolHandlers = {
  get_my_attendance: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const filter = { studentId: student._id };
    if (args.startDate) filter.date = { $gte: new Date(args.startDate) };
    if (args.endDate) filter.date.$lte = new Date(args.endDate);
    const records = await Attendance.find(filter).sort('date').lean();
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      rate: records.length ? ((records.filter(r => r.status === 'present').length / records.length) * 100).toFixed(1) + '%' : 'N/A'
    };
    return { attendance: summary, details: records.slice(0, 10) }; // only last 10 for brevity
  },

  get_my_marks: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const filter = { studentId: student._id };
    if (args.examName) {
      const exam = await Exam.findOne({ name: args.examName, classId: student.classId });
      if (exam) filter.examId = exam._id;
    }
    const marks = await Marks.find(filter)
      .populate('examId', 'name')
      .populate('subjectId', 'name')
      .lean();
    return { marks: marks.map(m => ({ exam: m.examId?.name, subject: m.subjectId?.name, marksObtained: m.marksObtained, totalMarks: m.totalMarks })) };
  },

  get_my_timetable: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id }).populate('classId');
    if (!student) return { error: 'No student profile found.' };
    const day = args.day || 'today';
    // Timetable is stored with day field; we can filter by classId and day
    const filter = { classId: student.classId._id };
    if (day !== 'today') filter.day = day;
    else filter.day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const timetable = await Timetable.find(filter).populate('subjectId', 'name').lean();
    return { timetable };
  },

  get_my_fee_status: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const accounts = await StudentFeeAccount.find({ studentId: student._id }).lean();
    for (let acc of accounts) {
      acc.instalments = await FeeInstallment.find({ studentFeeAccount: acc._id }).lean();
    }
    return { feeAccounts: accounts };
  },

  get_my_hostel_info: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const hostelRec = await HostelStudent.findOne({ studentId: student._id, status: 'active' })
      .populate('hostelId', 'name')
      .populate('roomId', 'roomNumber')
      .populate('bedId', 'bedNumber')
      .lean();
    if (!hostelRec) return { message: 'You are not currently in a hostel.' };
    const [leaves, complaints, visitors] = await Promise.all([
      HostelLeave.find({ hostelStudentId: hostelRec._id }).sort('-createdAt').limit(5).lean(),
      HostelComplaint.find({ hostelStudentId: hostelRec._id }).sort('-createdAt').limit(5).lean(),
      HostelVisitor.find({ hostelStudentId: hostelRec._id }).sort('-createdAt').limit(5).lean()
    ]);
    return { hostel: hostelRec, leaves, complaints, visitors };
  },

  get_my_library_books: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const transactions = await LibraryTransaction.find({ studentId: student._id, returnedDate: null })
      .populate('bookId', 'title author')
      .lean();
    return { borrowedBooks: transactions.map(t => ({ title: t.bookId?.title, author: t.bookId?.author, dueDate: t.dueDate })) };
  },

  get_my_transport: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const allocation = await TransportAllocation.findOne({ studentId: student._id, active: true })
      .populate('routeId', 'name')
      .populate('vehicleId', 'registrationNumber')
      .lean();
    return { transport: allocation || { message: 'No transport allocation found.' } };
  },

  get_announcements: async (args, req) => {
    const announcements = await Announcement.find().sort('-createdAt').limit(5).lean();
    return { announcements };
  },

  get_upcoming_events: async (args, req) => {
  const days = args.daysAhead || 7;
  const from = new Date();
  const to = new Date(Date.now() + days * 86400000);
  // AcademicEvent model has fields: date, name, type, etc.
  const events = await AcademicEvent.find({
    startDate: { $gte: from, $lte: to },   // adjust field name if needed (your model may use 'date')
  }).sort('startDate').lean();
  return { events };
},

  get_exam_schedule: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const exams = await Exam.find({ classId: student.classId, date: { $gte: new Date() } })
      .populate('subjects.subjectId', 'name')
      .sort('date')
      .lean();
    return { exams };
  },

  get_my_profile: async (args, req) => {
    const user = await User.findById(req.user._id).select('-password').lean();
    return { profile: user };
  },

  get_mess_menu: async (args, req) => {
    const today = new Date();
    const menu = await MessMenu.findOne({ weekStart: { $lte: today } }).sort('-weekStart').lean();
    return { messMenu: menu };
  },

  get_school_info: async (args, req) => {
    const Config = require('../models/Config');
    const entries = await Config.find({ key: { $in: ['school_name', 'school_phone', 'school_email', 'school_street', 'school_city', 'school_state'] } });
    const info = {};
    entries.forEach(e => { info[e.key] = e.value; });
    return { schoolInfo: info };
  }
};

// ─── MAIN CONTROLLER ──────────────────────────────
const ChatConversation = require('../models/ChatConversation');

const handleMessage = asyncHandler(async (req, res) => {

  const {
    message,
    mode,
    history,
    conversationId
  } = req.body;

  // ======================================================
  // VALIDATION
  // ======================================================

  if (!message) {

    res.status(400);

    throw new Error('Message is required');
  }

  let reply = '';

  // ======================================================
  // GENERAL MODE
  // ======================================================

  if (mode === 'general') {

    const messages = [

      {
        role: 'system',
        content:
          'You are a friendly school assistant. Answer all questions helpfully, concisely, and with a warm tone. Format your answers nicely using bullet points or short paragraphs.'
      },

      ...(history || []),

      {
        role: 'user',
        content: message
      }
    ];

    // ======================================================
    // GET AI REPLY
    // ======================================================

    reply = await groqService.getGeneralCompletion(
      messages
    );
  }

  // ======================================================
  // SYSTEM MODE
  // ======================================================

  else if (mode === 'system') {

    const systemPrompt = `
You are Fikr Smart AI, the official assistant of Fikr Smart School ERP.

You have access to real-time student data and school information.

Always use the available functions to answer questions accurately.

Current user:
${req.user.name}

Role:
${req.user.role}

If a function returns an error, politely explain the issue.

Keep responses friendly and helpful.
`;

    const messages = [

      {
        role: 'system',
        content: systemPrompt
      },

      ...(history || []),

      {
        role: 'user',
        content: message
      }
    ];

    // ======================================================
    // INITIAL AI RESPONSE
    // ======================================================

    const response =
      await groqService.getSystemCompletion(
        messages,
        systemTools
      );

    // ======================================================
    // TOOL CALL HANDLING
    // ======================================================

    if (
      response.tool_calls &&
      response.tool_calls.length > 0
    ) {

      const toolMessages = [];

      for (const toolCall of response.tool_calls) {

        const fnName =
          toolCall.function.name;

        const args = JSON.parse(
          toolCall.function.arguments
        );

        if (toolHandlers[fnName]) {

          try {

            const fnResult =
              await toolHandlers[fnName](
                args,
                req
              );

            toolMessages.push({

              role: 'tool',

              content: JSON.stringify(
                fnResult
              ),

              tool_call_id: toolCall.id
            });

          } catch (err) {

            toolMessages.push({

              role: 'tool',

              content: JSON.stringify({
                error:
                  'Function execution failed'
              }),

              tool_call_id: toolCall.id
            });
          }
        }
      }

      // ======================================================
      // FINAL AI RESPONSE AFTER TOOL EXECUTION
      // ======================================================

      const finalMessages = messages.concat(
        [response],
        toolMessages
      );

      reply =
        await groqService.getGeneralCompletion(
          finalMessages
        );

    } else {

      // ======================================================
      // NO TOOL CALLS
      // ======================================================

      reply =
        response.content ||
        'No response generated.';
    }

  }

  // ======================================================
  // INVALID MODE
  // ======================================================

  else {

    return res.status(400).json({

      message:
        'Invalid mode. Use "general" or "system".'
    });
  }

  // ======================================================
  // SAVE / UPDATE CONVERSATION
  // ======================================================

  let conv;

  // ======================================================
  // FIND EXISTING CONVERSATION
  // ======================================================

  if (conversationId) {

    conv =
      await ChatConversation.findOne({

        _id: conversationId,

        userId: req.user._id
      });
  }

  // ======================================================
  // CREATE NEW CONVERSATION
  // ======================================================

  if (!conv) {

    conv = new ChatConversation({

      userId: req.user._id,

      mode,

      title: message.slice(0, 50)
    });
  }

  // ======================================================
  // SAVE USER MESSAGE
  // ======================================================

  conv.messages.push({

    role: 'user',

    content: message
  });

  // ======================================================
  // SAVE ASSISTANT MESSAGE
  // ======================================================

  conv.messages.push({

    role: 'assistant',

    content: reply
  });

  // ======================================================
  // UPDATE MODE
  // ======================================================

  conv.mode = mode;

  // ======================================================
  // SAVE TO DATABASE
  // ======================================================

  await conv.save();

  // ======================================================
  // FINAL RESPONSE
  // ======================================================

  res.json({

    reply,

    conversationId: conv._id,

    title: conv.title
  });

});

const getConversations = asyncHandler(async (req, res) => {
  const convs = await ChatConversation.find({ userId: req.user._id })
    .select('title mode updatedAt')
    .sort('-updatedAt')
    .lean();
  res.json(convs);
});

// @desc    Get a single conversation with messages
// @route   GET /api/chatbot/conversations/:id
const getConversation = asyncHandler(async (req, res) => {
  const conv = await ChatConversation.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!conv) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  res.json(conv);
});

// @desc    Delete a conversation
// @route   DELETE /api/chatbot/conversations/:id
const deleteConversation = asyncHandler(async (req, res) => {
  const conv = await ChatConversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!conv) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  res.json({ message: 'Conversation deleted' });
});

// @desc    Handle vision message (image upload)
// @route   POST /api/chatbot/vision
const handleVisionMessage = asyncHandler(async (req, res) => {
  const { message, mode, conversationId } = req.body;
  const file = req.file;

  if (!file) {
    res.status(400);
    throw new Error('Image is required');
  }

  // Read file and convert to base64
  const fs = require('fs');
  const imageBuffer = fs.readFileSync(file.path);
  const imageBase64 = imageBuffer.toString('base64');
  fs.unlinkSync(file.path);   // clean up temp file

  const messages = [
    { role: 'system', content: 'You are a helpful assistant. Describe images and answer questions about them.' },
    ...(req.body.history ? JSON.parse(req.body.history) : []),
  ];

  const reply = await groqService.getVisionCompletion(messages, imageBase64);

  // Save conversation (same as handleMessage)
  let conv;
  if (conversationId) {
    conv = await ChatConversation.findOne({ _id: conversationId, userId: req.user._id });
  }
  if (!conv) {
    conv = new ChatConversation({ userId: req.user._id, mode: mode || 'general', title: message?.slice(0, 50) || 'Image Chat' });
  }
  conv.messages.push({ role: 'user', content: message || 'User sent an image', imageUrl: file.filename });
  conv.messages.push({ role: 'assistant', content: reply });
  await conv.save();

  res.json({ reply, conversationId: conv._id });
});
// @desc    Update message feedback
// @route   PUT /api/chatbot/conversations/:convId/messages/:msgId/feedback
const updateFeedback = asyncHandler(async (req, res) => {
  const { convId, msgId } = req.params;
  const { feedback } = req.body;

  if (!['up', 'down'].includes(feedback)) {
    res.status(400);
    throw new Error('Invalid feedback value');
  }

  const conv = await ChatConversation.findOne({ _id: convId, userId: req.user._id });
  if (!conv) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const msg = conv.messages.id(msgId);
  if (!msg) {
    res.status(404);
    throw new Error('Message not found');
  }

  msg.feedback = feedback;
  await conv.save();

  res.json({ success: true });
});

module.exports = {
  handleMessage,
  getConversations,
  getConversation,
  deleteConversation,
  handleVisionMessage,
  updateFeedback
};

*/
const asyncHandler = require('express-async-handler');
const groqService = require('../services/groqService');
const auditService = require('../services/auditService');
const ChatbotConversation = require('../models/ChatbotConversation');   // ✅ Correct model import
const deepseekService = require('../services/deepseekService');   // ← NEW
// Import models that we'll need
const Student = require('../models/Student');

const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Exam = require('../models/Exam');
const Timetable = require('../models/Timetable');
const StudentFeeAccount = require('../models/StudentFeeAccount');
const FeeInstallment = require('../models/FeeInstallment');
const HostelStudent = require('../models/HostelStudent');
const HostelLeave = require('../models/HostelLeave');
const HostelComplaint = require('../models/HostelComplaint');
const HostelVisitor = require('../models/HostelVisitor');
const MessMenu = require('../models/MessMenu');
const Book = require('../models/Book');
const LibraryTransaction = require('../models/LibraryTransaction');
const TransportAllocation = require('../models/TransportAllocation');
const Announcement = require('../models/Announcement');
const AcademicEvent = require('../models/AcademicEvent');
const User = require('../models/User');


// ─── ALL SYSTEM TOOLS ───────────────────────────────
const systemTools = [
  {
    type: 'function',
    function: {
      name: 'get_my_attendance',
      description:
      'Get MY OWN attendance summary for a given date or date range. ' +
      'This function automatically uses the logged-in student, ' +
      'so DO NOT pass any student name or ID. ' +
      'Only provide startDate (required) and optionally endDate.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date', description: 'Start date (YYYY-MM-DD)' },
          endDate:   { type: 'string', format: 'date', description: 'End date (optional)' }
        },
        required: ['startDate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_marks',
      description: 'Get my exam marks, optionally filtered by exam name or subject.',
      parameters: {
        type: 'object',
        properties: {
          examName: { type: 'string', description: 'Optional exam name (e.g., Midterm)' },
          subject:  { type: 'string', description: 'Optional subject name' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_timetable',
      description: 'Get my class timetable for today or a specific day.',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'string', description: 'Day of the week (Monday, Tuesday, ...) or "today"' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_fee_status',
      description: 'Get my fee account status: total, paid, due, and instalments.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_hostel_info',
      description: 'Get my hostel room, bed, and leave/visitor/complaint summary.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_library_books',
      description: 'Get list of books I have borrowed and due dates.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_transport',
      description: 'Get my assigned transport route and vehicle details.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_announcements',
      description: 'Get recent school announcements (last 5).',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_events',
      description: 'Get upcoming academic events / holidays / exams.',
      parameters: {
        type: 'object',
        properties: {
          daysAhead: { type: 'number', description: 'Number of days ahead to look (default 7)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_exam_schedule',
      description: 'Get upcoming exams for my class.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_profile',
      description: 'Get my user profile information.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_mess_menu',
      description: 'Get the current week\'s mess menu.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_school_info',
      description: 'Get basic school information (name, address, contact).',
      parameters: { type: 'object', properties: {} }
    }
  }
];

// ─── TOOL HANDLERS ─────────────────────────────────
const toolHandlers = {
  get_my_attendance: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const filter = { studentId: student._id };
    if (args.startDate) filter.date = { $gte: new Date(args.startDate) };
    if (args.endDate) filter.date.$lte = new Date(args.endDate);
    const records = await Attendance.find(filter).sort('date').lean();
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      rate: records.length ? ((records.filter(r => r.status === 'present').length / records.length) * 100).toFixed(1) + '%' : 'N/A'
    };
    return { attendance: summary, details: records.slice(0, 10) };
  },

  get_my_marks: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const filter = { studentId: student._id };
    if (args.examName) {
      const exam = await Exam.findOne({ name: args.examName, classId: student.classId });
      if (exam) filter.examId = exam._id;
    }
    const marks = await Marks.find(filter)
      .populate('examId', 'name')
      .populate('subjectId', 'name')
      .lean();
    return { marks: marks.map(m => ({ exam: m.examId?.name, subject: m.subjectId?.name, marksObtained: m.marksObtained, totalMarks: m.totalMarks })) };
  },

  get_my_timetable: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id }).populate('classId');
    if (!student) return { error: 'No student profile found.' };
    const day = args.day || 'today';
    const filter = { classId: student.classId._id };
    if (day !== 'today') filter.day = day;
    else filter.day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const timetable = await Timetable.find(filter).populate('subjectId', 'name').lean();
    return { timetable };
  },

  get_my_fee_status: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const accounts = await StudentFeeAccount.find({ studentId: student._id }).lean();
    for (let acc of accounts) {
      acc.instalments = await FeeInstallment.find({ studentFeeAccount: acc._id }).lean();
    }
    return { feeAccounts: accounts };
  },

  get_my_hostel_info: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const hostelRec = await HostelStudent.findOne({ studentId: student._id, status: 'active' })
      .populate('hostelId', 'name')
      .populate('roomId', 'roomNumber')
      .populate('bedId', 'bedNumber')
      .lean();
    if (!hostelRec) return { message: 'You are not currently in a hostel.' };
    const [leaves, complaints, visitors] = await Promise.all([
      HostelLeave.find({ hostelStudentId: hostelRec._id }).sort('-createdAt').limit(5).lean(),
      HostelComplaint.find({ hostelStudentId: hostelRec._id }).sort('-createdAt').limit(5).lean(),
      HostelVisitor.find({ hostelStudentId: hostelRec._id }).sort('-createdAt').limit(5).lean()
    ]);
    return { hostel: hostelRec, leaves, complaints, visitors };
  },

  get_my_library_books: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const transactions = await LibraryTransaction.find({ studentId: student._id, returnedDate: null })
      .populate('bookId', 'title author')
      .lean();
    return { borrowedBooks: transactions.map(t => ({ title: t.bookId?.title, author: t.bookId?.author, dueDate: t.dueDate })) };
  },

  get_my_transport: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const allocation = await TransportAllocation.findOne({ studentId: student._id, active: true })
      .populate('routeId', 'name')
      .populate('vehicleId', 'registrationNumber')
      .lean();
    return { transport: allocation || { message: 'No transport allocation found.' } };
  },

  get_announcements: async (args, req) => {
    const announcements = await Announcement.find().sort('-createdAt').limit(5).lean();
    return { announcements };
  },

  get_upcoming_events: async (args, req) => {
    const days = args.daysAhead || 7;
    const from = new Date();
    const to = new Date(Date.now() + days * 86400000);
    const events = await AcademicEvent.find({
      startDate: { $gte: from, $lte: to },
    }).sort('startDate').lean();
    return { events };
  },

  get_exam_schedule: async (args, req) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return { error: 'No student profile found.' };
    const exams = await Exam.find({ classId: student.classId, date: { $gte: new Date() } })
      .populate('subjects.subjectId', 'name')
      .sort('date')
      .lean();
    return { exams };
  },

  get_my_profile: async (args, req) => {
    const user = await User.findById(req.user._id).select('-password').lean();
    return { profile: user };
  },

  get_mess_menu: async (args, req) => {
    const today = new Date();
    const menu = await MessMenu.findOne({ weekStart: { $lte: today } }).sort('-weekStart').lean();
    return { messMenu: menu };
  },

  get_school_info: async (args, req) => {
    const Config = require('../models/Config');
    const entries = await Config.find({ key: { $in: ['school_name', 'school_phone', 'school_email', 'school_street', 'school_city', 'school_state'] } });
    const info = {};
    entries.forEach(e => { info[e.key] = e.value; });
    return { schoolInfo: info };
  }
};
const getService = (model) => {
  if (model && model.startsWith('deepseek')) {
    return deepseekService;
  }
  return groqService;   // default to Groq
};

// ─── MAIN MESSAGE HANDLER ──────────────────────────
 const handleMessage = asyncHandler(async (req, res) => {
  const { message, mode, history, conversationId, model, temperature } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  const options = {
    model: model || undefined,
    temperature: temperature !== undefined ? temperature : undefined,
  };

  // ✅ Pick the right service
  const service = getService(model);

  let reply = '';

  if (mode === 'general') {
    const messages = [
      {
        role: 'system',
        content: 'You are a friendly school assistant. Answer all questions helpfully, concisely, and with a warm tone. Format your answers nicely using bullet points or short paragraphs.',
      },
      ...(history || []),
      { role: 'user', content: message },
    ];

    reply = await service.getGeneralCompletion(messages, options);
  }
  else if (mode === 'system') {
    const systemPrompt = `
You are Fikr Smart AI, the official assistant of Fikr Smart School ERP.
You have access to real-time student data and school information.
Always use the available functions to answer questions accurately.
Current user: ${req.user.name}
Role: ${req.user.role}
If a function returns an error, politely explain the issue.
Keep responses friendly and helpful.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ];

    try {
      const response = await service.getSystemCompletion(messages, systemTools, options);

      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolMessages = [];
        for (const toolCall of response.tool_calls) {
          const fnName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          if (toolHandlers[fnName]) {
            try {
              const fnResult = await toolHandlers[fnName](args, req);
              toolMessages.push({
                role: 'tool',
                content: JSON.stringify(fnResult),
                tool_call_id: toolCall.id,
              });
            } catch (err) {
              toolMessages.push({
                role: 'tool',
                content: JSON.stringify({ error: 'Function execution failed' }),
                tool_call_id: toolCall.id,
              });
            }
          }
        }

        const finalMessages = messages.concat([response], toolMessages);
        reply = await service.getGeneralCompletion(finalMessages, options);
      } else {
        reply = response.content || 'No response generated.';
      }
    } catch (groqError) {
      console.error('AI error in system mode:', groqError.message);
      reply =
        'I’m sorry, I ran into a problem while processing your request. Please try again or ask a different question.';
    }
  }
  else {
    return res.status(400).json({
      message: 'Invalid mode. Use "general" or "system".',
    });
  }

  // ── SAVE CONVERSATION (unchanged) ────────────────
  let conv;
  if (conversationId) {
    conv = await ChatbotConversation.findOne({
      _id: conversationId,
      userId: req.user._id,
    });
  }
  if (!conv) {
    conv = new ChatbotConversation({
      userId: req.user._id,
      mode,
      title: message.slice(0, 50),
    });
  }

  conv.messages.push({ role: 'user', content: message });
  conv.messages.push({ role: 'assistant', content: reply });
  conv.mode = mode;
  await conv.save();

  res.json({ reply, conversationId: conv._id, title: conv.title });
});

// ─── CONVERSATION LIST ─────────────────────────────
const getConversations = asyncHandler(async (req, res) => {
  const convs = await ChatbotConversation.find({ userId: req.user._id })
    .select('title mode updatedAt')
    .sort('-updatedAt')
    .lean();
  res.json(convs);
});

// ─── SINGLE CONVERSATION ───────────────────────────
const getConversation = asyncHandler(async (req, res) => {
  const conv = await ChatbotConversation.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!conv) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  res.json(conv);
});

// ─── DELETE CONVERSATION ───────────────────────────
const deleteConversation = asyncHandler(async (req, res) => {
  const conv = await ChatbotConversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!conv) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  res.json({ message: 'Conversation deleted' });
});

// ─── VISION MESSAGE ────────────────────────────────
    const handleVisionMessage = asyncHandler(async (req, res) => {
  const { message, mode, conversationId, model, temperature } = req.body;
  const file = req.file;

  if (!file) {
    res.status(400);
    throw new Error('Image is required');
  }

  const fs = require('fs');
  const imageBuffer = fs.readFileSync(file.path);
  const imageBase64 = imageBuffer.toString('base64');
  fs.unlinkSync(file.path);

  const messages = [
    { role: 'system', content: 'You are a helpful assistant. Describe images and answer questions about them.' },
    ...(req.body.history ? JSON.parse(req.body.history) : []),
  ];

  const options = {
    model: model || undefined,
    temperature: temperature !== undefined ? temperature : undefined,
  };

  // ✅ Vision still uses Groq (or you can add a similar check)
  const service = getService(model);
  const reply = await service.getGeneralCompletion(messages, options);

  let conv;
  if (conversationId) {
    conv = await ChatbotConversation.findOne({ _id: conversationId, userId: req.user._id });
  }
  if (!conv) {
    conv = new ChatbotConversation({
      userId: req.user._id,
      mode: mode || 'general',
      title: message?.slice(0, 50) || 'Image Chat',
    });
  }

  conv.messages.push({
    role: 'user',
    content: message || 'User sent an image',
    imageUrl: file.filename,
  });
  conv.messages.push({ role: 'assistant', content: reply });
  await conv.save();

  res.json({ reply, conversationId: conv._id });
});

// ─── FEEDBACK ──────────────────────────────────────
const updateFeedback = asyncHandler(async (req, res) => {
  const { convId, msgId } = req.params;
  const { feedback } = req.body;

  if (!['up', 'down'].includes(feedback)) {
    res.status(400);
    throw new Error('Invalid feedback value');
  }

  const conv = await ChatbotConversation.findOne({ _id: convId, userId: req.user._id });
  if (!conv) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const msg = conv.messages.id(msgId);
  if (!msg) {
    res.status(404);
    throw new Error('Message not found');
  }

  msg.feedback = feedback;
  await conv.save();

  res.json({ success: true });
});

  const handleMessageStream = asyncHandler(async (req, res) => {
  const { message, mode, history, conversationId, model, temperature } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const options = {
    model: model || undefined,
    temperature: temperature !== undefined ? temperature : undefined,
  };

  const service = getService(model);
  let fullReply = '';

  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a friendly school assistant. Answer all questions helpfully, concisely, and with a warm tone. Format your answers nicely using bullet points or short paragraphs.',
      },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const stream = await service.getGeneralCompletionStream(messages, options);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullReply += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: [DONE]\n\n`);
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    res.write(`data: [DONE]\n\n`);
  }

  // Save conversation after stream ends
  if (fullReply) {
    let conv;
    if (conversationId) {
      conv = await ChatbotConversation.findOne({ _id: conversationId, userId: req.user._id });
    }
    if (!conv) {
      conv = new ChatbotConversation({ userId: req.user._id, mode, title: message.slice(0, 50) });
    }
    conv.messages.push({ role: 'user', content: message });
    conv.messages.push({ role: 'assistant', content: fullReply });
    conv.mode = mode;
    await conv.save();
  }

  res.end();
});

module.exports = {
  handleMessage,
  getConversations,
  getConversation,
  deleteConversation,
  handleVisionMessage,
  updateFeedback,
  handleMessageStream

};