const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const NotificationReceipt = require('../models/NotificationReceipt');
const NotificationPreference = require('../models/NotificationPreference');
const User = require('../models/User');
const auditService = require('./auditService');
const { getIO } = require('../socket/socketServer');

const ALLOWED_CHANNELS = ['in_app', 'email', 'sms', 'push'];
const ALLOWED_TYPES = ['manual', 'message', 'announcement', 'system', 'weather', 'safety', 'attendance', 'finance', 'hostel', 'transport', 'library', 'academic'];
const ALLOWED_SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'];
const ALLOWED_ROLES = ['admin', 'teacher', 'student', 'parent', 'librarian', 'warden', 'transport'];

const uniqueAllowed = (items, allowed) => (
  Array.isArray(items)
    ? [...new Set(items)].filter((item) => allowed.includes(item))
    : []
);

const normalizeNotificationPayload = (payload = {}) => {
  const channels = uniqueAllowed(payload.channels, ALLOWED_CHANNELS);
  const roles = uniqueAllowed(payload.roles, ALLOWED_ROLES);

  return {
    title: typeof payload.title === 'string' ? payload.title.trim() : payload.title,
    message: typeof payload.message === 'string' ? payload.message.trim() : payload.message,
    type: ALLOWED_TYPES.includes(payload.type) ? payload.type : 'manual',
    severity: ALLOWED_SEVERITIES.includes(payload.severity) ? payload.severity : 'info',
    sourceModule: typeof payload.sourceModule === 'string' && payload.sourceModule.trim()
      ? payload.sourceModule.trim()
      : 'notification-center',
    channels: channels.length ? channels : ['in_app'],
    roles,
    userIds: Array.isArray(payload.userIds) ? payload.userIds : [],
    sendToAll: Boolean(payload.sendToAll),
    scheduleFor: payload.scheduleFor || null,
    metadata: payload.metadata || {},
  };
};

class NotificationCenterService {
  constructor() {
    this.emailTransporter = null;
    this.ensureTransporter();
  }

  ensureTransporter() {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
      return null;
    }

    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    return this.emailTransporter;
  }

  async createNotification(payload, actor = null) {
    const normalized = normalizeNotificationPayload(payload);

    if (!normalized.title || !normalized.message) {
      throw new Error('Title and message are required');
    }

    return Notification.create({
      title: normalized.title,
      message: normalized.message,
      type: normalized.type,
      severity: normalized.severity,
      sourceModule: normalized.sourceModule,
      status: normalized.scheduleFor ? 'scheduled' : (payload.status || 'draft'),
      channels: normalized.channels,
      audience: {
        sendToAll: normalized.sendToAll,
        roles: normalized.sendToAll ? [] : normalized.roles,
        userIds: normalized.sendToAll ? [] : normalized.userIds,
      },
      metadata: normalized.metadata,
      scheduleFor: normalized.scheduleFor,
      createdBy: actor?._id || payload.createdBy || null,
    });
  }

  async updateNotification(id, payload, actor = null, req = null) {
    const doc = await Notification.findById(id);
    if (!doc) {
      throw new Error('Notification not found');
    }

    const normalized = normalizeNotificationPayload({
      ...doc.toObject(),
      ...payload,
      roles: payload.roles ?? doc.audience?.roles,
      userIds: payload.userIds ?? doc.audience?.userIds,
      sendToAll: payload.sendToAll ?? doc.audience?.sendToAll,
    });

    if (!normalized.title || !normalized.message) {
      throw new Error('Title and message are required');
    }

    doc.title = normalized.title;
    doc.message = normalized.message;
    doc.type = normalized.type;
    doc.severity = normalized.severity;
    doc.channels = normalized.channels;
    doc.audience = {
      sendToAll: normalized.sendToAll,
      roles: normalized.sendToAll ? [] : normalized.roles,
      userIds: normalized.sendToAll ? [] : normalized.userIds,
    };
    doc.metadata = normalized.metadata;
    doc.scheduleFor = normalized.scheduleFor;

    if (!['sent', 'partial', 'failed', 'queued'].includes(doc.status)) {
      doc.status = normalized.scheduleFor ? 'scheduled' : (payload.status || 'draft');
    }

    await doc.save();

    await auditService.log({
      action: 'UPDATE_NOTIFICATION',
      module: 'notifications',
      entity: 'Notification',
      entityId: doc._id,
      description: `Notification "${doc.title}" updated`,
      performedBy: actor ? { userId: actor._id, role: actor.role, name: actor.name } : {},
      req,
    });

    return doc;
  }

  async resolveAudience(notification) {
    if (notification.audience?.sendToAll) {
      return User.find({}).select('name email phone role').lean();
    }

    const clauses = [];
    if (notification.audience?.roles?.length) {
      clauses.push({ role: { $in: notification.audience.roles } });
    }
    if (notification.audience?.userIds?.length) {
      clauses.push({ _id: { $in: notification.audience.userIds } });
    }

    if (!clauses.length) {
      return [];
    }

    return User.find({ $or: clauses }).select('name email phone role').lean();
  }

  isCategoryEnabled(preferences, type) {
    if (!preferences?.categories) {
      return true;
    }
    return preferences.categories[type] !== false;
  }

  wantsChannel(preferences, channel) {
    if (!preferences?.channels) {
      return channel === 'in_app';
    }

    if (channel === 'in_app') return preferences.channels.inApp !== false;
    if (channel === 'email') return preferences.channels.email === true;
    if (channel === 'sms') return preferences.channels.sms === true;
    if (channel === 'push') return preferences.channels.push === true;
    return false;
  }

  async sendEmail(user, notification) {
    if (!user?.email) {
      return { status: 'skipped', error: 'No email address' };
    }

    const transporter = this.emailTransporter || this.ensureTransporter();
    if (!transporter) {
      return { status: 'skipped', error: 'Email transporter not configured' };
    }

    try {
      await transporter.sendMail({
        from: `"Fikr Smart School" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 16px;">
            <div style="padding: 18px 20px; border-radius: 12px; background: #0f172a; color: white;">
              <h1 style="margin: 0; font-size: 20px;">${notification.title}</h1>
              <p style="margin: 8px 0 0; opacity: 0.8;">${notification.type} • ${notification.severity}</p>
            </div>
            <div style="padding: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-top: 14px;">
              <p style="margin: 0; color: #334155; line-height: 1.7;">${notification.message}</p>
            </div>
          </div>
        `,
      });

      return { status: 'sent', deliveredAt: new Date() };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  async sendSMS(user) {
    if (!user?.phone) {
      return { status: 'skipped', error: 'No phone number' };
    }

    if (!process.env.SMS_PROVIDER) {
      return { status: 'skipped', error: 'SMS provider not configured' };
    }

    return { status: 'skipped', error: 'SMS adapter not implemented yet' };
  }

  async sendPush(user) {
    if (!process.env.PUSH_PROVIDER) {
      return { status: 'skipped', error: 'Push provider not configured' };
    }

    return { status: 'skipped', error: 'Push adapter not implemented yet' };
  }

  deriveDeliveryStatus(channelResults) {
    const statuses = channelResults.map((item) => item.status);
    if (statuses.some((status) => status === 'sent') && statuses.some((status) => status === 'failed')) {
      return 'partial';
    }
    if (statuses.some((status) => status === 'sent')) {
      return 'sent';
    }
    if (statuses.every((status) => status === 'skipped')) {
      return 'skipped';
    }
    if (statuses.some((status) => status === 'failed')) {
      return 'failed';
    }
    return 'pending';
  }

  async dispatchNotification(notification, actor = null, req = null) {
    const doc = typeof notification.populate === 'function'
      ? notification
      : await Notification.findById(notification);

    if (!doc) {
      throw new Error('Notification not found');
    }

    const users = await this.resolveAudience(doc);
    const receipts = [];
    const channelStats = { in_app: 0, email: 0, sms: 0, push: 0 };
    let deliveredRecipients = 0;
    let failedRecipients = 0;

    for (const user of users) {
      const prefs = await NotificationPreference.getOrCreateForUser(user._id);
      const channelResults = [];

      if (!this.isCategoryEnabled(prefs, doc.type)) {
        continue;
      }

      for (const channel of doc.channels) {
        if (!this.wantsChannel(prefs, channel)) {
          channelResults.push({ channel, status: 'skipped', error: 'Disabled in preferences' });
          continue;
        }

        if (channel === 'in_app') {
          channelResults.push({ channel, status: 'sent', deliveredAt: new Date() });
          channelStats.in_app += 1;
          continue;
        }

        let result = { status: 'skipped', error: 'Unsupported channel' };
        if (channel === 'email') {
          result = await this.sendEmail(user, doc);
          if (result.status === 'sent') channelStats.email += 1;
        } else if (channel === 'sms') {
          result = await this.sendSMS(user, doc);
          if (result.status === 'sent') channelStats.sms += 1;
        } else if (channel === 'push') {
          result = await this.sendPush(user, doc);
          if (result.status === 'sent') channelStats.push += 1;
        }

        channelResults.push({
          channel,
          status: result.status,
          deliveredAt: result.deliveredAt || null,
          error: result.error || '',
        });
      }

      if (!channelResults.length) {
        continue;
      }

      const deliveryStatus = this.deriveDeliveryStatus(channelResults);
      if (deliveryStatus === 'sent' || deliveryStatus === 'partial') {
        deliveredRecipients += 1;
      } else if (deliveryStatus === 'failed') {
        failedRecipients += 1;
      }

      const receipt = await NotificationReceipt.findOneAndUpdate(
        { notification: doc._id, user: user._id },
        {
          notification: doc._id,
          user: user._id,
          role: user.role,
          deliveryStatus,
          channelResults,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      receipts.push(receipt);

      try {
        getIO().to(String(user._id)).emit('notification:new', {
          receiptId: receipt._id,
          title: doc.title,
          message: doc.message,
          type: doc.type,
          severity: doc.severity,
          link: doc.metadata?.link || '',
          createdAt: receipt.createdAt,
        });
      } catch (error) {
        // Socket server is optional in tests or early boot.
      }
    }

    doc.status = deliveredRecipients > 0 && failedRecipients > 0
      ? 'partial'
      : deliveredRecipients > 0
        ? 'sent'
        : failedRecipients > 0
          ? 'failed'
          : 'queued';
    doc.sentAt = new Date();
    doc.lastSentBy = actor?._id || doc.lastSentBy || null;
    doc.stats = {
      totalRecipients: receipts.length,
      deliveredRecipients,
      failedRecipients,
      readRecipients: 0,
      channels: channelStats,
    };
    await doc.save();

    await auditService.log({
      action: 'SEND_NOTIFICATION',
      module: 'notifications',
      entity: 'Notification',
      entityId: doc._id,
      description: `Notification "${doc.title}" dispatched to ${receipts.length} recipients`,
      performedBy: actor ? { userId: actor._id, role: actor.role, name: actor.name } : {},
      req,
    });

    return doc;
  }

  async createAndDispatch(payload, actor = null, req = null) {
    const notification = await this.createNotification(payload, actor);
    return this.dispatchNotification(notification, actor, req);
  }

  async deleteNotification(id, actor = null, req = null) {
    const doc = await Notification.findById(id);
    if (!doc) {
      throw new Error('Notification not found');
    }

    const receiptResult = await NotificationReceipt.deleteMany({ notification: doc._id });
    await doc.deleteOne();

    await auditService.log({
      action: 'DELETE_NOTIFICATION',
      module: 'notifications',
      entity: 'Notification',
      entityId: doc._id,
      description: `Notification "${doc.title}" and ${receiptResult.deletedCount || 0} receipts deleted`,
      performedBy: actor ? { userId: actor._id, role: actor.role, name: actor.name } : {},
      req,
    });

    return { deletedCount: 1, deletedReceipts: receiptResult.deletedCount || 0 };
  }

  async bulkDeleteNotifications({ ids = [], filter = {}, deleteAll = false } = {}, actor = null, req = null) {
    const query = {};
    const hasIds = Array.isArray(ids) && ids.length > 0;
    const safeFilter = filter || {};
    const filterKeys = ['status', 'type', 'severity'];
    const hasFilter = filterKeys.some((key) => Boolean(safeFilter[key])) || Boolean(safeFilter.search);

    if (hasIds) {
      query._id = { $in: ids };
    } else if (deleteAll || hasFilter) {
      if (safeFilter.status) query.status = safeFilter.status;
      if (safeFilter.type) query.type = safeFilter.type;
      if (safeFilter.severity) query.severity = safeFilter.severity;
      if (safeFilter.search) {
        query.$or = [
          { title: { $regex: safeFilter.search, $options: 'i' } },
          { message: { $regex: safeFilter.search, $options: 'i' } },
          { sourceModule: { $regex: safeFilter.search, $options: 'i' } },
        ];
      }
    } else {
      throw new Error('Select notifications, apply filters, or pass deleteAll=true');
    }

    const docs = await Notification.find(query).select('_id title').lean();
    const notificationIds = docs.map((doc) => doc._id);

    if (!notificationIds.length) {
      return { deletedCount: 0, deletedReceipts: 0 };
    }

    const [receiptResult, notificationResult] = await Promise.all([
      NotificationReceipt.deleteMany({ notification: { $in: notificationIds } }),
      Notification.deleteMany({ _id: { $in: notificationIds } }),
    ]);

    await auditService.log({
      action: 'BULK_DELETE_NOTIFICATIONS',
      module: 'notifications',
      entity: 'Notification',
      description: `${notificationResult.deletedCount || 0} notifications and ${receiptResult.deletedCount || 0} receipts bulk deleted`,
      performedBy: actor ? { userId: actor._id, role: actor.role, name: actor.name } : {},
      req,
    });

    return {
      deletedCount: notificationResult.deletedCount || 0,
      deletedReceipts: receiptResult.deletedCount || 0,
    };
  }

  async markReceiptRead(receiptId, user) {
    const receipt = await NotificationReceipt.findOneAndUpdate(
      { _id: receiptId, user: user._id, isRead: false },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!receipt) {
      return null;
    }

    await Notification.updateOne(
      { _id: receipt.notification },
      { $inc: { 'stats.readRecipients': 1 } }
    );

    await auditService.log({
      action: 'MARK_READ',
      module: 'notifications',
      entity: 'NotificationReceipt',
      entityId: receipt._id,
      description: `Notification receipt ${receipt._id} marked as read`,
      performedBy: { userId: user._id, role: user.role, name: user.name },
    });

    return receipt;
  }

  async markAllRead(user) {
    const unreadReceipts = await NotificationReceipt.find({ user: user._id, isRead: false }).select('_id notification');
    if (!unreadReceipts.length) {
      return { matchedCount: 0 };
    }

    await NotificationReceipt.updateMany(
      { user: user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    const countsByNotification = unreadReceipts.reduce((acc, receipt) => {
      const key = String(receipt.notification);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    await Promise.all(
      Object.entries(countsByNotification).map(([notificationId, count]) =>
        Notification.updateOne({ _id: notificationId }, { $inc: { 'stats.readRecipients': count } })
      )
    );

    await auditService.log({
      action: 'MARK_ALL_READ',
      module: 'notifications',
      entity: 'NotificationReceipt',
      description: `${unreadReceipts.length} notifications marked as read`,
      performedBy: { userId: user._id, role: user.role, name: user.name },
    });

    return { matchedCount: unreadReceipts.length };
  }
}

module.exports = new NotificationCenterService();
