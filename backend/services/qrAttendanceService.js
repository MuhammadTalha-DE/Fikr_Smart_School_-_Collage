const crypto = require('crypto');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

/**
 * Generate a unique QR code ID for a class attendance session
 */
exports.generateQRCode = (classId, teacherId, date) => {
  const raw = `${classId}-${teacherId}-${date}-${Date.now()}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
  return {
    qrCodeId: hash,
    classId,
    teacherId,
    date,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
    generatedAt: new Date(),
  };
};

/**
 * Verify a QR code scan and mark attendance
 */
exports.verifyAndMarkQR = async ({ qrCodeId, studentId, classId, date, userId }) => {
  // QR code validity check (in production, validate against stored QR session)
  if (!qrCodeId || qrCodeId.length < 8) {
    throw new Error('Invalid QR code');
  }

  // Check if already marked
  const existing = await Attendance.findOne({ studentId, classId, date });
  if (existing) {
    return { alreadyMarked: true, status: existing.status };
  }

  // Mark as present via QR
  const attendance = await Attendance.create({
    studentId,
    classId,
    date,
    status: 'present',
    method: 'qr',
    markedBy: userId,
    qrCodeId,
  });

  return { alreadyMarked: false, attendance };
};

/**
 * Get active QR sessions (for admin/teacher dashboard)
 */
exports.getActiveQRSessions = async () => {
  // In production, query from QR session store
  return [];
};
