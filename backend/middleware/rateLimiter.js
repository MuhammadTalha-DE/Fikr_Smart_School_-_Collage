const rateLimit = require('express-rate-limit');

// ──────────────────────────────────────────────
// FACE RECOGNITION RATE LIMITS
// ──────────────────────────────────────────────

// Strict: face verification (prevents brute-force)
const faceVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,            // 15 minutes
  max: 10,                             // 10 attempts per window
  message: {
    success: false,
    message: 'Too many face login attempts. Please try again after 15 minutes or use password login.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate: enrollment
const faceEnrollLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,            // 1 hour
  max: 5,                              // 5 enrollment attempts per hour
  message: {
    success: false,
    message: 'Too many enrollment attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General: all other face routes
const faceGeneralLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

// ──────────────────────────────────────────────
// GLOBAL API RATE LIMITS
// ──────────────────────────────────────────────

// Auth routes — very strict (prevents brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 login attempts per IP per 15 min
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API — moderate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Write operations — sensitive actions (attendance, fee, student creation)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many write operations. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File uploads — prevent spam
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,                    // 20 uploads per hour
  message: {
    success: false,
    message: 'Too many uploads. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Export/Report generation
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many export requests. Please wait before generating more reports.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  faceVerifyLimiter,
  faceEnrollLimiter,
  faceGeneralLimiter,
  authLimiter,
  apiLimiter,
  writeLimiter,
  uploadLimiter,
  exportLimiter,
};
