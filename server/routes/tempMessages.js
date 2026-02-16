const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const { v4: uuidv4 } = require('uuid');
const messageStore = require('../utils/messageStore');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Rate limiter: 5 requests per 10 minutes
const sendLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            message: 'Too many messages sent from this IP, please try again after 10 minutes.'
        }
    }
});

/**
 * POST /api/temp-message/send
 * Public route to send an anonymous message
 */
router.post('/send', sendLimiter, async (req, res) => {
    try {
        const { receiver_username, message } = req.body;

        // 1. Basic Validation
        if (!receiver_username || !message) {
            return res.status(400).json({ error: { message: 'Username and message are required' } });
        }

        const trimmedMessage = message.trim();
        if (trimmedMessage.length < 5) {
            return res.status(400).json({ error: { message: 'Message must be at least 5 characters long' } });
        }
        if (trimmedMessage.length > 500) {
            return res.status(400).json({ error: { message: 'Message cannot exceed 500 characters' } });
        }

        // 2. Validate Receiver Exists
        const receiver = await User.findOne({ username: receiver_username.toLowerCase() });
        if (!receiver) {
            return res.status(404).json({ error: { message: 'User not found' } });
        }

        // 3. Sanitize
        const cleanMessage = sanitizeHtml(trimmedMessage, {
            allowedTags: [], // No tags allowed
            allowedAttributes: {}
        });

        // 4. Hash IP
        const ip = req.ip || req.connection.remoteAddress;
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        // 5. Create Message Object
        const now = Date.now();
        const newMessage = {
            id: uuidv4(),
            receiver_username: receiver.username, // Store lowercase username
            message: cleanMessage,
            created_at: now,
            expires_at: now + (72 * 60 * 60 * 1000), // 72 hours
            ip_hash: ipHash,
            is_read: false
        };

        // 6. Save to JSON store
        messageStore.addMessage(newMessage);

        res.status(201).json({
            success: true,
            message: 'Message sent successfully. It will disappear in 72 hours.'
        });

    } catch (error) {
        console.error('Error sending anonymous message:', error);
        res.status(500).json({ error: { message: 'Server error sending message' } });
    }
});

/**
 * GET /api/temp-message/inbox
 * Private route to get messages for the logged-in user
 */
router.get('/inbox', protect, (req, res) => {
    try {
        // req.user is set by protect middleware
        const username = req.user.username;
        const messages = messageStore.getMessagesForUser(username);

        res.json({
            success: true,
            messages: messages.map(m => ({
                id: m.id,
                message: m.message,
                created_at: m.created_at,
                expires_at: m.expires_at,
                // Do not return ip_hash to frontend
            }))
        });
    } catch (error) {
        console.error('Error fetching inbox:', error);
        res.status(500).json({ error: { message: 'Failed to fetch messages' } });
    }
});

/**
 * DELETE /api/temp-message/:id
 * Private route to delete a specific message
 */
router.delete('/:id', protect, (req, res) => {
    try {
        const messageId = req.params.id;
        const username = req.user.username;

        const deleted = messageStore.deleteMessage(messageId, username);

        if (deleted) {
            res.json({ success: true, message: 'Message deleted' });
        } else {
            res.status(404).json({ error: { message: 'Message not found or unauthorized' } });
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: { message: 'Failed to delete message' } });
    }
});

module.exports = router;
