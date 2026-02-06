const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const redis = require('./utils/redis');
const { isRedisConnected, healthCheck: redisHealthCheck, closeRedis } = require('./utils/redis');

const confessionRoutes = require('./routes/confessions');
const replyRoutes = require('./routes/replies');
const userRoutes = require('./routes/user');
const reportRoutes = require('./routes/reports');
const likeRoutes = require('./routes/likes');
const exploreRoutes = require('./routes/explore');
const draftRoutes = require('./routes/drafts');
const pollRoutes = require('./routes/polls');
const blockedKeywordsRoutes = require('./routes/blockedKeywords');

const app = express();
const passport = require('passport');
const cookieParser = require('cookie-parser');

// Trust proxy (needed for rate limiter behind proxy)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Passport Config
require('./config/passport')(passport);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(cookieParser()); // Parse cookies
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize()); // Init passport
app.use(passport.session()); // Enable persistent login sessions

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');

    // Create TTL indexes
    const Confession = require('./models/Confession');
    Confession.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    Confession.collection.createIndex({ text: 'text' }); // Text search index
    console.log('✅ TTL and search indexes created for confessions');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/confessions', confessionRoutes);
app.use('/api/replies', replyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/blocked-keywords', blockedKeywordsRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check Redis
    const redisStatus = await redisHealthCheck();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: {
          status: mongoStatus,
          host: mongoose.connection.host || 'unknown'
        },
        redis: redisStatus
      }
    };
    
    // Return 503 if any critical service is down
    const statusCode = mongoStatus === 'connected' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

// Start server
const http = require('http');
const server = http.createServer(app);
const io = require('./utils/socket').init(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log Redis status after short delay to allow connection
  setTimeout(() => {
    if (isRedisConnected()) {
      console.log('✅ Redis is ready for use');
    } else {
      console.warn('⚠️  Redis not connected - using fallback mechanisms');
    }
  }, 1000);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      
      await closeRedis();
      
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
