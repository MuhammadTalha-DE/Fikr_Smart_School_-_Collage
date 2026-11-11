const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const { assertPasswordPolicy } = require('../utils/passwordPolicy');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

const getLockRemainingMinutes = (lockUntil) => {
  const remainingMs = new Date(lockUntil).getTime() - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 60000));
};

const registerFailedLogin = async (user) => {
  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

  if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
  }

  await user.save({ validateBeforeSave: false });
};

const clearLoginFailures = async (user) => {
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
};

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const loginField = username || email;

  if (!loginField || !password) {
    res.status(400);
    throw new Error('Please provide username/email and password');
  }

  const user = await User.findOne({
    $or: [{ username: loginField }, { email: loginField }],
  });

  if (!user) {
    res.status(401);
    throw new Error('Invalid username or password');
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    res.status(423);
    throw new Error(`Account temporarily locked. Try again in ${getLockRemainingMinutes(user.lockUntil)} minute(s).`);
  }

  if (user.lockUntil && user.lockUntil <= new Date()) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    await registerFailedLogin(user);
    res.status(401);
    throw new Error('Invalid username or password');
  }

  await clearLoginFailures(user);

  res.json({
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    token: generateToken(user._id, user.role),
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendEmail({
        email: user.email,
        subject: 'Password reset request',
        message: `Reset your password using this link: ${resetUrl}`,
      });
    } else {
      console.log('PASSWORD RESET LINK:', resetUrl);
    }
  }

  res.json({ message: 'If an account exists for this email, a reset link has been generated.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  assertPasswordPolicy(req.body.password);

  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }

  user.password = req.body.password;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

module.exports = { loginUser, forgotPassword, resetPassword };
