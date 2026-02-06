/**
 * Extract hashtags from text
 * Returns array of hashtags (without # symbol, lowercase)
 */
const extractHashtags = (text) => {
  if (!text) return [];
  
  // Match hashtags: # followed by letters, numbers, underscores
  const matches = text.match(/#[\w]+/gi);
  
  if (!matches) return [];
  
  // Remove # and convert to lowercase, remove duplicates
  const hashtags = [...new Set(
    matches.map(tag => tag.substring(1).toLowerCase()).filter(tag => tag.length > 0)
  )];
  
  return hashtags;
};

/**
 * Validate hashtag format
 */
const isValidHashtag = (tag) => {
  // Hashtag should be 1-30 characters, alphanumeric + underscore
  return /^[\w]{1,30}$/.test(tag.toLowerCase());
};

/**
 * Calculate hashtag trending score
 * Based on: views, likes, recency
 */
const calculateHashtagScore = (confession) => {
  const ageInHours = (Date.now() - confession.createdAt.getTime()) / (1000 * 60 * 60);
  const ageFactor = Math.max(1, 48 - ageInHours); // Decay after 48 hours
  
  const viewScore = confession.hashtagViews.length || 0;
  const likeScore = confession.likeCount * 2;
  const recencyFactor = 1 / (1 + ageInHours / 12); // Higher for recent posts
  
  return (viewScore + likeScore) * recencyFactor;
};

/**
 * Get trending hashtags
 * Returns top hashtags by engagement
 */
const getTrendingHashtags = async (Confession, limit = 10) => {
  try {
    const allConfessions = await Confession.find({
      isPublished: true,
      isHidden: false,
      expiresAt: { $gt: new Date() },
      hashtags: { $exists: true, $ne: [] }
    })
    .select('hashtags likeCount hashtagViews createdAt')
    .lean();

    const hashtagStats = {};

    // Aggregate hashtag stats
    allConfessions.forEach(confession => {
      confession.hashtags.forEach(tag => {
        if (!hashtagStats[tag]) {
          hashtagStats[tag] = {
            count: 0,
            views: 0,
            likes: 0,
            score: 0
          };
        }
        hashtagStats[tag].count += 1;
        hashtagStats[tag].views += confession.hashtagViews.length || 0;
        hashtagStats[tag].likes += confession.likeCount || 0;
        hashtagStats[tag].score += calculateHashtagScore(confession);
      });
    });

    // Convert to array and sort by score
    const trending = Object.entries(hashtagStats)
      .map(([tag, stats]) => ({
        tag,
        ...stats,
        score: Math.round(stats.score)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return trending;
  } catch (error) {
    console.error('Error getting trending hashtags:', error);
    return [];
  }
};

/**
 * Get confessions by hashtag
 */
const getConfessionsByHashtag = async (Confession, hashtag, limit = 20, skip = 0) => {
  try {
    const confessions = await Confession.find({
      hashtags: hashtag.toLowerCase(),
      isPublished: true,
      isHidden: false,
      expiresAt: { $gt: new Date() }
    })
    .select('text category deviceHash userId likeCount replyCount createdAt hashtags images')
    .sort({ likeCount: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'username avatar')
    .lean();

    return confessions;
  } catch (error) {
    console.error('Error getting confessions by hashtag:', error);
    return [];
  }
};

/**
 * Get recommended confessions based on user's liked hashtags
 * Personalized feed similar to Instagram Reels
 */
const getRecommendedConfessions = async (Confession, userLikedHashtags, limit = 20, skip = 0, excludeIds = []) => {
  try {
    if (!userLikedHashtags || userLikedHashtags.length === 0) {
      // If no liked hashtags, get popular confessions
      const popular = await Confession.find({
        isPublished: true,
        isHidden: false,
        expiresAt: { $gt: new Date() },
        _id: { $nin: excludeIds }
      })
      .select('text category deviceHash userId likeCount replyCount createdAt hashtags images')
      .sort({ likeCount: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'username avatar')
      .lean();

      return popular;
    }

    // Find confessions with matching hashtags, prioritize by engagement
    const recommended = await Confession.aggregate([
      {
        $match: {
          isPublished: true,
          isHidden: false,
          expiresAt: { $gt: new Date() },
          hashtags: { $in: userLikedHashtags },
          _id: { $nin: excludeIds }
        }
      },
      {
        $addFields: {
          // Score based on hashtag matches and engagement
          score: {
            $add: [
              { $multiply: [{ $size: { $filter: { input: '$hashtags', as: 'tag', cond: { $in: ['$$tag', userLikedHashtags] } } } }, 10] },
              { $multiply: ['$likeCount', 2] },
              { $multiply: ['$replyCount', 1] }
            ]
          }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          text: 1,
          category: 1,
          deviceHash: 1,
          userId: 1,
          likeCount: 1,
          replyCount: 1,
          createdAt: 1,
          hashtags: 1,
          images: 1
        }
      }
    ]);

    // Populate user data
    const populatedRecommended = await Confession.populate(recommended, {
      path: 'userId',
      select: 'username avatar'
    });

    return populatedRecommended;
  } catch (error) {
    console.error('Error getting recommended confessions:', error);
    return [];
  }
};

/**
 * Track hashtag view
 * Called when user views/interacts with a confession
 */
const trackHashtagView = async (Confession, confessionId, deviceHash) => {
  try {
    await Confession.updateOne(
      { _id: confessionId },
      {
        $addToSet: {
          hashtagViews: deviceHash
        }
      }
    );
  } catch (error) {
    console.error('Error tracking hashtag view:', error);
  }
};

module.exports = {
  extractHashtags,
  isValidHashtag,
  calculateHashtagScore,
  getTrendingHashtags,
  getConfessionsByHashtag,
  getRecommendedConfessions,
  trackHashtagView
};
