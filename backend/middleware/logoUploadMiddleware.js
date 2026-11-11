const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const dir = 'uploads/logos';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|svg|bmp|tiff?|ico|avif|heif|heic)$/i;
const allowedMimetypes = /^image\/(jpeg|png|gif|webp|svg\+xml|bmp|tiff?|x-icon|avif|heif|heic)$/i;

const fileFilter = (req, file, cb) => {
  const ext = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedMimetypes.test(file.mimetype);
  if (ext || mime) return cb(null, true);
  cb(new Error('Invalid image format'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB
  fileFilter,
});

module.exports = upload;