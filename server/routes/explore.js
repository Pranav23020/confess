const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const BlockedKeyword = require('../models/BlockedKeyword');
const { generateDeviceHash, getHoursRemaining } = require('../utils/helpers');

/**
 * GET /api/explore/search
 * Search confessions by keywords
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, sortBy = 'recent', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const deviceHash = generateDeviceHash(req);

    // Get user's blocked keywords
    const blockedKeywords = await BlockedKeyword.find({ deviceHash }).select('keyword');
    const blockedWords = blockedKeywords.map(k => k.keyword);

    let query = {
      expiresAt: { $gt: new Date() },
      isHidden: false,
      isPublished: true
    };

    // Add search query
    if (q && q.trim()) {
      query.$text = { $search: q };
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Exclude blocked keywords
    if (blockedWords.length > 0) {
      query.text = { $not: { $regex: blockedWords.join('|'), $options: 'i' } };
    }

    // Sort options
    let sort = {};
    switch (sortBy) {
      case 'likes':
        sort = { likeCount: -1, createdAt: -1 };
        break;
      case 'replies':
        sort = { replyCount: -1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sort = { createdAt: -1 };
    }

    const confessions = await Confession.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .select('-deviceHash')
      .lean();

    const confessionsWithTime = confessions.map(confession => ({
      ...confession,
      hoursRemaining: getHoursRemaining(confession.expiresAt)
    }));

    const total = await Confession.countDocuments(query);

    res.json({
      success: true,
      confessions: confessionsWithTime,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching confessions:', error);
    res.status(500).json({ error: { message: 'Failed to search confessions' } });
  }
});

/**
 * GET /api/explore/trending
 * Get trending confessions (high engagement in last 6 hours)
 */
router.get('/trending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const deviceHash = generateDeviceHash(req);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    // Get blocked keywords
    const blockedKeywords = await BlockedKeyword.find({ deviceHash }).select('keyword');
    const blockedWords = blockedKeywords.map(k => k.keyword);

    let query = {
      createdAt: { $gte: sixHoursAgo },
      expiresAt: { $gt: new Date() },
      isHidden: false,
      isPublished: true
    };

    // Exclude blocked keywords
    if (blockedWords.length > 0) {
      query.text = { $not: { $regex: blockedWords.join('|'), $options: 'i' } };
    }

    const confessions = await Confession.find(query)
      .sort({ likeCount: -1, replyCount: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-deviceHash')
      .lean();

    const confessionsWithTime = confessions.map(confession => ({
      ...confession,
      hoursRemaining: getHoursRemaining(confession.expiresAt),
      trendingScore: (confession.likeCount * 2) + (confession.replyCount * 3)
    }));

    const total = await Confession.countDocuments(query);

    res.json({
      success: true,
      confessions: confessionsWithTime,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching trending confessions:', error);
    res.status(500).json({ error: { message: 'Failed to fetch trending confessions' } });
  }
});

const redis = require('../utils/redis');
const { isRedisConnected } = require('../utils/redis');

/**
 * GET /api/explore/top-today
 * Get top confessions today by likes or replies
 */
router.get('/top-today', async (req, res) => {
  try {
    const { type = 'likes', limit = 5 } = req.query;
    const deviceHash = generateDeviceHash(req);

    // Try to get from cache first (unique by type and limit)
    const cacheKey = `top-today:${type}:${limit}`;
    if (isRedisConnected()) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            confessions: JSON.parse(cachedData),
            fromCache: true
          });
        }
      } catch (redisErr) {
        console.warn('Redis read error:', redisErr);
      }
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const blockedKeywords = await BlockedKeyword.find({ deviceHash }).select('keyword');
    const blockedWords = blockedKeywords.map(k => k.keyword);

    let query = {
      createdAt: { $gte: today },
      expiresAt: { $gt: now },
      isHidden: false,
      isPublished: true
    };

    if (blockedWords.length > 0) {
      query.text = { $not: { $regex: blockedWords.join('|'), $options: 'i' } };
    }

    const sort = type === 'replies'
      ? { replyCount: -1, likeCount: -1, createdAt: -1 }
      : { likeCount: -1, replyCount: -1, createdAt: -1 };

    const confessions = await Confession.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .select('-deviceHash')
      .lean();

    const confessionsWithTime = confessions.map(confession => ({
      ...confession,
      hoursRemaining: getHoursRemaining(confession.expiresAt)
    }));

    // Cache the result for 10 minutes (600 seconds)
    if (isRedisConnected()) {
      try {
        await redis.set(cacheKey, JSON.stringify(confessionsWithTime), 'EX', 600);
      } catch (redisErr) {
        console.warn('Redis write error:', redisErr);
      }
    }

    res.json({
      success: true,
      confessions: confessionsWithTime
    });
  } catch (error) {
    console.error('Error fetching top today confessions:', error);
    res.status(500).json({ error: { message: 'Failed to fetch top today confessions' } });
  }
});

/**
 * GET /api/explore/confession-of-the-day
 * Get the confession of the day (most engaged in last 24h)
 */
router.get('/confession-of-the-day', async (req, res) => {
  try {
    const cacheKey = 'confession-of-the-day';
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json({
          success: true,
          confession: JSON.parse(cachedData),
          fromCache: true
        });
      }
    } catch (redisErr) {
      console.warn('Redis read error:', redisErr);
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const confession = await Confession.findOne({
      createdAt: { $gte: oneDayAgo },
      expiresAt: { $gt: new Date() },
      isHidden: false,
      isPublished: true
    })
      .sort({ likeCount: -1, replyCount: -1 })
      .select('-deviceHash')
      .lean();

    if (!confession) {
      return res.status(404).json({ error: { message: 'No confession of the day yet' } });
    }

    const confessionWithTime = {
      ...confession,
      hoursRemaining: getHoursRemaining(confession.expiresAt)
    };

    // Cache for 1 hour
    try {
      await redis.set(cacheKey, JSON.stringify(confessionWithTime), 'EX', 3600);
    } catch (redisErr) {
      console.warn('Redis write error:', redisErr);
    }

    res.json({
      success: true,
      confession: confessionWithTime
    });
  } catch (error) {
    console.error('Error fetching confession of the day:', error);
    res.status(500).json({ error: { message: 'Failed to fetch confession of the day' } });
  }
});

/**
 * GET /api/explore/stats
 * Get global confession stats
 */
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'global-stats';
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json({
          success: true,
          stats: JSON.parse(cachedData),
          fromCache: true
        });
      }
    } catch (redisErr) {
      console.warn('Redis read error:', redisErr);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalActive, todayCount, weekCount, categoryStats, hourlyStats] = await Promise.all([
      Confession.countDocuments({
        expiresAt: { $gt: now },
        isHidden: false,
        isPublished: true
      }),
      Confession.countDocuments({
        createdAt: { $gte: today },
        isPublished: true
      }),
      Confession.countDocuments({
        createdAt: { $gte: thisWeek },
        isPublished: true
      }),
      Confession.aggregate([
        {
          $match: {
            expiresAt: { $gt: now },
            isHidden: false,
            isPublished: true
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]),
      Confession.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            isPublished: true
          }
        },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
    ]);

    // Find busiest hour
    const busiestHour = hourlyStats.reduce((max, hour) =>
      hour.count > (max.count || 0) ? hour : max, { _id: 0, count: 0 }
    );

    const stats = {
      totalActive,
      todayCount,
      weekCount,
      categoryStats: categoryStats.map(c => ({
        category: c._id,
        count: c.count
      })),
      busiestHour: busiestHour._id,
      hourlyDistribution: hourlyStats
    };

    // Cache for 10 minutes
    try {
      await redis.set(cacheKey, JSON.stringify(stats), 'EX', 600);
    } catch (redisErr) {
      console.warn('Redis write error:', redisErr);
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: { message: 'Failed to fetch stats' } });
  }
});

/**
 * GET /api/explore/categories
 * Get confessions by category
 */
router.get('/categories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const deviceHash = generateDeviceHash(req);

    // Get blocked keywords
    const blockedKeywords = await BlockedKeyword.find({ deviceHash }).select('keyword');
    const blockedWords = blockedKeywords.map(k => k.keyword);

    let query = {
      category,
      expiresAt: { $gt: new Date() },
      isHidden: false,
      isPublished: true
    };

    // Exclude blocked keywords
    if (blockedWords.length > 0) {
      query.text = { $not: { $regex: blockedWords.join('|'), $options: 'i' } };
    }

    const confessions = await Confession.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-deviceHash')
      .lean();

    const confessionsWithTime = confessions.map(confession => ({
      ...confession,
      hoursRemaining: getHoursRemaining(confession.expiresAt)
    }));

    const total = await Confession.countDocuments(query);

    res.json({
      success: true,
      confessions: confessionsWithTime,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching category confessions:', error);
    res.status(500).json({ error: { message: 'Failed to fetch confessions' } });
  }
});

module.exports = router;
