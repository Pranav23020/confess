const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const TempMessage = require('../models/TempMessage');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Rate limiter: 5 requests per 10 minutes per IP
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

        // 4. Hash IP for security (stored but never exposed)
        const ip = req.ip || req.connection.remoteAddress;
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        // 5. Create and save message to MongoDB
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // 72 hours

        const newMessage = new TempMessage({
            receiver_username: receiver.username,
            message: cleanMessage,
            ip_hash: ipHash,
            is_read: false,
            created_at: now,
            expires_at: expiresAt
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully. It will automatically disappear in 72 hours.'
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
router.get('/inbox', protect, async (req, res) => {
    try {
        const username = req.user.username;

        // Find all non-expired messages for this user
        // MongoDB TTL index will auto-delete expired ones, but we filter just in case
        const messages = await TempMessage.find({
            receiver_username: username,
            expires_at: { $gt: new Date() }
        })
            .sort({ created_at: -1 }) // Newest first
            .select('-ip_hash') // Never return IP hash
            .lean();

        res.json({
            success: true,
            messages: messages.map(m => ({
                id: m._id.toString(),
                message: m.message,
                created_at: m.created_at.getTime(),
                expires_at: m.expires_at.getTime(),
                is_read: m.is_read
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
router.delete('/:id', protect, async (req, res) => {
    try {
        const messageId = req.params.id;
        const username = req.user.username;

        // Delete only if the message belongs to the logged-in user
        const result = await TempMessage.deleteOne({
            _id: messageId,
            receiver_username: username
        });

        if (result.deletedCount > 0) {
            res.json({ success: true, message: 'Message deleted' });
        } else {
            res.status(404).json({ error: { message: 'Message not found or unauthorized' } });
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: { message: 'Failed to delete message' } });
    }
});

/**
 * PUT /api/temp-message/:id/reply
 * Private route to reply to a specific message
 */
router.put('/:id/reply', protect, async (req, res) => {
    try {
        const messageId = req.params.id;
        const username = req.user.username;
        const { reply } = req.body;

        // Validation
        if (!reply || typeof reply !== 'string') {
            return res.status(400).json({ error: { message: 'Reply text is required' } });
        }

        const trimmedReply = reply.trim();
        if (trimmedReply.length < 1) {
            return res.status(400).json({ error: { message: 'Reply cannot be empty' } });
        }
        if (trimmedReply.length > 500) {
            return res.status(400).json({ error: { message: 'Reply cannot exceed 500 characters' } });
        }

        // Sanitize reply
        const cleanReply = sanitizeHtml(trimmedReply, {
            allowedTags: [],
            allowedAttributes: {}
        });

        // Update the message with reply
        const message = await TempMessage.findOneAndUpdate(
            {
                _id: messageId,
                receiver_username: username
            },
            {
                $set: {
                    reply: cleanReply,
                    replied_at: new Date()
                }
            },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ error: { message: 'Message not found or unauthorized' } });
        }

        res.json({
            success: true,
            message: 'Reply saved successfully',
            data: {
                id: message._id.toString(),
                reply: message.reply,
                replied_at: message.replied_at.getTime()
            }
        });

    } catch (error) {
        console.error('Error replying to message:', error);
        res.status(500).json({ error: { message: 'Failed to save reply' } });
    }
});

module.exports = router;

