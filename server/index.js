const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

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
app.use(helmet());
app.use(compression());
app.use(cookieParser()); // Parse cookies
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(passport.initialize()); // Init passport

// Routes
app.use('/api/auth', require('./routes/auth'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
