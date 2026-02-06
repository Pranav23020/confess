const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  confessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Confession',
    required: true,
    index: true
  },
  parentReplyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply',
    default: null,
    index: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 300,
    trim: true
  },
  deviceHash: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  reportCount: {
    type: Number,
    default: 0
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Reply expires with its parent confession (handled by MongoDB TTL on parent)
module.exports = mongoose.model('Reply', replySchema);
