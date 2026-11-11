const multer = require('multer');
const path = require('path');

const allowedExtensions = /\.(jpeg|jpg|png|webp)$/i;
const allowedMimetypes = /^image\/(jpeg|png|webp)$/i;

const fileFilter = (req, file, cb) => {
  const hasAllowedExtension = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const hasAllowedMime = allowedMimetypes.test(file.mimetype);

  if (hasAllowedExtension && hasAllowedMime) {
    cb(null, true);
    return;
  }

  cb(new Error('Only PNG, JPG, JPEG, and WEBP images are allowed for official assets'));
};

const officialAssetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter,
});

module.exports = officialAssetUpload;
