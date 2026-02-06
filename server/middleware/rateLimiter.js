const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../utils/redis');
const { isRedisConnected } = require('../utils/redis');

// Create Redis store factory - called lazily on first request
const createRedisStore = (prefix) => {
  return () => {
    if (isRedisConnected()) {
      try {
        return new RedisStore({
          // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
          sendCommand: (...args) => redis.call(...args),
          prefix: `rl:${prefix}:`,
        });
      } catch (err) {
        console.warn(`⚠️  Failed to create Redis store for ${prefix}, using memory store:`, err.message);
        return undefined; // Fallback to memory store
      }
    }
    return undefined; // Fallback to memory store - Redis not ready yet
  };
};

// Create limiters with lazy store initialization
let storesInitialized = false;

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: { message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('api')(),
  skipFailedRequests: false,
});

// Confession posting limiter
const confessionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.MAX_CONFESSIONS_PER_DAY) || 5,
  message: { error: { message: 'Daily confession limit reached. Try again tomorrow.' } },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  store: createRedisStore('confession')(),
});

// Reply posting limiter
const replyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.MAX_REPLIES_PER_DAY) || 20,
  message: { error: { message: 'Daily reply limit reached. Try again tomorrow.' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('reply')(),
});

// Report limiter
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: { message: 'Too many reports. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('report')(),
});

// Log store status after a delay
setTimeout(() => {
  if (!storesInitialized && isRedisConnected()) {
    console.log('✅ Rate limiters using Redis store');
    storesInitialized = true;
  } else if (!isRedisConnected()) {
    console.log('⚠️  Rate limiters using memory store (Redis not available)');
  }
}, 2000);

module.exports = {
  apiLimiter,
  confessionLimiter,
  replyLimiter,
  reportLimiter
};
