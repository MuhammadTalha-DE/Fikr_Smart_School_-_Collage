const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const asyncHandler = require('express-async-handler');
const { assertPasswordPolicy, generateTemporaryPassword } = require('../utils/passwordPolicy');

const upload = multer({ dest: 'uploads/csv/' });

const processRow = async (row) => {
  const { name, username, email, password, role, className, rollNumber, parentEmail, subjects } = row;

  if (!name || !username || !email || !password || !role) {
    throw new Error('Missing required fields (name, username, email, password, role)');
  }

  assertPasswordPolicy(password);

  const normalizedRole = role.toLowerCase();
  if (!['student', 'teacher', 'parent'].includes(normalizedRole)) {
    throw new Error('Role must be student, teacher, or parent');
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    throw new Error('Username or email already exists');
  }

  const user = await User.create({ name, username, email, password, role: normalizedRole });

  if (normalizedRole === 'student') {
    let classId = null;
    let parentId = null;

    if (className) {
      const classDoc = await Class.findOne({ name: className.trim() });
      if (!classDoc) {
        await User.findByIdAndDelete(user._id);
        throw new Error(`Class "${className}" not found`);
      }
      classId = classDoc._id;
    }

    if (parentEmail) {
      let parentUser = await User.findOne({ email: parentEmail, role: 'parent' });
      if (!parentUser) {
        parentUser = await User.create({
          name: `Parent of ${name}`,
          username: `parent_${username}_${Date.now()}`,
          email: parentEmail,
          password: generateTemporaryPassword(),
          role: 'parent',
        });
      }

      let parentDoc = await Parent.findOne({ userId: parentUser._id });
      if (!parentDoc) {
        parentDoc = await Parent.create({ userId: parentUser._id });
      }
      parentId = parentDoc._id;
    }

    const student = await Student.create({ userId: user._id, classId, parentId, rollNumber });
    if (classId) await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
    if (parentId) await Parent.findByIdAndUpdate(parentId, { $push: { children: student._id } });
  } else if (normalizedRole === 'teacher') {
    const subjectsArray = subjects ? subjects.split(',').map((subject) => subject.trim()).filter(Boolean) : [];
    await Teacher.create({ userId: user._id, subjects: subjectsArray });
  } else if (normalizedRole === 'parent') {
    await Parent.create({ userId: user._id });
  }

  return { success: true, user };
};

const bulkImportUsers = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a CSV file',
      successes: [],
      errors: [{ row: 0, error: 'No file uploaded' }],
    });
  }

  const results = [];
  const errors = [];
  const successes = [];

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const concurrency = 10;
    for (let i = 0; i < results.length; i += concurrency) {
      const chunk = results.slice(i, i + concurrency);
      await Promise.all(chunk.map((row, index) => {
        const rowNumber = i + index + 2;
        return processRow(row)
          .then(() => successes.push({ row: rowNumber, ...row }))
          .catch((error) => errors.push({ row: rowNumber, error: error.message }));
      }));
    }
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }

  res.status(200).json({
    success: errors.length === 0,
    message: `Imported ${successes.length} users, ${errors.length} failed`,
    successes,
    errors,
  });
});

const downloadTemplate = (req, res) => {
  const headers = [
    'name',
    'username',
    'email',
    'password',
    'role',
    'className',
    'rollNumber',
    'parentEmail',
    'subjects',
  ].join(',');

  const exampleRows = [
    'John Doe,johndoe,john@example.com,School@1234,student,Class 10,001,parent@example.com,',
    'Jane Smith,janesmith,jane@example.com,School@1234,teacher,,,,Math, Physics',
    'Bob Parent,bobparent,bob@example.com,School@1234,parent,,,,',
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=user_import_template.csv');
  res.send(`${headers}\n${exampleRows}`);
};

module.exports = {
  bulkImportUsers,
  downloadTemplate,
  upload,
};
