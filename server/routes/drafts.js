const express = require('express');
const router = express.Router();
const Draft = require('../models/Draft');
const { generateDeviceHash } = require('../utils/helpers');

/**
 * GET /api/drafts
 * Get user's draft
 */
router.get('/', async (req, res) => {
  try {
    const deviceHash = generateDeviceHash(req);
    const draft = await Draft.findOne({ deviceHash });
    
    res.json({
      success: true,
      draft: draft || null
    });
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ error: { message: 'Failed to fetch draft' } });
  }
});

/**
 * POST /api/drafts
 * Save or update draft
 */
router.post('/', async (req, res) => {
  try {
    const deviceHash = generateDeviceHash(req);
    const { text, category, isPoll, pollOptions, scheduledFor } = req.body;

    const draft = await Draft.findOneAndUpdate(
      { deviceHash },
      {
        text,
        category,
        isPoll,
        pollOptions,
        scheduledFor,
        deviceHash,
        updatedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      draft
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: { message: 'Failed to save draft' } });
  }
});

/**
 * DELETE /api/drafts
 * Delete draft
 */
router.delete('/', async (req, res) => {
  try {
    const deviceHash = generateDeviceHash(req);
    await Draft.deleteOne({ deviceHash });
    
    res.json({
      success: true,
      message: 'Draft deleted'
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ error: { message: 'Failed to delete draft' } });
  }
});

module.exports = router;
