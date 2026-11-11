const Parent = require('../models/Parent');
const Student = require('../models/Student');
const User = require('../models/User');
const { sendEmergencyEmail } = require('./notificationService');

/**
 * Send absence alert to parent(s) when a student is marked absent
 */
exports.sendAbsenceAlert = async ({ studentId, date, status, className }) => {
  try {
    const student = await Student.findById(studentId).populate('userId', 'name');
    const parents = await Parent.find({ children: studentId }).populate('userId', 'name email');

    if (!student || !parents.length) {
      console.log(`⚠️ No parent found for student ${studentId}`);
      return { sent: false, reason: 'No parent found' };
    }

    const studentName = student.userId?.name || 'Unknown';
    const statusLabel = status === 'absent' ? 'absent' : status === 'late' ? 'late' : 'on leave';

    const message = `Dear Parent, your child ${studentName} is ${statusLabel} today from ${className || 'class'}. Date: ${new Date(date).toLocaleDateString()}. Please check your parent portal for details.`;

    const results = [];
    for (const parent of parents) {
      const parentName = parent.userId?.name || 'Parent';
      const parentEmail = parent.userId?.email;

      // Send email notification
      if (parentEmail) {
        const emailResult = await sendEmergencyEmail({
          to: parentEmail,
          subject: `📋 Attendance Alert: ${studentName} - ${statusLabel}`,
          message,
          alertType: 'attendance',
        });
        results.push({ parent: parentName, email: emailResult.success });
      }

      // Log push notification (placeholder)
      console.log(`🔔 [PUSH] To ${parentName} (${parentEmail}): ${message}`);
      
      // TODO: Integrate with real push notification service
      // await sendPushNotification({ userId: parent.userId._id, title: 'Attendance Alert', body: message });
    }

    console.log(`✅ Absence alert sent for ${studentName} to ${parents.length} parent(s)`);
    return { sent: true, recipients: parents.length, results };
  } catch (error) {
    console.error('❌ Absence alert error:', error.message);
    return { sent: false, error: error.message };
  }
};

/**
 * Send weekly attendance summary to parents
 */
exports.sendWeeklySummary = async ({ studentId, weekStart, weekEnd, totalDays, presentDays, percentage }) => {
  try {
    const student = await Student.findById(studentId).populate('userId', 'name');
    const parents = await Parent.find({ children: studentId }).populate('userId', 'name email');

    if (!parents.length) return { sent: false };

    const studentName = student.userId?.name || 'Unknown';
    const message = `Weekly Attendance Summary for ${studentName} (${new Date(weekStart).toLocaleDateString()} - ${new Date(weekEnd).toLocaleDateString()}): Present ${presentDays}/${totalDays} days (${percentage}%).`;

    for (const parent of parents) {
      console.log(`📊 [WEEKLY SUMMARY] To ${parent.userId?.name}: ${message}`);
      // Send email in production
    }

    return { sent: true };
  } catch (error) {
    console.error('❌ Weekly summary error:', error.message);
    return { sent: false, error: error.message };
  }
};

/**
 * Send low attendance warning to student/parent
 */
exports.sendLowAttendanceWarning = async ({ studentId, percentage, threshold = 75 }) => {
  try {
    const student = await Student.findById(studentId).populate('userId', 'name');
    const parents = await Parent.find({ children: studentId }).populate('userId', 'name email');
    const studentName = student.userId?.name || 'Unknown';

    const message = `⚠️ Warning: ${studentName}'s attendance has dropped to ${percentage}%, below the required ${threshold}%. Please ensure regular attendance to avoid academic risk.`;

    console.log(`⚠️ [LOW ATTENDANCE WARNING] ${studentName}: ${percentage}%`);

    for (const parent of parents) {
      if (parent.userId?.email) {
        await sendEmergencyEmail({
          to: parent.userId.email,
          subject: `⚠️ Low Attendance Warning: ${studentName}`,
          message,
          alertType: 'attendance_risk',
        });
      }
    }

    return { sent: true, message };
  } catch (error) {
    console.error('❌ Low attendance warning error:', error.message);
    return { sent: false, error: error.message };
  }
};
