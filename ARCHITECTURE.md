# Architecture Documentation

## System Overview

This anonymous confession PWA follows a modern three-tier architecture:

1. **Presentation Layer** - React PWA frontend
2. **Application Layer** - Node.js/Express REST API
3. **Data Layer** - MongoDB with TTL indexes

## Core Design Principles

### 1. Privacy First
- **No user accounts** - Zero authentication required
- **Device-based identity** - HMAC-SHA256 hash of IP + User-Agent
- **No PII storage** - Only anonymous device hashes
- **Ephemeral data** - All content auto-deletes in 24 hours

### 2. Safety First
- **2-confession limit** - Prevents spam
- **Rate limiting** - Multi-layer protection
- **Profanity filtering** - Automatic content screening
- **Community reporting** - Users flag inappropriate content
- **Auto-hiding** - Content hidden after 5 reports

### 3. Performance
- **TTL indexes** - Database handles expiration automatically
- **Pagination** - Efficient data loading
- **Caching** - Service worker caches static assets
- **Lean queries** - Only fetch necessary fields

## Data Flow

### Posting a Confession

```
User → React → API → Validation → Device Hash → 
Check Limit → Profanity Filter → Save to DB → 
Set expiresAt (24h) → Return to User
```

### Auto-Deletion Flow

```
MongoDB TTL Monitor (runs every 60s) →
Check expiresAt < now → Delete confession →
Cascade delete all replies
```

## Security Layers

### Layer 1: Device Identification
```javascript
deviceHash = HMAC-SHA256(IP + UserAgent, SECRET)
```
- Not reversible
- Consistent per device
- Changes if IP/browser changes

### Layer 2: Rate Limiting
- **Per-IP limits** via express-rate-limit
- **Different limits** for different actions
- **Sliding window** - resets after time period

### Layer 3: Input Validation
- **Length limits** - Max 500 chars (confession), 300 (reply)
- **Content filtering** - Profanity detection
- **Type checking** - Server-side validation

### Layer 4: Report System
- **Deduplication** - One report per device per content
- **Threshold-based** - Auto-hide after 5 reports
- **Temporary storage** - Reports expire with content

## MongoDB Schema Design

### Why TTL Indexes?
Traditional deletion approaches have problems:
- ❌ Cron jobs - Need separate process, not real-time
- ❌ Application logic - Can fail, requires restart
- ✅ **TTL indexes** - Database-native, reliable, automatic

### TTL Index Configuration
```javascript
db.confessions.createIndex(
  { expiresAt: 1 }, 
  { expireAfterSeconds: 0 }
)
```

### Cascade Deletion
When MongoDB deletes a confession via TTL:
1. Confession document removed
2. Pre-remove middleware triggers
3. All replies with matching `confessionId` deleted
4. Reports auto-expire (separate TTL on createdAt)

## API Design Decisions

### RESTful Structure
```
POST   /api/confessions          - Create
GET    /api/confessions          - List all
GET    /api/confessions/:id      - Get one with replies

POST   /api/replies              - Create reply
GET    /api/replies/:confessionId - List replies

POST   /api/reports              - Report content
GET    /api/user/active-count    - Check posting ability
```

### Why No Authentication?
- **Simplicity** - No login friction
- **Privacy** - No email/password collection
- **Anonymity** - True anonymous posting
- **Device tracking** - Sufficient for abuse prevention

### Stateless Design
- No sessions
- No cookies (except rate limiting)
- Each request independent
- Horizontally scalable

## Frontend Architecture

### Component Structure
```
App
├── Screens (Route handlers)
│   ├── HomeScreen
│   ├── NewConfessionScreen
│   ├── ConfessionDetailScreen
│   ├── ExploreScreen
│   ├── ProfileScreen
│   ├── LimitReachedScreen
│   └── ReportScreen
└── Components (Reusable)
    ├── BottomNav
    ├── ConfessionCard
    ├── ReplyBubble
    ├── PrimaryButton
    ├── TextAreaField
    └── EmptyState
```

### State Management
- **Local state** - React useState for UI
- **No Redux** - Unnecessary for this scale
- **API calls** - Direct axios calls, no complex state tree
- **Prop drilling** - Acceptable for current depth

### PWA Features

#### Service Worker Strategy
```
Cache-first for static assets:
- HTML, CSS, JS files
- Fonts, icons
- Images

Network-first for API:
- Always try network
- Fallback to cache if offline
- Show offline page if no cache
```

#### Manifest Configuration
- **standalone** display mode
- **portrait** orientation lock
- **Dark theme** color scheme
- **Icons** for all sizes (192px, 512px)

## Scalability Considerations

### Database Scaling
**Current:** Single MongoDB instance
**Next steps:**
1. MongoDB Atlas auto-scaling
2. Read replicas for high traffic
3. Sharding by date ranges

### Application Scaling
**Current:** Single Node.js process
**Next steps:**
1. PM2 clustering (utilize all CPU cores)
2. Multiple backend instances
3. Load balancer (NGINX/HAProxy)
4. Horizontal scaling on cloud platforms

### Caching Strategy
**Current:** Service worker only
**Next steps:**
1. Redis for API responses
2. Cache popular confessions
3. Cache user active counts
4. CDN for static assets

## Monitoring & Observability

### Logging Points
- Confession creation
- Report submissions
- Rate limit hits
- Database errors
- API response times

### Metrics to Track
- Confessions per hour
- Average reply count
- Report rate
- API latency
- Error rates
- Active users (estimated)

### Recommended Tools
- **Application:** Winston/Bunyan
- **Monitoring:** PM2, New Relic, DataDog
- **Database:** MongoDB Atlas monitoring
- **Errors:** Sentry
- **Analytics:** Google Analytics (privacy-safe)

## Abuse Prevention Strategy

### Multi-Layer Defense

**Layer 1: Rate Limiting**
- Prevents mass posting
- Different limits per action
- IP-based tracking

**Layer 2: Confession Limit**
- Max 2 active confessions
- Enforced at application level
- Per-device tracking

**Layer 3: Content Filtering**
- Profanity detection
- Length validation
- Character set validation

**Layer 4: Community Reports**
- User-driven moderation
- Auto-hide at threshold
- Temporary report storage

**Layer 5: Manual Review (Future)**
- Admin dashboard for flagged content
- Ban device hashes
- Pattern detection

## Data Privacy Compliance

### GDPR Considerations
- ✅ No personal data collected
- ✅ Anonymous by design
- ✅ Auto-deletion after 24 hours
- ✅ No tracking beyond device hash
- ✅ Right to deletion (automatic)

### User Rights
- **Right to know:** Privacy policy explains device hashing
- **Right to delete:** Automatic after 24 hours
- **Right to anonymity:** No accounts required

## Performance Optimization

### Frontend
- Code splitting (React.lazy)
- Image optimization
- Tailwind CSS purging
- Service worker caching
- Lighthouse score optimization

### Backend
- Database indexing
- Query optimization (lean())
- Compression middleware
- Response caching headers
- Connection pooling

### Database
- Compound indexes for common queries
- Projection (select specific fields)
- Pagination to limit results
- TTL indexes for auto-cleanup

## Deployment Architecture

### Production Setup (Recommended)

```
┌─────────────┐
│   CDN       │  (Cloudflare/CloudFront)
│  Static     │
└──────┬──────┘
       │
┌──────▼──────┐
│  Frontend   │  (Vercel/Netlify)
│   (React)   │
└──────┬──────┘
       │ API calls
┌──────▼──────┐
│ Load        │  (NGINX/CloudFlare)
│ Balancer    │
└──────┬──────┘
       │
   ┌───▼───┐ ┌─────┐ ┌─────┐
   │ API 1 │ │API 2│ │API 3│  (Railway/Heroku/AWS)
   └───┬───┘ └──┬──┘ └──┬──┘
       │        │       │
       └────────┼───────┘
                │
         ┌──────▼──────┐
         │  MongoDB    │  (Atlas)
         │  Cluster    │
         └─────────────┘
```

## Technology Choices Explained

### Why React?
- Component reusability
- Large ecosystem
- PWA support excellent
- Performance optimizations
- Developer experience

### Why MongoDB?
- ✅ TTL indexes (critical feature)
- ✅ Flexible schema
- ✅ JSON-like documents
- ✅ Easy scaling
- ✅ Atlas managed service

### Why Express?
- Minimal overhead
- Flexible middleware
- Large ecosystem
- Easy to understand
- RESTful API friendly

### Why Tailwind CSS?
- Rapid development
- Consistent design
- Dark mode support
- Purge unused CSS
- Utility-first approach

## Testing Strategy

### Backend Testing
```javascript
// Unit tests
- Model validation
- Helper functions
- Middleware logic

// Integration tests
- API endpoints
- Database operations
- Rate limiting

// Load tests
- Concurrent confessions
- Heavy traffic scenarios
```

### Frontend Testing
```javascript
// Component tests
- Render correctly
- User interactions
- Props validation

// E2E tests
- Post confession flow
- Reply flow
- Report flow
- Limit reached scenario
```

## Maintenance Checklist

### Daily
- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Review report submissions

### Weekly
- [ ] Database performance review
- [ ] Check storage usage
- [ ] Review rate limit hits

### Monthly
- [ ] Security updates
- [ ] Dependency updates
- [ ] Backup verification
- [ ] Performance optimization

---

**This architecture prioritizes user privacy, data safety, and system reliability while maintaining simplicity and scalability.**
