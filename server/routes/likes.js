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
    const userId = req.user._id;

    console.log(`👤 User ${userId} toggling like on confession ${confessionId}`);

    // Check if confession exists
    const confession = await Confession.findOne({
      _id: confessionId,
      expiresAt: { $gt: new Date() }
    });

    if (!confession) {
      return res.status(404).json({ error: { message: 'Confession not found or expired' } });
    }

    // Check if already liked - Use atomic findOne to prevent race conditions
    const existingLike = await Like.findOne({
      confessionId,
      deviceHash
    });

    if (existingLike) {
      console.log(`💔 Unliking confession ${confessionId}`);

      // Unlike - Use atomic deleteOne to ensure single deletion
      const deleteResult = await Like.deleteOne({
        _id: existingLike._id,
        confessionId,  // Extra safety: ensure it's for the right confession
        deviceHash     // Extra safety: ensure it's from the right device
      });

      if (deleteResult.deletedCount === 0) {
        console.warn(`⚠️ Like already deleted by another request`);
        // Like was already deleted (race condition), just update the count
      }

      // Atomically decrement like count
      const updatedConfession = await Confession.findByIdAndUpdate(
        confessionId,
        { $inc: { likeCount: -1 } },
        { new: true }
      );

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

      console.log(`✅ Unlike successful. New count: ${updatedConfession.likeCount}`);

      return res.json({
        success: true,
        liked: false,
        likeCount: updatedConfession.likeCount
      });
    } else {
      console.log(`❤️ Liking confession ${confessionId}`);

      // Like - Use atomic insertOne with error handling for duplicates
      try {
        const like = new Like({
          confessionId,
          deviceHash,
          userId
        });

        await like.save();

        // Atomically increment like count
        const updatedConfession = await Confession.findByIdAndUpdate(
          confessionId,
          { $inc: { likeCount: 1 } },
          { new: true }
        );

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

        console.log(`✅ Like successful. New count: ${updatedConfession.likeCount}`);

        return res.json({
          success: true,
          liked: true,
          likeCount: updatedConfession.likeCount
        });
      } catch (saveError) {
        // Duplicate key error (11000) means user tried to like twice simultaneously
        if (saveError.code === 11000) {
          console.warn(`⚠️ Duplicate like prevented for confession ${confessionId}`);

          // Return current state without incrementing
          const currentConfession = await Confession.findById(confessionId);
          return res.json({
            success: true,
            liked: true,
            likeCount: currentConfession.likeCount
          });
        }
        throw saveError;
      }
    }

  } catch (error) {
    console.error('❌ Error toggling like:', error);
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
