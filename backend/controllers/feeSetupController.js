const FeeHead = require('../models/FeeHead');
const ClassFeePlan = require('../models/ClassFeePlan');
const asyncHandler = require('express-async-handler');

// ---------- Fee Heads ----------
const createFeeHead = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const feeHead = await FeeHead.create({ name, description });
  res.status(201).json(feeHead);
});

const getFeeHeads = asyncHandler(async (req, res) => {
  const feeHeads = await FeeHead.find({});
  res.json(feeHeads);
});

const updateFeeHead = asyncHandler(async (req, res) => {
  const feeHead = await FeeHead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!feeHead) throw new Error('Fee head not found');
  res.json(feeHead);
});

const deleteFeeHead = asyncHandler(async (req, res) => {
  const feeHead = await FeeHead.findById(req.params.id);
  if (!feeHead) throw new Error('Fee head not found');
  // Prevent deletion if used in any ClassFeePlan
  const used = await ClassFeePlan.findOne({ 'feeItems.feeHeadId': req.params.id });
  if (used) {
    res.status(400);
    throw new Error('Cannot delete – fee head is used in a class plan');
  }
  await feeHead.deleteOne();
  res.json({ message: 'Fee head deleted' });
});

// ---------- Class Fee Plans ----------
const createClassFeePlan = asyncHandler(async (req, res) => {
  const { classId, feeItems, frequency, instalmentCount, dueDay } = req.body;
  // Check if plan already exists
  const existing = await ClassFeePlan.findOne({ classId });
  if (existing) {
    res.status(400);
    throw new Error('A fee plan already exists for this class');
  }
  const plan = await ClassFeePlan.create({
    classId, feeItems, frequency, instalmentCount, dueDay,
    createdBy: req.user._id,
  });
  res.status(201).json(plan);
});

const getClassFeePlans = asyncHandler(async (req, res) => {
  const plans = await ClassFeePlan.find({})
    .populate('classId', 'name')
    .populate('feeItems.feeHeadId', 'name');
  res.json(plans);
});

const updateClassFeePlan = asyncHandler(async (req, res) => {
  const plan = await ClassFeePlan.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('classId', 'name')
    .populate('feeItems.feeHeadId', 'name');
  if (!plan) throw new Error('Class fee plan not found');
  res.json(plan);
});

const deleteClassFeePlan = asyncHandler(async (req, res) => {
  const plan = await ClassFeePlan.findById(req.params.id);
  if (!plan) throw new Error('Class fee plan not found');
  await plan.deleteOne();
  res.json({ message: 'Class fee plan deleted' });
});

module.exports = {
  createFeeHead, getFeeHeads, updateFeeHead, deleteFeeHead,
  createClassFeePlan, getClassFeePlans, updateClassFeePlan, deleteClassFeePlan,
};