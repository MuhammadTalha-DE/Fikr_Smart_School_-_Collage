const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'parent', 'librarian', 'warden', 'transport'],
    required: true,
  },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  theme: { type: String, default: 'Modern Black' },
  canChangePassword: { type: Boolean, default: true },
  canChangeUsername: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  lastLoginAt: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  faceRecoveryOTP: String,
  faceRecoveryOTPExpiry: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ role: 1, name: 1 });
userSchema.index({ role: 1, email: 1 });
userSchema.index({ role: 1, username: 1 });

module.exports = mongoose.model('User', userSchema);
