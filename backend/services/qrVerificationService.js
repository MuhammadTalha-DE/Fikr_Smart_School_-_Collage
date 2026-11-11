/**
 * QR Verification Service
 * 
 * Generates unique verification codes and QR codes for documents.
 * Provides verification endpoints to validate document authenticity.
 */

const crypto = require('crypto');
const QRCode = require('qrcode');
const GeneratedDocument = require('../models/GeneratedDocument');
const DocumentVerification = require('../models/DocumentVerification');

/**
 * Generate a unique verification code
 */
function generateVerificationCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('HEX').toUpperCase();
  const prefix = 'DOC';
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a simple code without prefix
 */
function generateSimpleCode() {
  return crypto.randomBytes(6).toString('HEX').toUpperCase();
}

/**
 * Generate QR code data URL for a verification code
 */
async function generateQRCode(verificationCode) {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${verificationCode}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error('QR Code generation failed:', err);
    return null;
  }
}

/**
 * Generate QR code as Buffer
 */
async function generateQRCodeBuffer(verificationCode) {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${verificationCode}`;
  
  try {
    return await QRCode.toBuffer(verificationUrl, {
      width: 200,
      margin: 2,
    });
  } catch (err) {
    console.error('QR Code buffer generation failed:', err);
    return null;
  }
}

/**
 * Verify a document by its verification code
 */
async function verifyDocument(verificationCode, verificationData = {}) {
  const document = await GeneratedDocument.findOne({ verificationCode })
    .populate('templateId', 'name type')
    .populate('generatedBy', 'name');

  if (!document) {
    return {
      valid: false,
      status: 'not_found',
      message: 'Document not found. The verification code is invalid.',
      data: null,
    };
  }

  // Check if document is revoked
  if (document.status === 'revoked') {
    return {
      valid: false,
      status: 'revoked',
      message: 'This document has been revoked and is no longer valid.',
      data: {
        documentType: document.documentType,
        templateName: document.templateId?.name || '',
        issuedAt: document.issuedAt,
        status: document.status,
      },
    };
  }

  // Check if document is expired
  if (document.expiresAt && new Date() > document.expiresAt) {
    return {
      valid: false,
      status: 'expired',
      message: 'This document has expired.',
      data: {
        documentType: document.documentType,
        templateName: document.templateId?.name || '',
        issuedAt: document.issuedAt,
        expiresAt: document.expiresAt,
        status: document.status,
      },
    };
  }

  // Document is valid
  const verification = await DocumentVerification.create({
    documentId: document._id,
    verificationCode,
    method: verificationData.method || 'manual_code',
    ipAddress: verificationData.ipAddress || '',
    userAgent: verificationData.userAgent || '',
    status: 'valid',
    details: verificationData,
  });

  return {
    valid: true,
    status: 'valid',
    message: 'Document verified successfully.',
    data: {
      documentType: document.documentType,
      templateName: document.templateId?.name || '',
      issuedAt: document.issuedAt,
      generatedBy: document.generatedBy?.name || '',
      status: document.status,
      verificationCount: await DocumentVerification.countDocuments({ documentId: document._id }),
      verifiedAt: verification.verifiedAt,
    },
  };
}

/**
 * Get verification history for a document
 */
async function getVerificationHistory(documentId) {
  return await DocumentVerification.find({ documentId })
    .sort({ verifiedAt: -1 })
    .limit(50);
}

module.exports = {
  generateVerificationCode,
  generateSimpleCode,
  generateQRCode,
  generateQRCodeBuffer,
  verifyDocument,
  getVerificationHistory,
};
