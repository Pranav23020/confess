const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 100
  },
  votes: {
    type: Number,
    default: 0
  },
  voters: [{
    type: String // deviceHash
  }]
});

const confessionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  images: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    enum: ['love', 'career', 'secrets', 'life', 'relationships', 'mental-health', 'other'],
    default: 'other',
    index: true
  },
  deviceHash: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  replyCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0,
    index: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  isPoll: {
    type: Boolean,
    default: false
  },
  pollOptions: [pollOptionSchema],
  hashtags: {
    type: [String],
    default: [],
    index: true,
    lowercase: true,
    trim: true
  },
  hashtagViews: {
    type: [String], // Store unique deviceHashes of people who viewed based on hashtags
    default: []
  },
  scheduledFor: {
    type: Date,
    index: true
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
});

// Automatically delete replies when confession is deleted
confessionSchema.pre('remove', async function (next) {
  try {
    await mongoose.model('Reply').deleteMany({ confessionId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

// Add virtual for time remaining
confessionSchema.virtual('hoursRemaining').get(function () {
  const now = new Date();
  const diffMs = this.expiresAt - now;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
});

confessionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Confession', confessionSchema);
