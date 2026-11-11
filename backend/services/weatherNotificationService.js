const nodemailer = require('nodemailer');
const User = require('../models/User');

/**
 * Weather Notification Service
 * Handles sending weather alerts via Email, SMS, Push, and In-App notifications
 */

class WeatherNotificationService {
  constructor() {
    this.emailTransporter = null;
    this.initEmailTransporter();
  }

  initEmailTransporter() {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }

  /**
   * Send weather alert notification to a user via email
   */
  async sendEmailAlert(user, alert) {
    if (!this.emailTransporter || !user?.email) return { success: false };

    try {
      const severityColors = {
        low: '#3b82f6',
        medium: '#f59e0b',
        high: '#ef4444',
        critical: '#dc2626',
      };

      const color = severityColors[alert.severity] || '#f59e0b';
      const severityLabel = alert.severity?.toUpperCase() || 'INFO';

      await this.emailTransporter.sendMail({
        from: `"Fikr Weather Intelligence" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `🌦️ ${severityLabel}: ${alert.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${color}; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px;">${alert.title}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Severity: ${severityLabel}</p>
            </div>
            <div style="padding: 24px; background: #f8fafc; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
              <p style="color: #1e293b; line-height: 1.6;">${alert.message}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="color: #94a3b8; font-size: 12px;">
                This is an automated weather alert from Fikr Smart School System.
                Type: ${alert.type} | ${alert.isAutomatic ? 'Auto-generated' : 'Manual broadcast'}
              </p>
            </div>
          </div>
        `,
      });

      console.log(`📧 [WeatherNotification] Email sent to ${user.email}: ${alert.title}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [WeatherNotification] Email failed for ${user.email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification (placeholder - integrate with Twilio, etc.)
   */
  async sendSMS(phoneNumber, message) {
    try {
      console.log(`📱 [WeatherNotification] SMS to ${phoneNumber}: ${message.substring(0, 50)}...`);
      // Integrate with Twilio or other SMS provider here
      return { success: true };
    } catch (error) {
      console.error('❌ [WeatherNotification] SMS failed:', error.message);
      return { success: false };
    }
  }

  /**
   * Send push notification (placeholder - integrate with Firebase, etc.)
   */
  async sendPushNotification(userId, title, body) {
    try {
      console.log(`🔔 [WeatherNotification] Push to user ${userId}: ${title}`);
      // Integrate with Firebase Cloud Messaging here
      return { success: true };
    } catch (error) {
      console.error('❌ [WeatherNotification] Push failed:', error.message);
      return { success: false };
    }
  }

  /**
   * Broadcast weather alert to all users matching target roles
   */
  async broadcastAlertToRoles(alert, targetRoles) {
    try {
      const users = await User.find({ role: { $in: targetRoles } }).select('email phone role name');
      
      let emailCount = 0;
      let smsCount = 0;

      for (const user of users) {
        // Send email
        if (user.email) {
          const result = await this.sendEmailAlert(user, alert);
          if (result.success) emailCount++;
        }

        // Send SMS for critical/high alerts
        if (user.phone && ['critical', 'high'].includes(alert.severity)) {
          await this.sendSMS(user.phone, `⚠️ ${alert.title}: ${alert.message.substring(0, 120)}`);
          smsCount++;
        }

        // Send push notification
        await this.sendPushNotification(user._id, alert.title, alert.message);
      }

      console.log(`📢 [WeatherNotification] Broadcast complete: ${emailCount} emails, ${smsCount} SMS, to ${users.length} users`);
      return { success: true, emailCount, smsCount, totalUsers: users.length };
    } catch (error) {
      console.error('❌ [WeatherNotification] Broadcast failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send transport delay notification to parents
   */
  async notifyTransportDelay(weatherData, delayInfo) {
    try {
      const parents = await User.find({ role: 'parent' }).select('email phone name');
      
      const message = `🚌 Transport Alert: Due to ${weatherData.condition} (Visibility: ${weatherData.visibility}km, Wind: ${weatherData.windSpeed}km/h), transport may be delayed. Estimated delay: ${delayInfo.estimatedDelay || 'Unknown'}. Please plan accordingly.`;

      let count = 0;
      for (const parent of parents) {
        if (parent.email) {
          await this.sendEmailAlert(parent, {
            title: '🚌 Transport Weather Delay Notice',
            message,
            severity: delayInfo.risk === 'high' ? 'high' : 'medium',
            type: 'manual',
          });
          count++;
        }
      }

      console.log(`🚌 [WeatherNotification] Transport delay notice sent to ${count} parents`);
      return { success: true, notified: count };
    } catch (error) {
      console.error('❌ [WeatherNotification] Transport delay notification failed:', error.message);
      return { success: false };
    }
  }
}

module.exports = new WeatherNotificationService();
