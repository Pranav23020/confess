const Filter = require('bad-words');
const filter = new Filter();

// Add custom words if needed
// filter.addWords('customword1', 'customword2');

/**
 * Check if text contains profanity
 */
function containsProfanity(text) {
  return filter.isProfane(text);
}

/**
 * Clean profanity from text (optional - for now we just reject)
 */
function cleanText(text) {
  return filter.clean(text);
}

/**
 * Validate confession text
 */
function validateConfessionText(text) {
  const errors = [];
  
  if (!text || typeof text !== 'string') {
    errors.push('Text is required');
  } else {
    const trimmed = text.trim();
    
    if (trimmed.length < 10) {
      errors.push('Confession must be at least 10 characters');
    }
    
    if (trimmed.length > 500) {
      errors.push('Confession must be less than 500 characters');
    }
    
    if (containsProfanity(trimmed)) {
      errors.push('Please keep language respectful');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate reply text
 */
function validateReplyText(text) {
  const errors = [];
  
  if (!text || typeof text !== 'string') {
    errors.push('Text is required');
  } else {
    const trimmed = text.trim();
    
    if (trimmed.length < 1) {
      errors.push('Reply cannot be empty');
    }
    
    if (trimmed.length > 300) {
      errors.push('Reply must be less than 300 characters');
    }
    
    if (containsProfanity(trimmed)) {
      errors.push('Please keep language respectful');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  containsProfanity,
  cleanText,
  validateConfessionText,
  validateReplyText
};
