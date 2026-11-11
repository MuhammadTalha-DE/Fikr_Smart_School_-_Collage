/*
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { updateProfile, changePassword, uploadAvatar } = require('../controllers/profileController');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();
router.put('/', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
module.exports = router;
*/
const express = require('express');
const sharp = require('sharp');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');
const { updateProfile, changePassword, uploadAvatar,updateTheme } = require('../controllers/profileController');
const upload = require('../middleware/uploadMiddleware');
const { uploadLimiter, writeLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

router.put('/', protect, writeLimiter, updateProfile);
router.put('/password', protect, writeLimiter, changePassword);
router.put('/theme', protect, writeLimiter, updateTheme);
router.post('/avatar', protect, uploadLimiter, upload.single('avatar'), uploadAvatar);
router.put('/avatar', protect, uploadLimiter, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Reject files > 5 MB (extra safety)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size must be under 5 MB' });
    }

    // Resize the image to max 400×400 pixels
    const resizedBuffer = await sharp(req.file.buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .toFormat('jpeg')
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64Image = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;

    // Upload to Cloudinary with a 60‑second timeout
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'school_avatars',
      resource_type: 'image',
      timeout: 60000,
    });

    await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url });

    res.json({ success: true, avatarUrl: result.secure_url });
  } catch (err) {
    console.error('Avatar upload error:', err);
    throw err;
  }
});

module.exports = router;

