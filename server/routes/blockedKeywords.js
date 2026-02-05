const express = require('express');
const router = express.Router();
const BlockedKeyword = require('../models/BlockedKeyword');
const { generateDeviceHash } = require('../utils/helpers');

/**
 * GET /api/blocked-keywords
 * Get user's blocked keywords
 */
router.get('/', async (req, res) => {
  try {
    const deviceHash = generateDeviceHash(req);
    const keywords = await BlockedKeyword.find({ deviceHash }).select('keyword createdAt');
    
    res.json({
      success: true,
      keywords
    });
  } catch (error) {
    console.error('Error fetching blocked keywords:', error);
    res.status(500).json({ error: { message: 'Failed to fetch blocked keywords' } });
  }
});

/**
 * POST /api/blocked-keywords
 * Add a blocked keyword
 */
router.post('/', async (req, res) => {
  try {
    const deviceHash = generateDeviceHash(req);
    const { keyword } = req.body;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: { message: 'Keyword is required' } });
    }

    const blockedKeyword = new BlockedKeyword({
      keyword: keyword.trim().toLowerCase(),
      deviceHash
    });

    await blockedKeyword.save();

    res.status(201).json({
      success: true,
      keyword: blockedKeyword
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: { message: 'Keyword already blocked' } });
    }
    console.error('Error adding blocked keyword:', error);
    res.status(500).json({ error: { message: 'Failed to add blocked keyword' } });
  }
});

/**
 * DELETE /api/blocked-keywords/:id
 * Remove a blocked keyword
 */
router.delete('/:id', async (req, res) => {
  try {
    const deviceHash = generateDeviceHash(req);
    const result = await BlockedKeyword.deleteOne({
      _id: req.params.id,
      deviceHash
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: { message: 'Keyword not found' } });
    }

    res.json({
      success: true,
      message: 'Keyword removed'
    });
  } catch (error) {
    console.error('Error removing blocked keyword:', error);
    res.status(500).json({ error: { message: 'Failed to remove blocked keyword' } });
  }
});

module.exports = router;
