const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure local uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Local disk storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for safety
const fileFilter = (req, file, cb) => {
  // Allow all standard safe types (images, documents, archives, code text)
  const forbiddenExts = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs', '.scr'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (forbiddenExts.includes(ext)) {
    return cb(new Error('Executable file types are not permitted for security reasons.'), false);
  }
  cb(null, true);
};

// 25 MB max file limit
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
