const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const Like = require('../models/Like');
const { protect } = require('../middleware/auth');
const { generateDeviceHash } = require('../utils/helpers');
const {
  getTrendingHashtags,
  getConfessionsByHashtag,
  getRecommendedConfessions,
  trackHashtagView
} = require('../utils/hashtagHelpers');

/**
 * GET /api/hashtags/trending
 * Get trending hashtags
 * @access Public
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const trending = await getTrendingHashtags(Confession, limit);

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending hashtags'
    });
  }
});

/**
 * GET /api/hashtags/search
 * Search confessions by hashtag
 * @access Public
 */
router.get('/search', async (req, res) => {
  try {
    const { tag, page = 1, limit = 20 } = req.query;

    if (!tag || tag.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Hashtag is required'
      });
    }

    const skip = (page - 1) * limit;
    const hashtag = tag.toLowerCase().replace(/^#/, '');

    const confessions = await getConfessionsByHashtag(Confession, hashtag, limit, skip);
    const total = await Confession.countDocuments({
      hashtags: hashtag,
      isPublished: true,
      isHidden: false,
      expiresAt: { $gt: new Date() }
    });

    res.json({
      success: true,
      data: confessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching hashtags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search hashtags'
    });
  }
});

/**
 * GET /api/hashtags/recommended
 * Get recommended confessions based on user's interaction
 * Similar to Instagram Reels algorithm
 * @access Public
 */
router.get('/recommended', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const deviceHash = generateDeviceHash(req);
    const skip = (page - 1) * limit;

    // Get user's liked hashtags
    let userLikedHashtags = [];
    
    if (req.user) {
      // For authenticated users, get their liked confessions' hashtags
      const likedConfessions = await Like.find({ userId: req.user.id })
        .select('confessionId')
        .populate('confessionId', 'hashtags')
        .lean();

      const allHashtags = likedConfessions
        .flatMap(like => like.confessionId?.hashtags || []);

      // Get top hashtags the user has interacted with
      const hashtagCounts = {};
      allHashtags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });

      userLikedHashtags = Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);
    } else {
      // For anonymous users, get trending hashtags
      const trending = await getTrendingHashtags(Confession, 5);
      userLikedHashtags = trending.map(t => t.tag);
    }

    const confessions = await getRecommendedConfessions(
      Confession,
      userLikedHashtags,
      limit,
      skip
    );

    res.json({
      success: true,
      data: confessions,
      userInterests: userLikedHashtags
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

/**
 * POST /api/hashtags/track-view
 * Track when user views a confession with specific hashtags
 * Used for the algorithm to understand user interests
 * @access Public
 */
router.post('/track-view', async (req, res) => {
  try {
    const { confessionId } = req.body;

    if (!confessionId) {
      return res.status(400).json({
        success: false,
        error: 'Confession ID is required'
      });
    }

    const deviceHash = generateDeviceHash(req);
    await trackHashtagView(Confession, confessionId, deviceHash);

    res.json({
      success: true,
      message: 'View tracked'
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track view'
    });
  }
});

/**
 * GET /api/hashtags
 * Get hashtags from a confession or search
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchTerm = search.toLowerCase().replace(/^#/, '');

    // Get hashtags matching search term
    const matching = await Confession.aggregate([
      {
        $match: {
          hashtags: { $regex: searchTerm, $options: 'i' },
          isPublished: true,
          isHidden: false,
          expiresAt: { $gt: new Date() }
        }
      },
      {
        $unwind: '$hashtags'
      },
      {
        $match: {
          hashtags: { $regex: searchTerm, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const hashtags = matching.map(item => ({
      tag: item._id,
      count: item.count
    }));

    res.json({
      success: true,
      data: hashtags
    });
  } catch (error) {
    console.error('Error fetching hashtags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hashtags'
    });
  }
});

module.exports = router;
