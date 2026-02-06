const express = require('express');
const router = express.Router();
const Like = require('../models/Like');
const Confession = require('../models/Confession');
const { generateDeviceHash } = require('../utils/helpers');
const { protect } = require('../middleware/auth');

/**
 * POST /api/likes/:confessionId
 * Toggle like on a confession
 * @access Private (requires login)
 */
router.post('/:confessionId', protect, async (req, res) => {
  try {
    const { confessionId } = req.params;
    const deviceHash = generateDeviceHash(req);

    // Check if confession exists
    const confession = await Confession.findOne({
      _id: confessionId,
      expiresAt: { $gt: new Date() }
    });

    if (!confession) {
      return res.status(404).json({ error: { message: 'Confession not found or expired' } });
    }

    // Check if already liked
    const existingLike = await Like.findOne({ confessionId, deviceHash });

    if (existingLike) {
      // Unlike - remove like
      await Like.deleteOne({ _id: existingLike._id });
      await Confession.findByIdAndUpdate(confessionId, {
        $inc: { likeCount: -1 }
      });

      const updatedConfession = await Confession.findById(confessionId);

      // Emit real-time event
      try {
        const io = require('../utils/socket').getIO();
        io.emit('confession:engagement', {
          confessionId,
          likeCount: updatedConfession.likeCount,
          replyCount: updatedConfession.replyCount
        });
      } catch (ioErr) {
        console.error('Socket error emitting like engagement:', ioErr);
      }

      return res.json({
        success: true,
        liked: false,
        likeCount: updatedConfession.likeCount
      });
    } else {
      // Like - add like
      const like = new Like({
        confessionId,
        deviceHash,
        userId: req.user._id // Store authenticated user
      });

      await like.save();
      await Confession.findByIdAndUpdate(confessionId, {
        $inc: { likeCount: 1 }
      });

      const updatedConfession = await Confession.findById(confessionId);

      // Emit real-time event
      try {
        const io = require('../utils/socket').getIO();
        io.emit('confession:engagement', {
          confessionId,
          likeCount: updatedConfession.likeCount,
          replyCount: updatedConfession.replyCount
        });
      } catch (ioErr) {
        console.error('Socket error emitting like engagement:', ioErr);
      }

      return res.json({
        success: true,
        liked: true,
        likeCount: updatedConfession.likeCount
      });
    }

  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: { message: 'Failed to toggle like' } });
  }
});

/**
 * GET /api/likes/:confessionId/status
 * Check if user has liked a confession
 */
router.get('/:confessionId/status', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const deviceHash = generateDeviceHash(req);

    const like = await Like.findOne({ confessionId, deviceHash });

    res.json({
      success: true,
      liked: !!like,
      likeCount: await Confession.findById(confessionId).then(c => c?.likeCount || 0)
    });

  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ error: { message: 'Failed to check like status' } });
  }
});

module.exports = router;
