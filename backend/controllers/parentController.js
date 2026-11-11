const Parent = require('../models/Parent');
const Student = require('../models/Student');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

const getAllParents = asyncHandler(async (req, res) => {
  const parents = await Parent.find()
    .populate('userId', 'name email phone')
    .populate('children');
  res.json(parents);
});

const getMyChildren = asyncHandler(async (req, res) => {
  const parent = await Parent.findOne({ userId: req.user._id }).populate({
    path: 'children',
    populate: [
      { path: 'userId', select: 'name email avatar' },
      { path: 'classId', select: 'name' },
    ],
  });

  if (!parent) {
    return res.json([]);
  }

  res.json(parent.children || []);
});

const getParentById = asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.id)
    .populate('userId', 'name username email avatar phone')
    .populate({
      path: 'children',
      populate: { path: 'userId', select: 'name rollNumber' }
    });
  if (!parent) {
    res.status(404);
    throw new Error('Parent not found');
  }
  res.json(parent);
});

const updateParent = asyncHandler(async (req, res) => {
  const { children, name, email } = req.body;
  const parent = await Parent.findById(req.params.id);
  if (!parent) throw new Error('Parent not found');

  if (name || email) {
    const user = await User.findById(parent.userId);
    if (user) {
      if (name) user.name = name;
      if (email) user.email = email;
      await user.save();
    }
  }

  if (children && Array.isArray(children)) {
    if (parent.children && parent.children.length) {
      await Student.updateMany(
        { _id: { $in: parent.children } },
        { $unset: { parentId: '' } }
      );
    }
    parent.children = children;
    await Student.updateMany(
      { _id: { $in: children } },
      { parentId: parent._id }
    );
    await parent.save();
  }

  const updatedParent = await Parent.findById(parent._id)
    .populate('userId', 'name username email avatar phone')
    .populate({
      path: 'children',
      populate: { path: 'userId', select: 'name rollNumber' }
    });
  res.json(updatedParent);
});

module.exports = { getAllParents, getMyChildren, getParentById, updateParent };
