const mongoose = require('mongoose');

const blockedKeywordSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  deviceHash: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique keywords per user
blockedKeywordSchema.index({ deviceHash: 1, keyword: 1 }, { unique: true });

module.exports = mongoose.model('BlockedKeyword', blockedKeywordSchema);
