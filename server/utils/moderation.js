const { google } = require('googleapis');

/**
 * PII Detection Patterns
 */
const PII_PATTERNS = {
    // Mobile/Phone: Matches standard international and local formats
    PHONE: /(\+?\d{1,4}[\s.-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g,

    // Email: Matches standard email addresses
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

    // Indian Addresses (Simplified pattern)
    ADDRESS: /(?:Floor|Flat|House|No|Sector|Phase|Gali|Street|Road|Nagar|Colony|Enclave|Apt|Apartment)\s+[^,. \n]+(?:[\s,]+[^,. \n]+){1,5}/gi
};

const TOXIC_KEYWORDS = [
    'hate', 'stupid', 'r@pe', 'kill', 'suicide', 'die', 'murder',
    'threat', 'bomb', 'terror', 'offensive', 'abusive'
];

/**
 * Mask PII in text
 */
function maskPII(text) {
    if (!text) return text;
    let maskedText = text;

    maskedText = maskedText.replace(PII_PATTERNS.EMAIL, '[email hidden]');
    maskedText = maskedText.replace(PII_PATTERNS.PHONE, '[phone hidden]');
    maskedText = maskedText.replace(PII_PATTERNS.ADDRESS, '[location hidden]');

    return maskedText;
}

/**
 * Perspective API Integration with Local Fallback
 */
async function analyzeToxicity(text) {
    const API_KEY = process.env.PERSPECTIVE_API_KEY;

    // Local Fallback Check
    const lowerText = text.toLowerCase();
    const foundToxic = TOXIC_KEYWORDS.some(word => lowerText.includes(word));

    if (!API_KEY) {
        return {
            isToxic: foundToxic,
            score: foundToxic ? 0.8 : 0,
            method: 'local'
        };
    }

    try {
        const client = await google.discoverAPI(
            'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1'
        );

        const res = await client.comments.analyze({
            key: API_KEY,
            resource: {
                comment: { text },
                languages: ['en'],
                requestedAttributes: { TOXICITY: {} }
            }
        });

        const score = res.data.attributeScores.TOXICITY.summaryScore.value;
        return {
            isToxic: score > 0.7,
            score,
            method: 'ai'
        };
    } catch (err) {
        console.error('Perspective API error:', err);
        return {
            isToxic: foundToxic,
            score: foundToxic ? 0.8 : 0,
            method: 'fallback'
        };
    }
}

module.exports = {
    maskPII,
    analyzeToxicity
};
