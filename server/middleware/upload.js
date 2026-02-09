const multer = require('multer');
const path = require('path');
const fs = require('fs');

const sharp = require('sharp');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'confessions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage for post-processing with sharp
const storage = multer.memoryStorage();

// File filter (already exists, but kept for context)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
  }
};

/**
 * Image Processor Middleware
 */
const optimizeImages = async (req, res, next) => {
  if (!req.files) return next();

  const files = req.files.images || req.files.image || [];
  if (!Array.isArray(files) && req.files.image) {
    // Single file field
    const file = req.files.image[0];
    const optimizedName = `confession-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const outputPath = path.join(uploadDir, optimizedName);

    await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Update file object for routes
    file.filename = optimizedName;
    file.path = `/uploads/confessions/${optimizedName}`;
  } else if (Array.isArray(files)) {
    // Multiple files (images)
    for (const file of files) {
      const optimizedName = `confession-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const outputPath = path.join(uploadDir, optimizedName);

      await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      file.filename = optimizedName;
      file.path = `/uploads/confessions/${optimizedName}`;
    }
  }

  next();
};

// Create multer instance with strict limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 5, // Maximum 5 files per upload
    fieldSize: 1 * 1024 * 1024 // 1MB max for text fields
  },
  fileFilter: fileFilter
});

// Error handler middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: { message: 'File too large. Maximum size is 5MB per file.' }
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: { message: 'Too many files. Maximum is 5 files per upload.' }
      });
    }
    if (err.code === 'LIMIT_FIELD_VALUE') {
      return res.status(400).json({
        error: { message: 'Field value too large.' }
      });
    }
    return res.status(400).json({
      error: { message: 'File upload error: ' + err.message }
    });
  }

  if (err) {
    return res.status(400).json({
      error: { message: err.message || 'File upload failed' }
    });
  }

  next();
};

module.exports = { upload, optimizeImages, handleMulterError };
