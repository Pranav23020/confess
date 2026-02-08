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
    const { targetType, targetId, reason, description } = req.body;
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
      reason: reason || 'other',
      description: description || ''
    });
    
    await report.save();
    
    // Increment report count and check threshold
    const reportCount = await Report.countDocuments({ targetId });
    
    await Model.findByIdAndUpdate(targetId, {
      reportCount,
      ...(reportCount >= REPORT_THRESHOLD && { isHidden: true })
    });
    
    const action = reportCount >= REPORT_THRESHOLD ? 'hidden' : 'queued';

    res.json({
      success: true,
      message: 'Report submitted successfully',
      hidden: reportCount >= REPORT_THRESHOLD,
      action
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: { message: 'You have already reported this content' } });
    }
    console.error('Error creating report:', error);
    res.status(500).json({ error: { message: 'Failed to submit report' } });
  }
});

/**
 * GET /api/reports/my
 * Get report status history for current device
 */
router.get('/my', async (req, res) => {
  try {
    const deviceHash = generateDeviceHash(req);
    const reports = await Report.find({ deviceHash }).sort({ createdAt: -1 }).lean();

    const confessionIds = reports
      .filter((report) => report.targetType === 'confession')
      .map((report) => report.targetId);
    const replyIds = reports
      .filter((report) => report.targetType === 'reply')
      .map((report) => report.targetId);

    const [confessions, replies] = await Promise.all([
      confessionIds.length
        ? Confession.find({ _id: { $in: confessionIds } }).select('_id isHidden').lean()
        : Promise.resolve([]),
      replyIds.length
        ? Reply.find({ _id: { $in: replyIds } }).select('_id isHidden').lean()
        : Promise.resolve([])
    ]);

    const confessionMap = new Map(confessions.map((item) => [String(item._id), item]));
    const replyMap = new Map(replies.map((item) => [String(item._id), item]));

    const enriched = reports.map((report) => {
      const lookup = report.targetType === 'confession' ? confessionMap : replyMap;
      const target = lookup.get(String(report.targetId));
      const targetExists = Boolean(target);
      const action = targetExists && target.isHidden ? 'hidden' : 'queued';

      return {
        id: report._id,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        description: report.description,
        createdAt: report.createdAt,
        action,
        targetExists
      };
    });

    res.json({ success: true, reports: enriched });
  } catch (error) {
    console.error('Error fetching report history:', error);
    res.status(500).json({ error: { message: 'Failed to load report history' } });
  }
});

module.exports = router;
