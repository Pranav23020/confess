const { createAdapter } = require('@socket.io/redis-adapter');
const { isRedisConnected } = require('./redis');
const Redis = require('ioredis');

let io;

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: process.env.ALLOWED_ORIGINS
                    ? process.env.ALLOWED_ORIGINS.split(',')
                    : ["http://localhost:3000"],
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // Setup Redis adapter for multi-server scaling
        if (isRedisConnected()) {
            try {
                const pubClient = new Redis(process.env.REDIS_URL || {
                    host: process.env.REDIS_HOST || '127.0.0.1',
                    port: process.env.REDIS_PORT || 6379,
                    password: process.env.REDIS_PASSWORD || undefined,
                });
                
                const subClient = pubClient.duplicate();

                io.adapter(createAdapter(pubClient, subClient));
                console.log('✅ Socket.io Redis adapter enabled');

                pubClient.on('error', (err) => {
                    console.error('Socket.io Redis pub client error:', err);
                });

                subClient.on('error', (err) => {
                    console.error('Socket.io Redis sub client error:', err);
                });
            } catch (err) {
                console.warn('⚠️  Failed to setup Socket.io Redis adapter:', err.message);
                console.warn('⚠️  Socket.io will use memory adapter (single server only)');
            }
        } else {
            console.warn('⚠️  Redis not connected. Socket.io using memory adapter (single server only)');
        }

        io.on('connection', (socket) => {
            console.log('⚡ New client connected:', socket.id);

            socket.on('disconnect', () => {
                console.log('❌ Client disconnected');
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};
