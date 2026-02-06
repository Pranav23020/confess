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

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

module.exports = { upload, optimizeImages };
