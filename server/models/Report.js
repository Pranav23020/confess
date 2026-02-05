const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: ['confession', 'reply'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  deviceHash: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'hate-speech', 'violence', 'sexual-content', 'misinformation', 'self-harm', 'bullying', 'privacy-violation', 'scam', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    maxlength: 200,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours
  }
});

// Prevent duplicate reports from same device
reportSchema.index({ targetId: 1, deviceHash: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
