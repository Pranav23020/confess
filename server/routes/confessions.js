const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const Reply = require('../models/Reply');
const { generateDeviceHash, getExpirationDate, getHoursRemaining, sanitizeText } = require('../utils/helpers');
const { validateConfessionText } = require('../utils/profanityFilter');
const { confessionLimiter } = require('../middleware/rateLimiter');
const { optionalProtect } = require('../middleware/auth');

/**
 * POST /api/confessions
 * Create a new confession
 */
router.post('/', confessionLimiter, async (req, res) => {
  try {
    const { text, category, isPoll, pollOptions, scheduledFor } = req.body;
    const deviceHash = generateDeviceHash(req);

    // Validate text
    const validation = validateConfessionText(text);
    if (!validation.isValid) {
      return res.status(400).json({ error: { message: validation.errors[0] } });
    }

    // Validate poll options if poll
    if (isPoll) {
      if (!pollOptions || pollOptions.length < 2 || pollOptions.length > 4) {
        return res.status(400).json({ error: { message: 'Polls must have 2-4 options' } });
      }
    }

    // Check active confession limit (2 max)
    const activeCount = await Confession.countDocuments({
      deviceHash,
      expiresAt: { $gt: new Date() }
    });

    if (activeCount >= (parseInt(process.env.MAX_ACTIVE_CONFESSIONS) || 2)) {
      return res.status(403).json({
        error: {
          message: 'You have reached the maximum of 2 active confessions. Wait for one to expire.',
          code: 'MAX_CONFESSIONS_REACHED'
        }
      });
    }

    // Prepare confession data
    const confessionData = {
      text: sanitizeText(text),
      category: category || 'other',
      deviceHash,
      isPoll: isPoll || false,
      expiresAt: getExpirationDate()
    };

    // Add poll options if it's a poll
    if (isPoll && pollOptions) {
      confessionData.pollOptions = pollOptions.map(opt => ({
        text: opt.text || opt,
        votes: 0,
        voters: []
      }));
    }

    // Handle scheduled posts
    if (scheduledFor) {
      const scheduleDate = new Date(scheduledFor);
      if (scheduleDate > new Date()) {
        confessionData.scheduledFor = scheduleDate;
        confessionData.isPublished = false;
      }
    }

    // Create confession
    const confession = new Confession(confessionData);
    await confession.save();

    res.status(201).json({
      success: true,
      confession: {
        _id: confession._id,
        text: confession.text,
        category: confession.category,
        isPoll: confession.isPoll,
        pollOptions: confession.pollOptions,
        replyCount: confession.replyCount,
        scheduledFor: confession.scheduledFor,
        isPublished: confession.isPublished,
        createdAt: confession.createdAt,
        expiresAt: confession.expiresAt,
        hoursRemaining: getHoursRemaining(confession.expiresAt)
      }
    });


  } catch (error) {
    console.error('Error creating confession:', error);
    res.status(500).json({ error: { message: 'Failed to create confession' } });
  }
});

/**
 * GET /api/confessions
 * Get all confessions (feed)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const confessions = await Confession.find({
      expiresAt: { $gt: new Date() },
      isHidden: false
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-deviceHash')
      .lean();

    // Add time remaining to each confession
    const confessionsWithTime = confessions.map(confession => ({
      ...confession,
      hoursRemaining: getHoursRemaining(confession.expiresAt)
    }));

    const total = await Confession.countDocuments({
      expiresAt: { $gt: new Date() },
      isHidden: false
    });

    res.json({
      success: true,
      confessions: confessionsWithTime,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching confessions:', error);
    res.status(500).json({ error: { message: 'Failed to fetch confessions' } });
  }
});

/**
 * Get single confession with replies
 */
router.get('/:id', optionalProtect, async (req, res) => {
  try {
    const confession = await Confession.findOne({
      _id: req.params.id,
      expiresAt: { $gt: new Date() }
    }).select('+deviceHash'); // Need hash to check ownership, but don't send it back raw if not owner? Actually we shouldn't send it back.

    if (!confession) {
      return res.status(404).json({ error: { message: 'Confession not found or expired' } });
    }

    if (confession.isHidden) {
      return res.status(404).json({ error: { message: 'This confession has been hidden' } });
    }

    // Check ownership
    let isOwner = false;
    if (req.user && confession.userId && confession.userId.toString() === req.user._id.toString()) {
      isOwner = true;
    } else if (confession.deviceHash === generateDeviceHash(req)) {
      isOwner = true;
    }

    // Get replies
    const replies = await Reply.find({
      confessionId: req.params.id,
      isHidden: false
    })
      .sort({ createdAt: 1 })
      .select('-deviceHash')
      .lean();

    // Prepare response (exclude deviceHash from object if we included it via +deviceHash)
    const confessionObj = confession.toObject();
    delete confessionObj.deviceHash;

    res.json({
      success: true,
      confession: {
        ...confessionObj,
        hoursRemaining: getHoursRemaining(confession.expiresAt),
        isOwner // Send flag to frontend
      },
      replies
    });

  } catch (error) {
    console.error('Error fetching confession:', error);
    res.status(500).json({ error: { message: 'Failed to fetch confession' } });
  }
});

/**
 * DELETE /api/confessions/:id
 * Delete a confession (if owner)
 */

router.delete('/:id', optionalProtect, async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);

    if (!confession) {
      return res.status(404).json({ error: { message: 'Confession not found' } });
    }

    let isOwner = false;

    // Check ownership
    // 1. If logged in user matches userId
    if (req.user && confession.userId && confession.userId.toString() === req.user._id.toString()) {
      isOwner = true;
    }
    // 2. If device hash matches (for anonymous or mixed usage)
    else if (confession.deviceHash === generateDeviceHash(req)) {
      isOwner = true;
    }

    if (!isOwner) {
      return res.status(403).json({ error: { message: 'You are not authorized to delete this confession' } });
    }

    await confession.deleteOne();

    res.json({ success: true, message: 'Confession deleted successfully' });
  } catch (error) {
    console.error('Error deleting confession:', error);
    res.status(500).json({ error: { message: 'Failed to delete confession' } });
  }
});

module.exports = router;
