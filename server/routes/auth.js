const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/emailService');
const rateLimit = require('express-rate-limit');

// Setup JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use';
const JWT_EXPIRE = '30d';

// Rate limiters for password reset endpoints
// Prevents brute force attacks and abuse
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: 'Too many password reset requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Allow 5 attempts to reset (in case of typos)
    message: 'Too many password reset attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Helper function to get cookie options based on environment
const getCookieOptions = (isProduction = false) => {
    return {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true, // Secure against XSS
        secure: isProduction, // HTTPS only in production
        sameSite: isProduction ? 'None' : 'Lax', // 'None' required for cross-domain in production
        path: '/' // Ensure cookie is available for all paths
    };
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const options = getCookieOptions(isProduction);

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user
        });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, googleId, avatar, displayName } = req.body;

        // Validate username and email
        if (!username || !email) {
            return res.status(400).json({ success: false, error: 'Username and email are required' });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
            return res.status(400).json({ success: false, error: 'Username already taken' });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }

        const userData = {
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            avatar: avatar || `https://ui-avatars.com/api/?name=${username}&background=random`
        };

        // If registering via Google OAuth
        if (googleId) {
            userData.googleId = googleId;
        } else if (password) {
            // If registering with email/password
            const salt = await bcrypt.genSalt(10);
            userData.password = await bcrypt.hash(password, salt);
        } else {
            return res.status(400).json({ success: false, error: 'Password is required for email registration' });
        }

        const user = await User.create(userData);

        sendTokenResponse(user, 201, res);
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// @route   POST /api/auth/check-username
// @desc    Check if username is available
// @access  Public
router.post('/check-username', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.length < 3) {
            return res.status(400).json({ available: false, error: 'Username must be at least 3 characters' });
        }

        const existingUser = await User.findOne({ username: username.toLowerCase() });
        const available = !existingUser;

        res.json({ available, username });
    } catch (err) {
        console.error(err);
        res.status(400).json({ available: false, error: err.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide email and password' });
        }

        // Check for user (include password)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if user has password (might be google-only account)
        if (!user.password) {
            return res.status(400).json({ success: false, error: 'Please login with Google' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @route   GET /api/auth/google
// @desc    Auth with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        try {
            if (!req.user) {
                const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
                return res.redirect(`${frontendURL}/login?error=authentication_failed`);
            }

            // Check if user has _id (existing user) or not (new google user needing registration)
            if (req.user._id) {
                // Existing user - login them
                const token = jwt.sign({ id: req.user._id }, JWT_SECRET, {
                    expiresIn: JWT_EXPIRE
                });

                const isProduction = process.env.NODE_ENV === 'production';
                const cookieOptions = getCookieOptions(isProduction);
                res.cookie('token', token, cookieOptions);

                const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
                res.redirect(`${frontendURL}/?oauth=true`);
            } else {
                // New user - redirect to registration with google data
                const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
                const params = new URLSearchParams({
                    email: req.user.email,
                    displayName: req.user.displayName,
                    googleId: req.user.googleId,
                    avatar: req.user.avatar || ''
                });
                res.redirect(`${frontendURL}/register?${params.toString()}`);
            }
        } catch (err) {
            console.error('Google callback error:', err);
            const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendURL}/login?error=server_error`);
        }
    }
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
});

// @route   GET /api/auth/logout
// @desc    Log user out / clear cookie
// @access  Public
router.get('/logout', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = getCookieOptions(isProduction);
    res.cookie('token', 'none', {
        ...cookieOptions,
        expires: new Date(Date.now() + 10 * 1000)
    });
    res.status(200).json({ success: true, data: {} });
});

// @route   GET /api/auth/debug
// @desc    Debug endpoint to check cookies and headers
// @access  Public
router.get('/debug', (req, res) => {
    res.json({
        cookies: req.cookies,
        authorization: req.headers.authorization ? 'present' : 'missing',
        origin: req.headers.origin,
        host: req.headers.host,
        userAgent: req.headers['user-agent']?.substring(0, 50)
    });
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset email
// @access  Public
// @security Rate limited to prevent abuse
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email format
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }

        // IMPORTANT: Always return the same response regardless of whether user exists
        // This prevents user enumeration attacks
        const genericResponse = {
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link shortly.'
        };

        // Find user (include password field to verify they have a password-based account)
        const user = await User.findOne({ email: email.toLowerCase() })
            .select('+password +resetPasswordToken +resetPasswordExpires');

        // If no user found OR user doesn't have a password (Google-only account)
        // Still return success to prevent enumeration
        if (!user || !user.password) {
            // Add small delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            return res.status(200).json(genericResponse);
        }

        // Generate reset token using the model method
        const resetToken = user.getResetPasswordToken();

        // Save user with reset token and expiry
        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendURL}/reset-password/${resetToken}`;

        // Send email
        const emailSent = await sendPasswordResetEmail({
            email: user.email,
            resetUrl,
            username: user.username
        });

        // Even if email fails, return success for security
        // Log the error internally but don't expose to user
        if (!emailSent) {
            console.error(`Failed to send password reset email to ${user.email}`);
            // In production, you might want to alert admins
        }

        res.status(200).json(genericResponse);
    } catch (error) {
        console.error('Forgot password error:', error);
        
        // If we saved the token but email failed, clean up
        if (error.user) {
            try {
                error.user.resetPasswordToken = undefined;
                error.user.resetPasswordExpires = undefined;
                await error.user.save({ validateBeforeSave: false });
            } catch (cleanupError) {
                console.error('Token cleanup error:', cleanupError);
            }
        }

        // Still return generic success to prevent information leakage
        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link shortly.'
        });
    }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
// @security Rate limited to prevent brute force
router.post('/reset-password/:token', resetPasswordLimiter, async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const { token } = req.params;

        // Validate inputs
        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Please provide password and confirmation'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }

        // Hash the token to match what's stored in database
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user by token and check if token hasn't expired
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() } // Token must not be expired
        }).select('+password +resetPasswordToken +resetPasswordExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token. Please request a new password reset.'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear reset token fields (one-time use)
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Save user with new password
        await user.save();

        // Log successful password reset (for security monitoring)
        console.log(`Password reset successful for user: ${user.email} at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while resetting your password. Please try again.'
        });
    }
});

module.exports = router;
