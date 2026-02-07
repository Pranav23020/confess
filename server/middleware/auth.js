const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    // 1. Get token from cookies or Authorization header
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Enhanced logging for production debugging
    console.log(`[AUTH] ${req.method} ${req.path}`);
    console.log('[AUTH] Token from cookie:', req.cookies?.token ? `${req.cookies.token.substring(0, 20)}...` : 'MISSING');
    console.log('[AUTH] Token available:', !!token);

    // 2. Check if token exists
    if (!token) {
        console.log('[AUTH] ❌ No token provided - returning 401');
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }

    try {
        // 3. Verify token
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_do_not_use';
        console.log('[AUTH] JWT_SECRET available:', !!process.env.JWT_SECRET);
        const decoded = jwt.verify(token, jwtSecret);
        console.log('[AUTH] ✅ Token verified, user ID:', decoded.id);

        // 4. Attach user to request
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            console.log('[AUTH] ❌ User not found in database');
            return res.status(401).json({
                success: false,
                error: 'User no longer exists'
            });
        }

        console.log('[AUTH] ✅ User attached:', req.user.email);
        next();
    } catch (err) {
        console.log('[AUTH] ❌ Token verification failed:', err.message);
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }
};

exports.optionalProtect = async (req, res, next) => {
    let token;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_do_not_use');
        req.user = await User.findById(decoded.id);
        next();
    } catch (err) {
        // Token invalid/expired - just proceed as anonymous
        next();
    }
};
