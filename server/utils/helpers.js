const crypto = require('crypto');

/**
 * Generate anonymous device hash from request
 * Uses IP + User-Agent to create unique identifier
 */
function generateDeviceHash(req) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const secret = process.env.DEVICE_HASH_SECRET || 'default-secret';

  const data = `${ip}-${userAgent}`;
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * Calculate expiration date (24 hours from now)
 */
function getExpirationDate() {
  const hours = parseInt(process.env.CONFESSION_EXPIRY_HOURS) || 24;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
  return expiresAt;
}

/**
 * Calculate hours remaining until expiration
 */
function getHoursRemaining(expiresAt) {
  const now = new Date();
  const diffMs = expiresAt - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return 'Soon';
  }
}

const validator = require('validator');

/**
 * Sanitize text content
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Escape HTML to prevent XSS
  // This converts <, >, &, ", and ' to their HTML identities
  let sanitized = validator.escape(text);

  // Convert basic formatting back if needed (optional, but keeping it strict for now)
  // For now, we'll keep it strictly escaped for maximum security

  return sanitized
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, 500);
}

module.exports = {
  generateDeviceHash,
  getExpirationDate,
  getHoursRemaining,
  sanitizeText
};
