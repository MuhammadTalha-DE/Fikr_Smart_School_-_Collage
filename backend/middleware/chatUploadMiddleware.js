const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '..', 'uploads', 'chat');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Allow common image, document, archive, audio, and video message attachments.
  const allowed = /\.(jpeg|jpg|png|gif|webp|bmp|svg|pdf|docx?|xlsx?|pptx?|txt|zip|rar|webm|mp3|wav|m4a|ogg|mp4|mov)$/i;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = /^(image|application|text|audio|video)\//.test(file.mimetype);
  if (extOk || mimeOk) return cb(null, true);
  cb(new Error('Unsupported file type'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter,
});

module.exports = upload;
