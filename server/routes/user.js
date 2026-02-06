const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const Reply = require('../models/Reply');
const User = require('../models/User');
const { generateDeviceHash } = require('../utils/helpers');
const { protect } = require('../middleware/auth');

/**
 * GET /api/user/active-confession-count
 * Get count of active confessions for current device
 */
router.get('/active-confession-count', async (req, res) => {
  try {
    const deviceHash = generateDeviceHash(req);
    
    const activeCount = await Confession.countDocuments({
      deviceHash,
      expiresAt: { $gt: new Date() }
    });
    
    const maxAllowed = parseInt(process.env.MAX_ACTIVE_CONFESSIONS) || 2;
    
    res.json({
      success: true,
      activeCount,
      maxAllowed,
      canPost: activeCount < maxAllowed
    });
    
  } catch (error) {
    console.error('Error fetching active count:', error);
    res.status(500).json({ error: { message: 'Failed to fetch active count' } });
  }
});

/**
 * GET /api/user/my-confessions
 * Get user's own active confessions (for limit display)
 */
router.get('/my-confessions', async (req, res) => {
  try {
    const deviceHash = generateDeviceHash(req);
    
    const confessions = await Confession.find({
      deviceHash,
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .select('text replyCount createdAt expiresAt')
    .lean();
    
    res.json({
      success: true,
      confessions
    });
    
  } catch (error) {
    console.error('Error fetching user confessions:', error);
    res.status(500).json({ error: { message: 'Failed to fetch confessions' } });
  }
});

/**
 * GET /api/user/profile
 * Get authenticated user's profile information
 * @access Private
 */
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('username email avatar role createdAt');

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Get user's stats
    const [confessionCount, replyCount, activeConfessionCount] = await Promise.all([
      Confession.countDocuments({ userId: req.user._id }),
      Reply.countDocuments({ userId: req.user._id }),
      Confession.countDocuments({ 
        userId: req.user._id,
        expiresAt: { $gt: new Date() }
      })
    ]);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        stats: {
          totalConfessions: confessionCount,
          totalReplies: replyCount,
          activeConfessions: activeConfessionCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: { message: 'Failed to fetch profile' } });
  }
});

/**
 * GET /api/user/my-activity
 * Get authenticated user's confessions and replies
 * @access Private
 */
router.get('/my-activity', protect, async (req, res) => {
  try {
    const { type } = req.query; // 'confessions' or 'replies' or 'all'

    let confessions = [];
    let replies = [];

    if (!type || type === 'all' || type === 'confessions') {
      confessions = await Confession.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .select('text category replyCount likeCount createdAt expiresAt isPoll isPublished')
        .limit(50)
        .lean();
    }

    if (!type || type === 'all' || type === 'replies') {
      replies = await Reply.find({ userId: req.user._id })
        .populate('confessionId', 'text')
        .sort({ createdAt: -1 })
        .select('text confessionId createdAt')
        .limit(50)
        .lean();
    }

    res.json({
      success: true,
      confessions,
      replies
    });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: { message: 'Failed to fetch activity' } });
  }
});

module.exports = router;
