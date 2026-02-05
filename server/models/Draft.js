const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  text: {
    type: String,
    maxlength: 500,
    trim: true
  },
  category: {
    type: String,
    enum: ['love', 'career', 'secrets', 'life', 'relationships', 'mental-health', 'other'],
    default: 'other'
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
  isPoll: {
    type: Boolean,
    default: false
  },
  pollOptions: [{
    text: String
  }],
  scheduledFor: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
draftSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Only keep one draft per device/user
draftSchema.index({ deviceHash: 1 }, { unique: true });

module.exports = mongoose.model('Draft', draftSchema);
