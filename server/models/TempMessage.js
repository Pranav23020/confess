const mongoose = require('mongoose');

const tempMessageSchema = new mongoose.Schema({
    receiver_username: {
        type: String,
        required: true,
        lowercase: true,
        index: true // For fast queries by username
    },
    message: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 500
    },
    ip_hash: {
        type: String,
        required: true,
        select: false // Don't return in queries by default
    },
    is_read: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    expires_at: {
        type: Date,
        required: true,
        index: true // For TTL index
    },
    reply: {
        type: String,
        maxlength: 500,
        default: null
    },
    replied_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: false // We're using custom created_at
});

// TTL Index - MongoDB automatically deletes documents when expires_at is reached
tempMessageSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Virtual for time remaining
tempMessageSchema.virtual('hoursRemaining').get(function () {
    const now = Date.now();
    const diff = this.expires_at - now;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
});

module.exports = mongoose.model('TempMessage', tempMessageSchema);
