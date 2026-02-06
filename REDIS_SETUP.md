# Redis Setup Guide

## Overview

Redis is now fully integrated into the application with the following features:

### ✅ Implemented Features

1. **Rate Limiting with Redis Store**
   - Persistent rate limits across server restarts
   - Works with multiple server instances
   - Automatic fallback to memory store if Redis unavailable

2. **Socket.io Redis Adapter**
   - Enables multi-server Socket.io scaling
   - Events propagate across all server instances
   - Automatic fallback to memory adapter

3. **Caching**
   - API response caching (explore endpoints)
   - Configurable TTL per cache key
   - Graceful fallback to database queries

4. **Enhanced Connection Management**
   - Automatic reconnection with exponential backoff
   - Connection health monitoring
   - Graceful degradation when Redis unavailable

## Installation

### Option 1: Local Redis (Development)

#### Windows
```powershell
# Using Chocolatey
choco install redis-64

# Or using MSI installer from:
# https://github.com/microsoftarchive/redis/releases
```

#### macOS
```bash
brew install redis
brew services start redis
```

#### Linux
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Option 2: Cloud Redis (Production)

#### Recommended Providers:
- **Upstash** (Free tier available) - https://upstash.com
- **Redis Cloud** (Free 30MB) - https://redis.com/try-free/
- **AWS ElastiCache** - For AWS deployments
- **Azure Cache for Redis** - For Azure deployments

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Local Development
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# OR Production (Full URL)
REDIS_URL=redis://default:password@host:port/db
```

### Configuration Priority

1. If `REDIS_URL` is set → Uses that connection string
2. Else uses individual config: `REDIS_HOST`, `REDIS_PORT`, etc.
3. If none set → Tries local Redis at `127.0.0.1:6379`
4. If connection fails → Graceful fallback (no Redis features)

## Features & Fallback Behavior

| Feature | With Redis | Without Redis |
|---------|-----------|---------------|
| Rate Limiting | ✅ Persistent, multi-server | ⚠️ In-memory, single server |
| Socket.io | ✅ Multi-server sync | ⚠️ Single server only |
| Caching | ✅ Fast cache layer | ✅ Direct DB queries |
| Health Check | ✅ Redis status included | ✅ Works without Redis |

## Monitoring

### Health Check Endpoint

```bash
GET /api/health
```

Response includes Redis status:
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T...",
  "services": {
    "mongodb": {
      "status": "connected",
      "host": "localhost"
    },
    "redis": {
      "status": "connected",
      "latency": "2ms",
      "memory": "1.2M",
      "uptime": "ready"
    }
  }
}
```

### Console Logs

The application logs Redis events:
- `✅ Redis connected and ready` - Connection successful
- `🔄 Redis reconnecting...` - Attempting to reconnect
- `⚠️ Redis not connected - using fallback mechanisms` - Operating without Redis
- `❌ Redis Error: ...` - Connection errors

## Production Deployment

### 1. Install Dependencies

```bash
npm install
```

This installs the new Redis packages:
- `rate-limit-redis@^4.2.0` - Rate limiting with Redis
- `@socket.io/redis-adapter@^8.3.0` - Socket.io multi-server support

### 2. Set Environment Variables

On your hosting platform (Vercel, Railway, Render, etc.):

```env
REDIS_URL=redis://your-redis-url
NODE_ENV=production
```

### 3. Verify Connection

After deployment, check logs for:
```
✅ Redis connected and ready
✅ Socket.io Redis adapter enabled
```

## Troubleshooting

### Redis Connection Fails

**Symptoms:**
- `⚠️ Redis not connected` in logs
- Rate limits reset on server restart

**Solutions:**
1. Check Redis is running: `redis-cli ping` (should return `PONG`)
2. Verify connection details in `.env`
3. Check firewall rules allow Redis port (6379)
4. For cloud Redis, verify IP whitelist/VPC settings

### Rate Limiting Not Persisting

**Cause:** Redis not connected, using in-memory fallback

**Fix:** 
1. Ensure Redis URL is correct
2. Check Redis is accessible from your server
3. Review connection logs

### Socket.io Events Not Syncing

**Cause:** Redis adapter not enabled (single server or Redis unavailable)

**Fix:**
1. Verify Redis connection
2. Check logs for "Socket.io Redis adapter enabled"
3. Ensure `REDIS_URL` is set in production

## Performance Tuning

### Redis Memory Management

Monitor memory usage via health endpoint or Redis CLI:

```bash
redis-cli INFO memory
```

### Set Max Memory Policy

In `redis.conf`:
```
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Cache TTL Configuration

Adjust cache durations in code:

```javascript
// Current: 10 minutes for top-today
await redis.set(cacheKey, data, 'EX', 600);

// Increase for less-changing data:
await redis.set(cacheKey, data, 'EX', 3600); // 1 hour
```

## Development Without Redis

The application works perfectly fine without Redis:

1. Don't set any `REDIS_*` environment variables
2. Application will log: `⚠️ Redis not connected - using fallback mechanisms`
3. All features work, but:
   - Rate limits reset on restart
   - Socket.io limited to single server
   - No caching layer (slightly slower API)

## Security Best Practices

1. **Never commit credentials** - Use `.env` file (already in `.gitignore`)
2. **Use strong Redis password** in production
3. **Enable TLS** for production Redis (use `rediss://` URL scheme)
4. **Restrict network access** - Only allow your server IPs
5. **Regular backups** - Enable persistence in Redis config

## Architecture Benefits

With proper Redis setup:

- ✅ **Horizontal Scaling**: Run multiple server instances
- ✅ **Persistent Rate Limits**: Can't bypass by restarting
- ✅ **Faster API Responses**: Cached data reduces DB load
- ✅ **Real-time Sync**: Socket.io events across all servers
- ✅ **Production Ready**: Enterprise-grade session management

## Support

For issues or questions:
1. Check health endpoint: `/api/health`
2. Review server logs for Redis errors
3. Test Redis connection: `redis-cli ping`
4. Verify environment variables are set correctly
