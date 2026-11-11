const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const { assertPasswordPolicy } = require('../utils/passwordPolicy');

// @desc    Update profile (name, email)
// @route   PUT /api/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email,username } = req.body;
  const user = await User.findById(req.user._id);

   if (!user) {
    res.status(404);
    throw new Error('User not found');}


    // Check permission for username change
  const canChangeUsername = user.canChangeUsername !== undefined ? user.canChangeUsername : true;
  


  if (username && !user.canChangeUsername) {
    res.status(403);
    throw new Error('You  do  not have permission to change your username');
  }

  user.name = name || user.name;
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already in use');
    }
    user.email = email;
  }

    if (username && username !== user.username) {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      res.status(400);
      throw new Error('Username already taken');
    }
    user.username = username;
  }


  const updatedUser = await user.save();
  res.json({ name: updatedUser.name, email: updatedUser.email });
});

// @desc    Change password
// @route   PUT /api/profile/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  // Default to true if permission is not explicitly set (for existing users)
  const canChange = user.canChangePassword !== undefined ? user.canChangePassword : true;



  if (!user.canChangePassword) {
    res.status(403);
    throw new Error('You  do not have the  permission to change your password');
  }

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }
  assertPasswordPolicy(newPassword);

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

// @desc    Upload avatar
// @route   POST /api/profile/avatar
//const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
//const asyncHandler = require('express-async-handler');
//cdconst User = require('../models/User');

// @desc    Upload avatar to Cloudinary
// @route   POST /api/profile/avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  const user = await User.findById(req.user._id);

  // Function to handle the stream upload
  const streamUpload = (buffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'school_avatars',
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'face',
        },
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  };

  try {
    const result = await streamUpload(req.file.buffer);
    user.avatar = result.secure_url;
    await user.save();

    res.json({ avatar: user.avatar });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500);
    throw new Error('Image upload failed');
  }
});
// @desc    Update user theme preference
// @route   PUT /api/profile/theme
const updateTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.theme = theme;
  await user.save();
  res.json({ theme: user.theme });
});



module.exports = { updateProfile, changePassword, uploadAvatar ,updateTheme};






/*

const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.name = name || user.name;
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) { res.status(400); throw new Error('Email already in use'); }
    user.email = email;
  }
  const updatedUser = await user.save();
  res.json({ name: updatedUser.name, email: updatedUser.email });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword))) { res.status(401); throw new Error('Current password is incorrect'); }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('Please upload an image'); }
  const user = await User.findById(req.user._id);
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const result = await cloudinary.uploader.upload(req.file.path, { folder: 'avatars', width: 300, crop: 'scale' });
    user.avatar = result.secure_url;
    fs.unlinkSync(req.file.path);
  } else {
    user.avatar = `/uploads/avatars/${req.file.filename}`;
  }
  await user.save();
  res.json({ avatar: user.avatar });
});

module.exports = { updateProfile, changePassword, uploadAvatar };
*/
