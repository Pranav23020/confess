const fs = require('fs');
const path = require('path');

// Storage configuration
// Root is two levels up from server/utils
// server/index.js is at root/server/index.js
// This file is at root/server/utils/messageStore.js
// We want root/temp-storage/messages.json
const STORAGE_DIR = path.join(__dirname, '..', '..', 'temp-storage');
const FILE_PATH = path.join(STORAGE_DIR, 'messages.json');

// Ensure storage exists
const ensureStorage = () => {
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
    }
};

const getMessages = () => {
    try {
        ensureStorage();
        const data = fs.readFileSync(FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading messages file:', err);
        return [];
    }
};

const saveMessages = (messages) => {
    try {
        ensureStorage();
        fs.writeFileSync(FILE_PATH, JSON.stringify(messages, null, 2));
    } catch (err) {
        console.error('Error writing messages file:', err);
    }
};

module.exports = {
    addMessage: (msg) => {
        const messages = getMessages();
        messages.push(msg);
        saveMessages(messages);
        return msg;
    },

    getMessagesForUser: (username) => {
        const messages = getMessages();
        const now = Date.now();
        // Return non-expired messages for the user
        // Also perform a lazy cleanup check if needed, but we have a cron job for that
        return messages
            .filter(m => m.receiver_username === username && m.expires_at > now)
            .sort((a, b) => b.created_at - a.created_at); // Newest first
    },

    deleteMessage: (id, username) => {
        let messages = getMessages();
        const initialLength = messages.length;
        // Keep messages that are NOT (matching ID AND matching receiver)
        messages = messages.filter(m => !(m.id === id && m.receiver_username === username));

        if (messages.length !== initialLength) {
            saveMessages(messages);
            return true;
        }
        return false;
    },

    cleanupExpired: () => {
        const messages = getMessages();
        const now = Date.now();
        const validMessages = messages.filter(m => m.expires_at > now);

        if (validMessages.length !== messages.length) {
            const expiredCount = messages.length - validMessages.length;
            saveMessages(validMessages);
            console.log(`🧹 Cleaned up ${expiredCount} expired anonymous messages`);
            return expiredCount;
        }
        return 0;
    },

    // Initialize storage
    init: () => {
        ensureStorage();
    }
};
