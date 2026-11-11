const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const Notification = require('../models/Notification');
const NotificationReceipt = require('../models/NotificationReceipt');
const User = require('../models/User');
const auditService = require('./auditService');
const { getIO } = require('../socket/socketServer');

class SecureNotificationService {
  constructor() {
    this.tlsOptions = null;
    this.initializeTLSSettings();
  }

  initializeTLSSettings() {
    try {
      this.tlsOptions = {
        key: process.env.TLS_PRIVATE_KEY ? Buffer.from(process.env.TLS_PRIVATE_KEY, 'base64') : null,
        cert: process.env.TLS_CERTIFICATE ? Buffer.from(process.env.TLS_CERTIFICATE, 'base64') : null,
        ca: process.env.TLS_CA_CERTIFICATE ? Buffer.from(process.env.TLS_CA_CERTIFICATE, 'base64') : null,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256',
        honorCipherOrder: true,
      };
    } catch (error) {
      console.error('TLS initialization error:', error);
      this.tlsOptions = null;
    }
  }

  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  encryptMessage(message, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag
    };
  }

  decryptMessage(encryptedData, key, iv, authTag) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  async createSecureNotification(payload, actor = null) {
    const encryptionKey = this.generateEncryptionKey();
    const encryptedMessage = this.encryptMessage(payload.message, encryptionKey);

    return Notification.create({
      title: payload.title,
      message: encryptedMessage.encryptedData,
      encryptionKey: encryptionKey,
      iv: encryptedMessage.iv,
      authTag: encryptedMessage.authTag,
      type: payload.type || 'manual',
      severity: payload.severity || 'info',
      sourceModule: payload.sourceModule || 'secure-notification-center',
      status: payload.scheduleFor ? 'scheduled' : (payload.status || 'draft'),
      channels: Array.isArray(payload.channels) && payload.channels.length ? payload.channels : ['in_app'],
      audience: {
        sendToAll: Boolean(payload.sendToAll),
        roles: payload.roles || [],
        userIds: payload.userIds || [],
      },
      metadata: payload.metadata || {},
      scheduleFor: payload.scheduleFor || null,
      createdBy: actor?._id || payload.createdBy || null,
      isSecure: true,
    });
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

  async sendSecureMessage(user, notification, channel) {
    try {
      const decryptedMessage = this.decryptMessage(
        notification.message,
        notification.encryptionKey,
        notification.iv,
        notification.authTag
      );

      if (!decryptedMessage) {
        throw new Error('Message decryption failed');
      }

      const io = getIO();
      
      if (channel === 'in_app') {
        io.to(String(user._id)).emit('secure-notification:new', {
          receiptId: notification._id,
          title: notification.title,
          message: decryptedMessage,
          type: notification.type,
          severity: notification.severity,
          link: notification.metadata?.link || '',
          createdAt: new Date(),
          isSecure: true,
        });
        return { status: 'sent', deliveredAt: new Date() };
      }

      return { status: 'skipped', error: 'Channel not implemented for secure messaging' };
    } catch (error) {
      console.error('Secure message sending error:', error);
      return { status: 'failed', error: error.message };
    }
  }

  async dispatchSecureNotification(notification, actor = null, req = null) {
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
      const channelResults = [];

      for (const channel of doc.channels) {
        const result = await this.sendSecureMessage(user, doc, channel);
        
        if (result.status === 'sent') {
          channelStats[channel] += 1;
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
      action: 'SEND_SECURE_NOTIFICATION',
      module: 'notifications',
      entity: 'Notification',
      entityId: doc._id,
      description: `Secure notification "${doc.title}" dispatched to ${receipts.length} recipients`,
      performedBy: actor ? { userId: actor._id, role: actor.role, name: actor.name } : {},
      req,
    });

    return doc;
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

  async createAndDispatchSecure(payload, actor = null, req = null) {
    const notification = await this.createSecureNotification(payload, actor);
    return this.dispatchSecureNotification(notification, actor, req);
  }

  async getDecryptedNotification(notificationId, userId) {
    const notification = await Notification.findById(notificationId);
    if (!notification || !notification.isSecure) {
      throw new Error('Notification not found or not secure');
    }

    const receipt = await NotificationReceipt.findOne({ 
      notification: notificationId, 
      user: userId 
    });
    
    if (!receipt) {
      throw new Error('Access denied');
    }

    const decryptedMessage = this.decryptMessage(
      notification.message,
      notification.encryptionKey,
      notification.iv,
      notification.authTag
    );

    if (!decryptedMessage) {
      throw new Error('Failed to decrypt message');
    }

    return {
      ...notification.toObject(),
      message: decryptedMessage,
    };
  }

  async broadcastToRole(role, payload, actor = null) {
    const users = await User.find({ role }).select('_id');
    const userIds = users.map(user => user._id);

    return this.createAndDispatchSecure({
      ...payload,
      roles: [role],
      userIds: [],
      sendToAll: false,
    }, actor);
  }

  async getRoleBasedStats() {
    const stats = {};
    const roles = ['admin', 'teacher', 'student', 'parent', 'librarian', 'warden', 'transport'];

    for (const role of roles) {
      const count = await NotificationReceipt.countDocuments({ 
        role: role,
        isRead: false 
      });
      stats[role] = count;
    }

    return stats;
  }
}

module.exports = new SecureNotificationService();