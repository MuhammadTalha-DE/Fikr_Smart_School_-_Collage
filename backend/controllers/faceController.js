const asyncHandler = require('express-async-handler');
const axios = require('axios');
const UAParser = require('ua-parser-js');
const FaceProfile = require('../models/FaceProfile');
const FaceLoginLog = require('../models/FaceLoginLog');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const auditService = require('../services/auditService');

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5001';

// ─── HELPERS ───────────────────────────────────────
const isFlaskAvailable = async () => {
  try {
    await axios.get(`${FACE_SERVICE_URL}/health`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};

const getDeviceFingerprint = (req) => {
  const parser = new UAParser(req.headers['user-agent']);
  const browser = parser.getBrowser().name || 'Unknown';
  const os = parser.getOS().name || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress;
  return {
    browser,
    os,
    ip,
    userAgent: req.headers['user-agent'] || 'Unknown',
    fingerprint: `${browser}-${os}-${ip?.substring(0, 10) || 'unknown'}`,
  };
};

// ─── ENROLL FACE ───────────────────────────────────
const enrollFace = asyncHandler(async (req, res) => {
  const { images } = req.body;
  if (!images || !Array.isArray(images) || images.length < 3) {
    res.status(400);
    throw new Error('At least 3 images are required');
  }
  const flaskAvailable = await isFlaskAvailable();
  if (!flaskAvailable) {
    res.status(503);
    throw new Error('Face recognition service is temporarily unavailable.');
  }
  let flaskResponse;
  try {
    flaskResponse = await axios.post(`${FACE_SERVICE_URL}/enroll`, {
      userId: req.user._id.toString(),
      images,
    }, { timeout: 120000 });
  } catch (error) {
    console.error('Flask enroll error:', error.message);
    res.status(500);
    throw new Error('Face enrollment failed. Please try again with better lighting.');
  }
  const { embeddings } = flaskResponse.data;
  await FaceProfile.findOneAndUpdate(
    { userId: req.user._id },
    { embeddings, faceImages: images.slice(0, 10), enrollmentStatus: 'complete' },
    { upsert: true, new: true }
  );
  auditService.log({
    action: 'ENROLL_FACE', entity: 'FaceProfile', entityId: req.user._id,
    description: `Face enrolled with ${embeddings.length} embeddings`,
    performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name }, req,
  });
  res.status(201).json({ success: true, message: 'Face enrolled successfully', embeddingCount: embeddings.length });
});

// ─── VERIFY FACE (WITH USERNAME) ───────────────────
const verifyFace = asyncHandler(async (req, res) => {
  const { image, username } = req.body;
  if (!image || !username) { res.status(400); throw new Error('Username and image are required'); }
  const flaskAvailable = await isFlaskAvailable();
  if (!flaskAvailable) { res.status(503); throw new Error('Face service unavailable.'); }
  const user = await User.findOne({ username }).select('-password');
  if (!user) { res.status(401); throw new Error('User not found'); }
  const profile = await FaceProfile.findOne({ userId: user._id });
  if (!profile || !profile.embeddings || profile.embeddings.length === 0) {
    res.status(400); throw new Error('Face not enrolled.');
  }
  let verifyResult;
  try {
    verifyResult = await axios.post(`${FACE_SERVICE_URL}/compare`, {
      image, storedEmbeddings: profile.embeddings,
    }, { timeout: 15000 });
  } catch (error) {
    await FaceLoginLog.create({ userId: user._id, success: false, ipAddress: req.ip, device: req.headers['user-agent'], deviceInfo: getDeviceFingerprint(req) });
    res.status(500); throw new Error('Face verification failed.');
  }
  const { match, confidence } = verifyResult.data;
  if (match) {
    await FaceProfile.findOneAndUpdate({ userId: user._id }, { lastVerified: new Date() });
    const token = generateToken(user._id, user.role);
    await FaceLoginLog.create({ userId: user._id, success: true, confidence, ipAddress: req.ip, device: req.headers['user-agent'], deviceInfo: getDeviceFingerprint(req) });
    res.json({ _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, avatar: user.avatar, token, loginMethod: 'face', confidence });
  } else {
    await FaceLoginLog.create({ userId: user._id, success: false, confidence, ipAddress: req.ip, device: req.headers['user-agent'], deviceInfo: getDeviceFingerprint(req) });
    res.status(401).json({ message: 'Face not recognized.', confidence });
  }
});

// ─── IDENTIFY FACE (NO USERNAME) ──────────────────
const identifyFace = asyncHandler(async (req, res) => {
  const { image } = req.body;
  if (!image) { res.status(400); throw new Error('Image is required'); }
  console.log('🔍 Face identify called');
  const flaskAvailable = await isFlaskAvailable();
  if (!flaskAvailable) { res.status(503); throw new Error('Face service unavailable.'); }
  const allProfiles = await FaceProfile.find({ enrollmentStatus: 'complete' })
    .populate('userId', 'name username email role avatar').lean();
  console.log(`📊 Found ${allProfiles.length} enrolled users`);
  if (allProfiles.length === 0) { res.status(404); throw new Error('No enrolled users found.'); }
  const storedEmbeddingsList = allProfiles
    .filter(p => p.embeddings && p.embeddings.length > 0)
    .map(p => ({ userId: p.userId._id.toString(), embeddings: p.embeddings }));
  if (storedEmbeddingsList.length === 0) { res.status(404); throw new Error('No valid embeddings.'); }
  console.log(`📤 Sending ${storedEmbeddingsList.length} users to Flask...`);
  let identifyResult;
  try {
    identifyResult = await axios.post(`${FACE_SERVICE_URL}/identify`, { image, storedEmbeddingsList }, { timeout: 30000 });
    console.log('✅ Flask identify response:', JSON.stringify(identifyResult.data));
  } catch (error) {
    console.error('❌ Flask identify error:', error.message);
    res.status(500); throw new Error('Face identification failed.');
  }
  const { identified, userId, confidence } = identifyResult.data;
  if (identified && userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) { res.status(404); throw new Error('User not found.'); }
    console.log(`✅ User identified: ${user.name} (${user.role}) with confidence ${confidence}`);
    await FaceProfile.findOneAndUpdate({ userId: user._id }, { lastVerified: new Date() });
    const token = generateToken(user._id, user.role);
    await FaceLoginLog.create({ userId: user._id, success: true, confidence, ipAddress: req.ip, device: req.headers['user-agent'], deviceInfo: getDeviceFingerprint(req) });
    console.log(`🎉 Login successful! Redirecting to /${user.role}/dashboard`);
    res.json({ _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, avatar: user.avatar, token, loginMethod: 'face-identify', confidence });
  } else {
    console.log('❌ Face not identified.');
    res.status(401).json({ message: 'Face not recognized. Please try again or use password.' });
  }
});

// ─── ADMIN ROUTES (unchanged) ──────────────────────
const getFaceLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, userId } = req.query;
  const filter = userId ? { userId } : {};
  const total = await FaceLoginLog.countDocuments(filter);
  const logs = await FaceLoginLog.find(filter).populate('userId', 'name username role avatar').sort('-timestamp').skip((page - 1) * limit).limit(Number(limit)).lean();
  res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
});

const getFaceStatus = asyncHandler(async (req, res) => {
  const profile = await FaceProfile.findOne({ userId: req.user._id }).lean();
  res.json({ enrolled: !!profile && profile.enrollmentStatus === 'complete', lastVerified: profile?.lastVerified || null, disabled: profile?.faceLoginDisabled || false });
});

const deleteFaceProfile = asyncHandler(async (req, res) => {
  await FaceProfile.findOneAndDelete({ userId: req.user._id });
  auditService.log({ action: 'DELETE_FACE', entity: 'FaceProfile', entityId: req.user._id, description: 'Face profile deleted', performedBy: { userId: req.user._id, role: req.user.role, name: req.user.name }, req });
  res.json({ message: 'Face profile removed' });
});

const checkLiveness = asyncHandler(async (req, res) => {
  const { images } = req.body;
  if (!images || !Array.isArray(images)) { res.status(400); throw new Error('Images array required'); }
  const flaskAvailable = await isFlaskAvailable();
  if (!flaskAvailable) { res.status(503); throw new Error('Face service unavailable'); }
  const { data } = await axios.post(`${FACE_SERVICE_URL}/liveness`, { images }, { timeout: 15000 });
  res.json(data);
});

const requestRecovery = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) { res.status(400); throw new Error('Email is required'); }
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: 'If the email exists, a recovery code has been sent.' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.faceRecoveryOTP = otp;
  user.faceRecoveryOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  console.log(`🔑 Face recovery OTP for ${email}: ${otp}`);
  res.json({ message: 'If the email exists, a recovery code has been sent.' });
});

const verifyRecovery = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) { res.status(400); throw new Error('Email and OTP are required'); }
  const user = await User.findOne({ email, faceRecoveryOTP: otp, faceRecoveryOTPExpiry: { $gt: new Date() } });
  if (!user) { res.status(400); throw new Error('Invalid or expired OTP'); }
  user.faceRecoveryOTP = undefined; user.faceRecoveryOTPExpiry = undefined;
  await user.save();
  const token = generateToken(user._id, user.role);
  await FaceLoginLog.create({ userId: user._id, success: true, ipAddress: req.ip, device: req.headers['user-agent'], deviceInfo: getDeviceFingerprint(req), recoveryUsed: true });
  res.json({ _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, avatar: user.avatar, token, loginMethod: 'recovery' });
});

const getFaceAnalytics = asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [totalEnrolled, todayLogins, failedToday, spoofToday] = await Promise.all([
    FaceProfile.countDocuments({ enrollmentStatus: 'complete' }),
    FaceLoginLog.countDocuments({ timestamp: { $gte: today }, success: true }),
    FaceLoginLog.countDocuments({ timestamp: { $gte: today }, success: false, spoofDetected: false }),
    FaceLoginLog.countDocuments({ timestamp: { $gte: today }, spoofDetected: true }),
  ]);
  res.json({ totalEnrolled, todayLogins, failedToday, spoofToday });
});

const getFaceTrends = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const trends = await FaceLoginLog.aggregate([
    { $match: { timestamp: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, total: { $sum: 1 }, success: { $sum: { $cond: ['$success', 1, 0] } }, failed: { $sum: { $cond: ['$success', 0, 1] } }, spoofed: { $sum: { $cond: ['$spoofDetected', 1, 0] } } } },
    { $sort: { _id: 1 } },
  ]);
  res.json(trends);
});

const getFaceByRole = asyncHandler(async (req, res) => {
  const result = await FaceLoginLog.aggregate([
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $group: { _id: '$user.role', total: { $sum: 1 }, success: { $sum: { $cond: ['$success', 1, 0] } }, failed: { $sum: { $cond: ['$success', 0, 1] } } } },
  ]);
  res.json(result);
});

const getEnrolledUsers = asyncHandler(async (req, res) => {
  const profiles = await FaceProfile.find({ enrollmentStatus: 'complete' }).populate('userId', 'name username role email avatar').lean();
  res.json(profiles.map(p => ({ _id: p._id, user: p.userId, enrolledAt: p.createdAt, lastVerified: p.lastVerified, imageCount: p.faceImages?.length || 0 })));
});

module.exports = { enrollFace, verifyFace, identifyFace, getFaceLogs, getFaceStatus, deleteFaceProfile, checkLiveness, getFaceAnalytics, getFaceTrends, getFaceByRole, getEnrolledUsers, requestRecovery, verifyRecovery };