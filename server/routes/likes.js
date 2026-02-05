const express = require('express');
const router = express.Router();
const Like = require('../models/Like');
const Confession = require('../models/Confession');
const { generateDeviceHash } = require('../utils/helpers');

/**
 * POST /api/likes/:confessionId
 * Toggle like on a confession
 */
router.post('/:confessionId', async (req, res) => {
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
      
      return res.json({
        success: true,
        liked: false,
        likeCount: updatedConfession.likeCount
      });
    } else {
      // Like - add like
      const like = new Like({
        confessionId,
        deviceHash
      });
      
      await like.save();
      await Confession.findByIdAndUpdate(confessionId, {
        $inc: { likeCount: 1 }
      });
      
      const updatedConfession = await Confession.findById(confessionId);
      
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
