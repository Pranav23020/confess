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

    // 2. Check if token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_do_not_use');

        // 4. Attach user to request
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User no longer exists'
            });
        }

        next();
    } catch (err) {
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
