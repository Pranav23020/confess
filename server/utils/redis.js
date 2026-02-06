const Redis = require('ioredis');

let redis;
let isConnected = false;

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => {
        const delay = Math.min(times * 200, 5000);
        console.log(`⏳ Redis retry attempt ${times}, waiting ${delay}ms...`);
        
        // Keep retrying with exponential backoff
        if (times > 50) {
            console.error('❌ Redis connection failed after 50 attempts. Giving up.');
            return null;
        }
        return delay;
    },
    reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        if (targetErrors.some(targetError => err.message.includes(targetError))) {
            console.log('🔄 Redis reconnecting due to:', err.message);
            return true; // Reconnect
        }
        return false;
    }
};

// Initialize Redis client
if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
        enableReadyCheck: redisConfig.enableReadyCheck,
        retryStrategy: redisConfig.retryStrategy,
        reconnectOnError: redisConfig.reconnectOnError
    });
} else {
    redis = new Redis(redisConfig);
}

// Connection event handlers
redis.on('connect', () => {
    console.log('🔌 Connecting to Redis...');
});

redis.on('ready', () => {
    isConnected = true;
    console.log('✅ Redis connected and ready');
});

redis.on('error', (err) => {
    isConnected = false;
    console.error('❌ Redis Error:', err.message);
});

redis.on('close', () => {
    isConnected = false;
    console.warn('⚠️  Redis connection closed');
});

redis.on('reconnecting', (delay) => {
    isConnected = false;
    console.log(`🔄 Redis reconnecting in ${delay}ms...`);
});

redis.on('end', () => {
    isConnected = false;
    console.warn('⚠️  Redis connection ended');
});

// Helper function to check if Redis is connected
const isRedisConnected = () => {
    return isConnected && redis.status === 'ready';
};

// Graceful shutdown
const closeRedis = async () => {
    if (redis) {
        console.log('🔌 Closing Redis connection...');
        await redis.quit();
        console.log('✅ Redis connection closed');
    }
};

// Health check
const healthCheck = async () => {
    try {
        if (!isRedisConnected()) {
            return { status: 'disconnected', message: 'Redis is not connected' };
        }
        
        const start = Date.now();
        await redis.ping();
        const latency = Date.now() - start;
        
        const info = await redis.info('memory');
        const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim() || 'unknown';
        
        return {
            status: 'connected',
            latency: `${latency}ms`,
            memory: usedMemory,
            uptime: redis.connector?.connecting ? 'connecting' : 'ready'
        };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
};

module.exports = redis;
module.exports.isRedisConnected = isRedisConnected;
module.exports.closeRedis = closeRedis;
module.exports.healthCheck = healthCheck;
