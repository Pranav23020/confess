const express = require('express');
const router = express.Router();
const Reply = require('../models/Reply');
const Confession = require('../models/Confession');
const { generateDeviceHash, sanitizeText } = require('../utils/helpers');
const { validateReplyText } = require('../utils/profanityFilter');
const { replyLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/replies
 * Create a reply to a confession or another reply (threading)
 */
router.post('/', replyLimiter, async (req, res) => {
  try {
    const { confessionId, text, parentReplyId } = req.body;
    const deviceHash = generateDeviceHash(req);
    
    // Validate text
    const validation = validateReplyText(text);
    if (!validation.isValid) {
      return res.status(400).json({ error: { message: validation.errors[0] } });
    }
    
    // Check if confession exists and is not expired
    const confession = await Confession.findOne({
      _id: confessionId,
      expiresAt: { $gt: new Date() }
    });
    
    if (!confession) {
      return res.status(404).json({ error: { message: 'Confession not found or expired' } });
    }
    
    if (confession.isHidden) {
      return res.status(403).json({ error: { message: 'Cannot reply to hidden confession' } });
    }

    // If replying to another reply, verify it exists
    if (parentReplyId) {
      const parentReply = await Reply.findOne({
        _id: parentReplyId,
        confessionId,
        isHidden: false
      });

      if (!parentReply) {
        return res.status(404).json({ error: { message: 'Parent reply not found' } });
      }
    }
    
    // Create reply
    const reply = new Reply({
      confessionId,
      parentReplyId: parentReplyId || null,
      text: sanitizeText(text),
      deviceHash
    });
    
    await reply.save();
    
    // Increment reply count on confession
    await Confession.findByIdAndUpdate(confessionId, {
      $inc: { replyCount: 1 }
    });
    
    res.status(201).json({
      success: true,
      reply: {
        _id: reply._id,
        confessionId: reply.confessionId,
        parentReplyId: reply.parentReplyId,
        text: reply.text,
        createdAt: reply.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ error: { message: 'Failed to create reply' } });
  }
});

/**
 * GET /api/replies/:confessionId
 * Get all replies for a confession
 */
router.get('/:confessionId', async (req, res) => {
  try {
    const replies = await Reply.find({
      confessionId: req.params.confessionId,
      isHidden: false
    })
    .sort({ createdAt: 1 })
    .select('-deviceHash')
    .lean();
    
    res.json({
      success: true,
      replies
    });
    
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ error: { message: 'Failed to fetch replies' } });
  }
});

module.exports = router;
