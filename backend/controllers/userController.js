const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const asyncHandler = require('express-async-handler');
const { assertPasswordPolicy } = require('../utils/passwordPolicy');

// ---------- Create User (Admin only) ----------
const createUser = asyncHandler(async (req, res) => {
  const { name, username, email, password, role, classId, parentId, subjects } = req.body;
  assertPasswordPolicy(password);
  const userExists = await User.findOne({ $or: [{ username }, { email }] });
  if (userExists) throw new Error('User already exists');
  const user = await User.create({ name, username, email, password, role });

  if (role === 'student') {
    const student = await Student.create({ userId: user._id, classId, parentId });
    if (classId) await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
    if (parentId) await Parent.findByIdAndUpdate(parentId, { $push: { children: student._id } });
  } else if (role === 'teacher') {
    await Teacher.create({ userId: user._id, subjects: subjects || [] });
  } else if (role === 'parent') {
    await Parent.create({ userId: user._id });
  }

  res.status(201).json({ message: 'User created', user: { _id: user._id, name, role } });
});

// ---------- Get All Users ----------
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// ---------- Get Profile ----------
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  let profile = { user };
  if (user.role === 'student') {
    profile.student = await Student.findOne({ userId: user._id }).populate('classId', 'name');
  } else if (user.role === 'teacher') {
    profile.teacher = await Teacher.findOne({ userId: user._id }).populate('classes', 'name');
  } else if (user.role === 'parent') 
  {
  const parent = await Parent.findOne({ userId: user._id })
    .populate({
      path: 'children',
      select: 'userId rollNumber classId admissionNumber',
      populate: [
        { path: 'userId', select: 'name email avatar' },
        { path: 'classId', select: 'name' },           // ← ensure class is populated
      ]
    });
    profile.parent = parent;
  // attach to response
}
  
  res.json(profile);
});

// ---------- Delete Single User (Student/Teacher/Parent) ----------
// ---------- Delete Single User (Student/Teacher/Parent) ----------
const deleteUser = asyncHandler(async (req, res) => {
  let userId = req.params.id;

  // 1. Try to find a Student profile with this ID
  const studentRecord = await Student.findById(userId);
  if (studentRecord) {
    if (studentRecord.userId) {
      // Use the linked user ID
      userId = studentRecord.userId;
    } else {
      // Orphan student – just delete the Student document
      await Student.findByIdAndDelete(studentRecord._id);
      return res.json({ message: 'Orphan student deleted' });
    }
  } else {
    // 2. If not a student, try Teacher
    const teacherRecord = await Teacher.findById(userId);
    if (teacherRecord && teacherRecord.userId) {
      userId = teacherRecord.userId;
    } else {
      // 3. If not a teacher, try Parent
      const parentRecord = await Parent.findById(userId);
      if (parentRecord && parentRecord.userId) {
        userId = parentRecord.userId;
      }
    }
  }

  // 4. Find the actual User document
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // 5. Clean up associated profile and references
  if (user.role === 'student') {
    const student = await Student.findOneAndDelete({ userId: user._id });
    if (student) {
      await Class.updateMany({}, { $pull: { students: student._id } });
      await Parent.updateMany({}, { $pull: { children: student._id } });
    }
  } else if (user.role === 'teacher') {
    const teacher = await Teacher.findOneAndDelete({ userId: user._id });
    if (teacher) {
      await Class.updateMany({ teacherId: teacher._id }, { $unset: { teacherId: '' } });
    }
  } else if (user.role === 'parent') {
    const parent = await Parent.findOneAndDelete({ userId: user._id });
    if (parent) {
      await Student.updateMany({ parentId: parent._id }, { $unset: { parentId: '' } });
    }
  }

  await user.deleteOne();
  res.json({ message: 'User deleted' });
});

// ---------- Bulk Delete ----------
const bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids?.length) throw new Error('No IDs provided');
  const declined = [];
  const succeeded = [];
  for (const rawId of ids) {
    try {
      let userId = rawId;
      const student = await Student.findById(rawId);
      if (student?.userId) userId = student.userId;
      const user = await User.findById(userId);
      if (user) {
        // cleanup (same logic as above)
        if (user.role === 'student') {
          const s = await Student.findOneAndDelete({ userId: user._id });
          if (s) {
            await Class.updateMany({}, { $pull: { students: s._id } });
            await Parent.updateMany({}, { $pull: { children: s._id } });
          }
        } else if (user.role === 'teacher') {
          const t = await Teacher.findOneAndDelete({ userId: user._id });
          if (t) await Class.updateMany({ teacherId: t._id }, { $unset: { teacherId: '' } });
        } else if (user.role === 'parent') {
          const p = await Parent.findOneAndDelete({ userId: user._id });
          if (p) await Student.updateMany({ parentId: p._id }, { $unset: { parentId: '' } });
        }
        await user.deleteOne();
        succeeded.push(rawId);
      }
    } catch (e) {
      declined.push({ id: rawId, reason: e.message });
    }
  }
  res.json({ deleted: succeeded, failed: declined });
});
// ------- Admin manage user credentials & permissions -------
const adminUpdateCredentials = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin' && req.user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Cannot modify another admin');
  }
  if (username) {
    const exists = await User.findOne({ username, _id: { $ne: user._id } });
    if (exists) throw new Error('Username already taken');
    user.username = username;
  }
  if (password) {
    assertPasswordPolicy(password);
    user.password = password;   // pre‑save hook will hash
  }
  await user.save();
  res.json({ message: 'Credentials updated', username: user.username });
});

const adminUpdatePermissions = asyncHandler(async (req, res) => {
  const { canChangeUsername, canChangePassword } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new Error('User not found');
  if (canChangeUsername !== undefined) user.canChangeUsername = canChangeUsername;
  if (canChangePassword !== undefined) user.canChangePassword = canChangePassword;
  await user.save();
  res.json({ canChangeUsername: user.canChangeUsername, canChangePassword: user.canChangePassword });
});
// @desc    Get all wardens
// @route   GET /api/users/wardens
const getWardens = asyncHandler(async (req, res) => {
  const wardens = await User.find({ role: 'warden' })
    .select('name username email')
    .lean();
  res.json(wardens);
});


module.exports = {
  createUser, getUsers, getUserProfile, deleteUser, bulkDeleteUsers,
  adminUpdateCredentials, 
  getWardens,  // ← add these two
  adminUpdatePermissions,
};
