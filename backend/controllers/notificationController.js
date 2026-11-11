const Notification = require('../models/Notification');
const NotificationReceipt = require('../models/NotificationReceipt');
const NotificationPreference = require('../models/NotificationPreference');
const notificationCenterService = require('../services/notificationCenterService');

const queueNotificationDispatch = async (notification, user, req) => {
  const notificationId = notification?._id || notification;

  await Notification.updateOne(
    { _id: notificationId },
    { $set: { status: 'queued', lastSentBy: user?._id || null } }
  );

  notificationCenterService.dispatchNotification(notificationId, user, req).catch((error) => {
    console.error(`Notification dispatch failed for ${notificationId}:`, error.message);
  });
};

const buildNotificationFilters = (query) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.severity) filter.severity = query.severity;
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { message: { $regex: query.search, $options: 'i' } },
      { sourceModule: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

exports.getAdminOverview = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [summary, recentNotifications, typeBreakdown, unreadByRole, channelPerformance] = await Promise.all([
      Notification.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
            scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
            sent: { $sum: { $cond: [{ $in: ['$status', ['sent', 'partial']] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            deliveredRecipients: { $sum: '$stats.deliveredRecipients' },
            readRecipients: { $sum: '$stats.readRecipients' },
          },
        },
      ]),
      Notification.find().sort({ createdAt: -1 }).limit(8).populate('createdBy', 'name role').lean(),
      Notification.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      NotificationReceipt.aggregate([
        { $match: { isRead: false } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Notification.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            in_app: { $sum: '$stats.channels.in_app' },
            email: { $sum: '$stats.channels.email' },
            sms: { $sum: '$stats.channels.sms' },
            push: { $sum: '$stats.channels.push' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {
          total: 0,
          draft: 0,
          scheduled: 0,
          sent: 0,
          failed: 0,
          deliveredRecipients: 0,
          readRecipients: 0,
        },
        recentNotifications,
        typeBreakdown,
        unreadByRole,
        channelPerformance: channelPerformance[0] || { in_app: 0, email: 0, sms: 0, push: 0 },
      },
    });
  } catch (error) {
    throw error;
  }
};

exports.listNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    const filter = buildNotificationFilters(req.query);

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name role')
        .populate('lastSentBy', 'name role')
        .lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    throw error;
  }
};

exports.createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      severity,
      channels,
      roles,
      userIds,
      sendToAll,
      scheduleFor,
      sendNow,
      metadata,
    } = req.body;

    const notification = await notificationCenterService.createNotification({
      title,
      message,
      type,
      severity,
      channels,
      roles,
      userIds,
      sendToAll,
      scheduleFor,
      metadata,
    }, req.user);

    if (sendNow) {
      await queueNotificationDispatch(notification, req.user, req);
      notification.status = 'queued';
    }

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    const notification = await notificationCenterService.updateNotification(
      req.params.id,
      req.body,
      req.user,
      req
    );

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(error.message === 'Notification not found' ? 404 : 400).json({ success: false, message: error.message });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await queueNotificationDispatch(notification, req.user, req);
    notification.status = 'queued';

    res.status(202).json({ success: true, data: notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const result = await notificationCenterService.deleteNotification(req.params.id, req.user, req);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.message === 'Notification not found' ? 404 : 400).json({ success: false, message: error.message });
  }
};

exports.bulkDeleteNotifications = async (req, res) => {
  try {
    const result = await notificationCenterService.bulkDeleteNotifications({
      ids: req.body.ids || [],
      filter: req.body.filter || {},
      deleteAll: Boolean(req.body.deleteAll),
    }, req.user, req);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('lastSentBy', 'name role')
      .lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    throw error;
  }
};

exports.getNotificationReceipts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    const filter = { notification: req.params.id };

    if (req.query.role) filter.role = req.query.role;
    if (req.query.deliveryStatus) filter.deliveryStatus = req.query.deliveryStatus;
    if (req.query.isRead === 'true') filter.isRead = true;
    if (req.query.isRead === 'false') filter.isRead = false;

    const [receipts, total] = await Promise.all([
      NotificationReceipt.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email role')
        .lean(),
      NotificationReceipt.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: receipts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    throw error;
  }
};

exports.getInbox = async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit || '20', 10)));
    const receipts = await NotificationReceipt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('notification')
      .lean();

    const unreadCount = await NotificationReceipt.countDocuments({ user: req.user._id, isRead: false });

    res.json({
      success: true,
      data: receipts.map((receipt) => ({
        _id: receipt._id,
        isRead: receipt.isRead,
        readAt: receipt.readAt,
        deliveryStatus: receipt.deliveryStatus,
        channelResults: receipt.channelResults,
        createdAt: receipt.createdAt,
        notification: receipt.notification,
      })),
      unreadCount,
    });
  } catch (error) {
    throw error;
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const receipt = await notificationCenterService.markReceiptRead(req.params.receiptId, req.user);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Notification receipt not found' });
    }
    res.json({ success: true, data: receipt });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const result = await notificationCenterService.markAllRead(req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const prefs = await NotificationPreference.getOrCreateForUser(req.user._id);
    res.json({ success: true, data: prefs });
  } catch (error) {
    throw error;
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const prefs = await NotificationPreference.getOrCreateForUser(req.user._id);

    if (req.body.channels) {
      prefs.channels = { ...prefs.channels.toObject(), ...req.body.channels };
    }
    if (req.body.categories) {
      prefs.categories = { ...prefs.categories.toObject(), ...req.body.categories };
    }
    if (req.body.quietHours) {
      prefs.quietHours = { ...prefs.quietHours.toObject(), ...req.body.quietHours };
    }

    await prefs.save();
    res.json({ success: true, data: prefs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getNotificationFilterOptions = async (req, res) => {
  try {
    const [types, statuses, severities] = await Promise.all([
      Notification.distinct('type'),
      Notification.distinct('status'),
      Notification.distinct('severity'),
    ]);

    res.json({
      success: true,
      data: {
        types: types.filter(Boolean).sort(),
        statuses: statuses.filter(Boolean).sort(),
        severities: severities.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    throw error;
  }
};

