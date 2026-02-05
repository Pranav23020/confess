const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  confessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Confession',
    required: true,
    index: true
  },
  deviceHash: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate likes from same device
likeSchema.index({ confessionId: 1, deviceHash: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
