const Announcement = require('../models/Announcement');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const asyncHandler = require('express-async-handler');
const notificationAutomationService = require('../services/notificationAutomationService');

// @desc    Create announcement
// @route   POST /api/announcements
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, targetRoles, targetClasses } = req.body;

  const announcement = await Announcement.create({
    title,
    message,
    targetRoles: targetRoles || ['all'],
    targetClasses: targetClasses || [],
    createdBy: req.user._id,
  });

  const normalizedRoles = (targetRoles || ['all']).includes('all')
    ? ['teacher', 'student', 'parent', 'librarian', 'warden', 'transport']
    : (targetRoles || []);

  const classAudience = await notificationAutomationService.getAudienceForClasses(
    targetClasses || [],
    normalizedRoles
  );
  const roleAudience = (targetClasses || []).length
    ? normalizedRoles.filter((role) => !['student', 'parent'].includes(role))
    : classAudience.roles;

  notificationAutomationService.dispatch({
    title,
    message,
    type: 'academic',
    severity: 'info',
    channels: ['in_app', 'email'],
    roles: roleAudience,
    userIds: classAudience.userIds,
    metadata: {
      entity: 'Announcement',
      entityId: announcement._id,
      link: '/notifications',
      context: {
        targetRoles: announcement.targetRoles,
        targetClasses: announcement.targetClasses,
      },
    },
    sourceModule: 'announcements',
  }, req.user, req).catch((error) => {
    console.error('Announcement notification dispatch failed:', error.message);
  });

  res.status(201).json(announcement);
});

// @desc    Get announcements for current user
// @route   GET /api/announcements
const getAnnouncements = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const filter = {
    $or: [{ targetRoles: 'all' }, { targetRoles: userRole }],
  };

  if (userRole === 'student') {
    const student = await Student.findOne({ userId: req.user._id });
    if (student?.classId) {
      filter.$or.push({ targetClasses: student.classId });
    }
  }

  if (userRole === 'parent') {
    try {
      const parent = await Parent.findOne({ userId: req.user._id }).populate('children', 'classId');
      if (parent?.children?.length) {
        const childClassIds = parent.children.map((child) => child.classId).filter(Boolean);
        if (childClassIds.length) {
          filter.$or.push({ targetClasses: { $in: childClassIds } });
        }
      }
    } catch (err) {
      console.warn('Parent lookup failed in announcements, falling back to role filter:', err.message);
    }
  }

  const announcements = await Announcement.find(filter)
    .sort('-createdAt')
    .populate('createdBy', 'name')
    .populate('targetClasses', 'name');

  res.json(announcements);
});

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  await announcement.deleteOne();
  res.json({ message: 'Announcement removed' });
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
};
