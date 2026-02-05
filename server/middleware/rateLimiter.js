const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: { message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Confession posting limiter
const confessionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.MAX_CONFESSIONS_PER_DAY) || 5,
  message: { error: { message: 'Daily confession limit reached. Try again tomorrow.' } },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Reply posting limiter
const replyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.MAX_REPLIES_PER_DAY) || 20,
  message: { error: { message: 'Daily reply limit reached. Try again tomorrow.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Report limiter
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: { message: 'Too many reports. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  confessionLimiter,
  replyLimiter,
  reportLimiter
};
