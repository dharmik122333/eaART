const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (support image, video, document and audio upload)
const fileFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|png|webp|gif|mp4|mov|webm|pdf|docx|zip|mp3|wav|ogg/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExts.test(file.mimetype.toLowerCase()) || 
                   file.mimetype.includes('application/zip') || 
                   file.mimetype.includes('application/octet-stream') ||
                   file.mimetype.includes('application/x-zip-compressed') ||
                   file.mimetype.includes('vnd.openxmlformats-officedocument.wordprocessingml.document');

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('File format not supported! Only images, videos, audio, PDF, DOCX, and ZIP files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max size (for videos and heavy files)
  }
});

module.exports = upload;
