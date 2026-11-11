const nodemailer = require('nodemailer');

/**
 * Send emergency notification email
 */
exports.sendEmergencyEmail = async ({ to, subject, message, alertType }) => {
  try {
    // If email transport is configured
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Fikr Safety System" <${process.env.EMAIL_USER}>`,
        to,
        subject: `🚨 ${alertType ? `[${alertType.toUpperCase()}] ` : ''}${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 12px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Safety Alert</h1>
            </div>
            <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1e293b;">${subject}</h2>
              <p style="color: #475569; line-height: 1.6;">${message}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="color: #94a3b8; font-size: 12px;">
                This is an automated alert from Fikr School Safety Management System.
                Please do not reply to this email.
              </p>
            </div>
          </div>
        `,
      });
    }

    // Log the notification
    console.log(`📧 [EMAIL NOTIFICATION] ${subject} - ${message.substring(0, 50)}...`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email notification failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send SMS notification (placeholder - integrate with Twilio, etc.)
 */
exports.sendSMS = async ({ to, message }) => {
  try {
    console.log(`📱 [SMS NOTIFICATION] To: ${to} - ${message.substring(0, 50)}...`);
    // Integrate with SMS provider here
    return { success: true };
  } catch (error) {
    console.error('❌ SMS notification failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification (placeholder - integrate with Firebase, etc.)
 */
exports.sendPushNotification = async ({ userId, title, body, data }) => {
  try {
    console.log(`🔔 [PUSH NOTIFICATION] User: ${userId} - ${title}: ${body.substring(0, 50)}...`);
    // Integrate with push notification service here
    return { success: true };
  } catch (error) {
    console.error('❌ Push notification failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Broadcast alert to all relevant users
 */
exports.broadcastAlert = async ({ alert, users }) => {
  console.log(`📢 [BROADCAST] Alert "${alert.title}" sent to ${users.length} users`);
  // In production, this would send emails, SMS, push notifications
  return { success: true, recipients: users.length };
};
