const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Setup JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use';
const JWT_EXPIRE = '30d';

// Generate Token
const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
        expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
        ),
        httpOnly: true, // Secure against XSS
        secure: isProduction, // HTTPS only in production
        sameSite: isProduction ? 'None' : 'Lax', // Allow cross-site cookies in production
        domain: isProduction ? '.onrender.com' : undefined // Set domain for subdomain access
    };

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
        const { username, email, password } = req.body;

        // Create user
        // Note: In a real app, hash password here. 
        // Usually models handle pre-save hashing, but let's do it manually for explicit control if model doesn't

        // We didn't add pre-save hook in model artifact, so let's hash here
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: passwordHash,
            avatar: `https://ui-avatars.com/api/?name=${username}&background=random`
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, error: err.message });
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
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        const token = jwt.sign({ id: req.user._id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRE
        });

        // Set cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: isProduction, // HTTPS only in production
            sameSite: isProduction ? 'None' : 'Lax', // 'None' for cross-site in production
            domain: isProduction ? '.onrender.com' : undefined // Set domain for subdomain access
        });

        // Redirect to frontend with oauth flag to trigger refetch
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendURL}/?oauth=true`);
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
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'None' : 'Lax',
        domain: isProduction ? '.onrender.com' : undefined
    });
    res.status(200).json({ success: true, data: {} });
});

module.exports = router;
