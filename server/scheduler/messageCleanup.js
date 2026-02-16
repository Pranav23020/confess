const cron = require('node-cron');
const messageStore = require('../utils/messageStore');

const startCleanupJob = () => {
    // Ensure storage is initialized
    messageStore.init();

    // Run every hour at minute 0
    cron.schedule('0 * * * *', () => {
        console.log('⏰ Running scheduled anonymous message cleanup...');
        try {
            const count = messageStore.cleanupExpired();
            if (count > 0) {
                console.log(`✅ Cleanup complete: Removed ${count} expired messages.`);
            }
        } catch (error) {
            console.error('❌ Error during message cleanup:', error);
        }
    });

    // Also run once on startup to clear any old data
    setTimeout(() => {
        console.log('🚀 Running initial message cleanup on startup...');
        try {
            messageStore.cleanupExpired();
        } catch (error) {
            console.error('❌ Error during initial message cleanup:', error);
        }
    }, 5000);
};

module.exports = startCleanupJob;
