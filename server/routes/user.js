const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const { generateDeviceHash } = require('../utils/helpers');

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

module.exports = router;
