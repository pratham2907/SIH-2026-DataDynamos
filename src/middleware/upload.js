const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedExts = [
  '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp',
  '.png',
  '.pdf',
  '.webp',
  '.bmp',
  '.tif', '.tiff',
  '.heic', '.heif'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
    const cleanName = path.basename(file.originalname || 'doc', ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${Date.now()}_${cleanName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = (path.extname(file.originalname || '') || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const isAllowedExt = allowedExts.includes(ext);
  const isAllowedMime = mime.startsWith('image/') ||
                        mime.includes('pdf') ||
                        mime === 'application/octet-stream';

  if (isAllowedExt || isAllowedMime) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP and PDF files are allowed for upload!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter
});

module.exports = upload;
