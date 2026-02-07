const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        select: false // Don't return password by default
    },
    googleId: {
        type: String,
        select: false
    },
    avatar: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    resetPasswordToken: {
        type: String,
        select: false // Don't include in queries by default
    },
    resetPasswordExpires: {
        type: Date,
        select: false // Don't include in queries by default
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index googleId for OAuth lookups
userSchema.index({ googleId: 1 });

// Index resetPasswordToken for efficient reset token lookups
userSchema.index({ resetPasswordToken: 1 });

// Method to generate and hash password reset token
userSchema.methods.getResetPasswordToken = function() {
    // Generate cryptographically secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire time (30 minutes)
    this.resetPasswordExpires = Date.now() + 30 * 60 * 1000;

    // Return unhashed token (to send in email)
    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
