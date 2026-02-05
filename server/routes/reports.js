const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Confession = require('../models/Confession');
const Reply = require('../models/Reply');
const { generateDeviceHash } = require('../utils/helpers');
const { reportLimiter } = require('../middleware/rateLimiter');

const REPORT_THRESHOLD = 5; // Hide content after this many reports

/**
 * POST /api/reports
 * Report a confession or reply
 */
router.post('/', reportLimiter, async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;
    const deviceHash = generateDeviceHash(req);
    
    // Validate input
    if (!['confession', 'reply'].includes(targetType)) {
      return res.status(400).json({ error: { message: 'Invalid target type' } });
    }
    
    // Check if target exists
    const Model = targetType === 'confession' ? Confession : Reply;
    const target = await Model.findById(targetId);
    
    if (!target) {
      return res.status(404).json({ error: { message: 'Content not found' } });
    }
    
    // Check if already reported by this device
    const existingReport = await Report.findOne({ targetId, deviceHash });
    if (existingReport) {
      return res.status(400).json({ error: { message: 'You have already reported this content' } });
    }
    
    // Create report
    const report = new Report({
      targetType,
      targetId,
      deviceHash,
      reason: reason || 'other'
    });
    
    await report.save();
    
    // Increment report count and check threshold
    const reportCount = await Report.countDocuments({ targetId });
    
    await Model.findByIdAndUpdate(targetId, {
      reportCount,
      ...(reportCount >= REPORT_THRESHOLD && { isHidden: true })
    });
    
    res.json({
      success: true,
      message: 'Report submitted successfully',
      hidden: reportCount >= REPORT_THRESHOLD
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: { message: 'You have already reported this content' } });
    }
    console.error('Error creating report:', error);
    res.status(500).json({ error: { message: 'Failed to submit report' } });
  }
});

module.exports = router;
