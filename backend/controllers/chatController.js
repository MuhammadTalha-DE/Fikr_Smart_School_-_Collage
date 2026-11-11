const ChatConversation = require('../models/ChatConversation');
const axios = require('axios');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');
const  upload = require('../middleware/uploadMiddleware');
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

// POST /api/chat/send
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, message } = req.body;
  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  // 1. Find or create conversation
  let conversation;
  if (conversationId) {
    conversation = await ChatConversation.findOne({ _id: conversationId, user: req.user._id });
  }
  if (!conversation) {
    conversation = new ChatConversation({ user: req.user._id, messages: [] });
  }

  // 2. Build context (role‑specific data)
  const context = await buildUserContext(req.user);

  // 3. Build messages array for DeepSeek
  const systemMessage = {
    role: 'system',
    content: `You are a friendly, helpful school ERP assistant named "EduBot".
You work inside a School Management System.
The current user is a **${req.user.role}** named **${req.user.name || 'User'}**.

Here is their real school data (only use what is relevant to the question):
${JSON.stringify(context, null, 2)}

Rules:
- If the user asks about their own data (attendance, marks, etc.), answer using the provided data.
- If the user asks a general question (e.g., "What is the capital of France?"), answer as a helpful assistant.
- Never invent data. If you don't have the information, say so politely.
- Keep responses concise and friendly.
- Do NOT reveal data of other users.`
  };

  const messages = [
    systemMessage,
    ...conversation.messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  // 4. Call DeepSeek
  const response = await axios.post(DEEPSEEK_URL, {
    model: 'deepseek-chat',
    messages: messages,
    temperature: 0.7,
    max_tokens: 600,
  }, {
    headers: {
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    }
  });

  const assistantMessage = response.data.choices[0].message.content;

  // 5. Save to conversation
  conversation.messages.push({ role: 'user', content: message });
  conversation.messages.push({ role: 'assistant', content: assistantMessage });
  if (conversation.messages.length === 2) {
    conversation.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
  }
  await conversation.save();

  res.json({
    conversationId: conversation._id,
    message: assistantMessage,
    title: conversation.title,
  });
});

// GET /api/chat/conversations
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await ChatConversation.find({ user: req.user._id, isActive: true })
    .select('title updatedAt lastReadAt')
    .sort({ updatedAt: -1 })
    .lean();

  // Calculate unread counts for each conversation
  const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
    const unreadFilter = { conversationId: conv._id };
    if (conv.lastReadAt) {
      // Count messages newer than lastReadAt
      const count = await ChatConversation.aggregate([
        { $match: { _id: conv._id } },
        { $unwind: '$messages' },
        { $match: { 'messages.createdAt': { $gt: conv.lastReadAt } } },
        { $count: 'count' }
      ]);
      conv.unreadCount = count.length > 0 ? count[0].count : 0;
    } else {
      // If never read, all messages are unread (except maybe the first welcome?)
      const totalMessages = await ChatConversation.findById(conv._id).select('messages').lean();
      conv.unreadCount = totalMessages ? totalMessages.messages.length : 0;
    }
    return conv;
  }));

  res.json({ success: true, conversations: enrichedConversations });
});

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  let result;
  // Use buffer if memoryStorage, else file path
  if (req.file.buffer) {
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    result = await cloudinary.uploader.upload(base64Image, {
      folder: 'chat_uploads',
      resource_type: 'auto',
    });
  } else {
    result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'chat_uploads',
      resource_type: 'auto',
    });
  }

  res.json({
    success: true,
    fileUrl: result.secure_url,
    fileType: req.file.mimetype,
    fileName: req.file.originalname,
  });
});

// GET /api/chat/conversations/:id
const getConversation = asyncHandler(async (req, res) => {
  const conversation = await ChatConversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  res.json({ success: true, conversation });
});

// DELETE /api/chat/conversations/:id
const deleteConversation = asyncHandler(async (req, res) => {
  await ChatConversation.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Conversation deleted' });
});
// ─── UPDATE CONVERSATION TITLE ──────────────────────────────
const updateConversation = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const conversation = await ChatConversation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { title },
    { new: true }
  );
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  res.json({ success: true, conversation });
});

// ─── TOOL DEFINITIONS (per role) ────────────────────────────
// ─── TOOL DEFINITIONS (per role) ────────────────────────────
function getToolsForRole(role) {
  if (role === 'student') {
    return [
      {
        type: "function",
        function: {
          name: "get_attendance",
          description: "Get the student's attendance percentage for the last 30 days.",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "get_marks",
          description: "Get the student's recent exam marks.",
          parameters: { type: "object", properties: { subject: { type: "string", description: "Optional subject name" } } }
        }
      },
      {
        type: "function",
        function: {
          name: "get_behaviour",
          description: "Get the student's behaviour points and summary.",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "get_upcoming_exams",
          description: "Get upcoming exams for the student's class.",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "get_fee_status",
          description: "Get the student's fee account status (total, paid, due).",
          parameters: { type: "object", properties: {} }
        }
      }
    ];
  } else if (role === 'teacher') {
    return [
      {
        type: "function",
        function: {
          name: "get_class_overview",
          description: "Get an overview of a class (student count, subjects).",
          parameters: { type: "object", properties: { classId: { type: "string" } } }
        }
      },
      {
        type: "function",
        function: {
          name: "get_at_risk_students",
          description: "Get a list of students at academic risk in your classes.",
          parameters: { type: "object", properties: {} }
        }
      }
    ];
  } else if (role === 'parent') {
    return [
      {
        type: "function",
        function: {
          name: "get_child_attendance",
          description: "Get attendance for a specific child.",
          parameters: { type: "object", properties: { childId: { type: "string" } } }
        }
      },
      {
        type: "function",
        function: {
          name: "get_child_fee_status",
          description: "Get fee status for a specific child.",
          parameters: { type: "object", properties: { childId: { type: "string" } } }
        }
      }
    ];
  }
  return [];  // no tools for admin/general
}

// ─── TOOL EXECUTOR ──────────────────────────────────────────
async function executeToolCall(toolName, args, user) {
  const Student = require('../models/Student');
  const Teacher = require('../models/Teacher');
  const Parent = require('../models/Parent');

  switch (toolName) {
    case 'get_attendance': {
      const student = await Student.findOne({ userId: user._id });
      if (!student) return "Student profile not found";
      const Attendance = require('../models/Attendance');
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const records = await Attendance.find({ student: student._id, date: { $gte: since } }).lean();
      const present = records.filter(r => r.status === 'present').length;
      const total = records.length || 1;
      return `Attendance: ${Math.round((present / total) * 100)}% present (${present}/${total} days)`;
    }

    case 'get_marks': {
      const student = await Student.findOne({ userId: user._id });
      if (!student) return "Student profile not found";
      const Marks = require('../models/Marks');
      const filter = { studentId: student._id };
      if (args.subject) filter.subject = args.subject;
      const marks = await Marks.find(filter).sort({ createdAt: -1 }).limit(5).lean();
      if (!marks.length) return "No marks found";
      return marks.map(m => `${m.subject}: ${m.marksObtained}/${m.totalMarks} (${Math.round((m.marksObtained/m.totalMarks)*100)}%)`).join('\n');
    }

    case 'get_behaviour': {
      const student = await Student.findOne({ userId: user._id });
      if (!student) return "Student profile not found";
      const MeritSummary = require('../models/MeritSummary');
      const summary = await MeritSummary.findOne({ student: student._id }).lean();
      return summary ? `Total merit points: ${summary.totalPoints}. Behaviour: ${summary.behaviourPoints}, Activities: ${summary.activityPoints}` : "No behaviour data";
    }

    case 'get_upcoming_exams': {
      const student = await Student.findOne({ userId: user._id }).populate('classId');
      if (!student?.classId) return "No class assigned";
      const Exam = require('../models/Exam');
      const exams = await Exam.find({ classId: student.classId, date: { $gte: new Date() } }).sort({ date: 1 }).lean();
      if (!exams.length) return "No upcoming exams";
      return exams.map(e => `${e.name} on ${new Date(e.date).toLocaleDateString()}`).join('\n');
    }

    case 'get_fee_status': {
      const student = await Student.findOne({ userId: user._id });
      if (!student) return "Student profile not found";
      const StudentFeeAccount = require('../models/StudentFeeAccount');
      const account = await StudentFeeAccount.findOne({ studentId: student._id }).lean();
      if (!account) return "No fee account found";
      return `Fee status: Total PKR ${account.totalAmount}, Paid PKR ${account.paidAmount}, Due PKR ${account.dueAmount}. Status: ${account.status}`;
    }

    case 'get_class_overview': {
      const teacher = await Teacher.findOne({ userId: user._id }).populate('classes');
      if (!teacher) return "Teacher profile not found";
      const Class = require('../models/Class');
      const target = teacher.classes?.find(c => c._id.toString() === args.classId);
      if (!target) return "Class not found";
      const cls = await Class.findById(args.classId).populate('students');
      return `Class ${cls.name}: ${cls.students?.length || 0} students, subjects: ${cls.subjects?.join(', ')}`;
    }

    case 'get_at_risk_students': {
      const teacher = await Teacher.findOne({ userId: user._id }).populate('classes');
      if (!teacher) return "No teacher profile";
      const summaries = await require('../models/StudentAcademicSummary').find({
        student: { $in: teacher.classes?.flatMap(c => c.students || []) || [] },
        $or: [
          { overall_attendance: { $lt: 75 } },
          { average_marks: { $lt: 50 } },
          { failed_subjects: { $gt: 0 } },
          { recent_negative_logs: { $gt: 0 } },
        ],
      }).populate('student', 'userId rollNumber').lean();
      if (!summaries.length) return "No at-risk students";
      return summaries.map((s) => {
        const reasons = [];
        if (s.overall_attendance < 75) reasons.push(`attendance ${s.overall_attendance}%`);
        if (s.average_marks < 50) reasons.push(`marks ${s.average_marks}%`);
        if (s.failed_subjects > 0) reasons.push(`${s.failed_subjects} failed subject(s)`);
        if (s.recent_negative_logs > 0) reasons.push(`${s.recent_negative_logs} recent behaviour log(s)`);
        return `${s.student?.userId?.name || s.student?.rollNumber} - ${reasons.join(', ')}`;
      }).join('\n');
    }

    case 'get_child_attendance': {
      const parent = await Parent.findOne({ userId: user._id });
      if (!parent) return "Parent profile not found";
      const child = parent.children.find(c => c.toString() === args.childId);
      if (!child) return "Child not found";
      const Attendance = require('../models/Attendance');
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const records = await Attendance.find({ student: child, date: { $gte: since } }).lean();
      const present = records.filter(r => r.status === 'present').length;
      const total = records.length || 1;
      return `Attendance: ${Math.round((present / total) * 100)}% present`;
    }

    case 'get_child_fee_status': {
      const parent = await Parent.findOne({ userId: user._id });
      if (!parent) return "Parent profile not found";
      const child = parent.children.find(c => c.toString() === args.childId);
      if (!child) return "Child not found";
      const StudentFeeAccount = require('../models/StudentFeeAccount');
      const account = await StudentFeeAccount.findOne({ studentId: child }).lean();
      if (!account) return "No fee account";
      return `Fee: Total PKR ${account.totalAmount}, Paid ${account.paidAmount}, Due ${account.dueAmount}`;
    }

    default:
      return "Unknown tool";
  }
}

// ─── STREAM MESSAGE (with optional tool calling) ──────────────
const streamMessage = asyncHandler(async (req, res) => {
  const { conversationId, message, mode = 'general' } = req.body;   // mode: 'erp' | 'general'

  // 1. Find or create conversation
  let conversation;
  if (conversationId) {
    conversation = await ChatConversation.findOne({ _id: conversationId, user: req.user._id });
  }
  if (!conversation) {
    conversation = new ChatConversation({ user: req.user._id, messages: [] });
  }

  // 2. Build system message based on mode
  let systemMessage;
  if (mode === 'erp') {
    const context = await buildUserContext(req.user);
    systemMessage = {
      role: 'system',
      content: `You are EduBot, the school ERP assistant. You have access to the user's real school data and can call functions to fetch attendance, marks, behaviour, exams, and fees. Always use the provided functions when asked about school data. Keep responses friendly and concise.\n\nCurrent user data: ${JSON.stringify(context)}`
    };
  } else {
    systemMessage = {
      role: 'system',
      content: `You are EduBot, a helpful AI assistant. Answer general questions in a friendly, concise way. You do not have access to school data in this mode.`
    };
  }

  const tools = mode === 'erp' ? getToolsForRole(req.user.role) : [];

  // 3. Build initial message array
  let messages = [
    systemMessage,
    ...conversation.messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  // 4. Loop to handle tool calls (only in ERP mode)
  let finalContent = '';
  try {
    while (true) {
      const response = await axios.post(DEEPSEEK_URL, {
        model: 'deepseek-chat',
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: 0.7,
        max_tokens: 600,
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      const assistantMsg = response.data.choices[0].message;

      // If model wants to call tools
      if (assistantMsg.tool_calls?.length > 0) {
        messages.push(assistantMsg);

        for (const toolCall of assistantMsg.tool_calls) {
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(toolCall.function.arguments || '{}');
          const result = await executeToolCall(fnName, fnArgs, req.user);

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: String(result)
          });
        }
        continue;  // send results back to model
      }

      // Final text response
      finalContent = assistantMsg.content;
      break;
    }

    // 5. Stream the final response to frontend
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Simulate streaming by sending words
    const words = finalContent.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ token: word + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 30));
    }
    res.write(`data: ${JSON.stringify({ done: true, conversationId: conversation._id })}\n\n`);
    res.end();

    // 6. Save conversation
    conversation.messages.push({ role: 'user', content: message });
    conversation.messages.push({ role: 'assistant', content: finalContent });
    if (conversation.messages.length === 2) {
      conversation.title = message.substring(0, 50);
    }
    await conversation.save();

  } catch (err) {
    console.error('DeepSeek error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Failed to get response' })}\n\n`);
    res.end();
  }
});

// POST /api/chat/stream

  // 4. Build messages array
  
// ─── MARK CONVERSATION AS READ ──────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  const conversation = await ChatConversation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { lastReadAt: new Date() },
    { new: true }
  );
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  res.json({ success: true, conversation });
});

// ─── Helper: build rich context per role ─────────────────
async function buildUserContext(user) {
  const context = {};

  if (user.role === 'student') {
    const Student = require('../models/Student');
    const student = await Student.findOne({ userId: user._id }).populate('classId', 'name');
    if (student) {
      context.class = student.classId?.name;
      context.rollNumber = student.rollNumber;
      context.admissionNumber = student.admissionNumber;

      // Fetch the academic summary (we already built this model)
      const summary = await require('../models/StudentAcademicSummary').findOne({ student: student._id });
      if (summary) {
        context.overallAttendance = `${summary.overall_attendance}%`;
        context.averageMarks = `${summary.average_marks}%`;
        context.behaviourPoints = summary.behaviour_points;
      }

      // Fetch upcoming exams
      const Exam = require('../models/Exam');
      const upcomingExams = await Exam.find({
        classId: student.classId,
        date: { $gte: new Date() }
      }).select('name date subject').lean();
      context.upcomingExams = upcomingExams.map(e => `${e.name} on ${new Date(e.date).toLocaleDateString()}`);
    }
  }

  else if (user.role === 'teacher') {
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ userId: user._id }).populate('classes', 'name');
    if (teacher) {
      context.classes = teacher.classes?.map(c => c.name);
      context.subjects = teacher.subjects;
      // count students
      let totalStudents = 0;
      const Class = require('../models/Class');
      for (const c of teacher.classes || []) {
        const cls = await Class.findById(c._id || c).select('students').lean();
        totalStudents += cls?.students?.length || 0;
      }
      context.totalStudents = totalStudents;
    }
  }

  else if (user.role === 'parent') {
    const Parent = require('../models/Parent');
    const parent = await Parent.findOne({ userId: user._id }).populate({
      path: 'children',
      populate: { path: 'userId', select: 'name' }
    });
    if (parent) {
      context.children = parent.children?.map(c => c.userId?.name);
    }
  }

  return context;
}

module.exports = { sendMessage,streamMessage,uploadFile, getConversations, getConversation,markAsRead,deleteConversation, updateConversation };
