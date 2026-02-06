# Hashtag System Implementation Guide

## 🏷️ Overview

A complete hashtag system has been implemented with Instagram Reels-like algorithm. Users can:
- Add hashtags to confessions (automatically extracted from text)
- Browse confessions by hashtag
- Get personalized recommendations based on liked hashtags
- See trending hashtags
- View hashtag statistics

## ✨ Features

### 1. **Hashtag Extraction & Auto-Suggestions**
- Automatically extracts hashtags from confession text (e.g., `#love`, `#advice`)
- Real-time auto-suggestions as users type
- Shows hashtag usage count
- Prevents duplicate hashtags

### 2. **Hashtag Browsing**
- Click any hashtag to view all confessions with that tag
- Pagination support
- Sorted by engagement (likes, replies)
- Shows total confessions count

### 3. **Trending Hashtags**
- Algorithm-based trending calculation
- Factors: views, likes, recency
- Top 10 trending hashtags displayed
- Updated in real-time

### 4. **Personalized Algorithm (Instagram Reels Style)**
```
Recommendation Score = (hashtag_matches × 10) + (likes × 2) + replies
- Users' liked hashtags prioritized
- Sorted by engagement + recency
- Fresh content rotation
```

### 5. **View Tracking**
- Tracks device hashes viewing hashtags
- Used for trending calculation
- Privacy-preserving (no personal data)

## 🗂️ File Structure

### Backend Files
```
server/
├── models/
│   └── Confession.js (updated with hashtags field)
├── routes/
│   └── hashtags.js (new)
├── utils/
│   └── hashtagHelpers.js (new)
└── index.js (updated with routes)
```

### Frontend Files
```
client/src/
├── components/
│   ├── HashtagInput.js (new - input with suggestions)
│   ├── HashtagBadges.js (new - hashtag display)
│   ├── TrendingHashtags.js (new - trending list)
│   └── ConfessionCard.js (updated)
├── screens/
│   ├── NewConfessionScreen.js (updated)
│   └── HashtagExploreScreen.js (new)
└── App.js (updated routes)
```

## 📡 API Endpoints

### GET `/api/hashtags/trending`
Get trending hashtags
```
Query Params:
  - limit (default: 10) - number of hashtags to return

Response:
{
  "success": true,
  "data": [
    {
      "tag": "love",
      "count": 45,
      "views": 320,
      "likes": 120,
      "score": 450
    }
  ]
}
```

### GET `/api/hashtags/search`
Search confessions by hashtag
```
Query Params:
  - tag (required) - hashtag name (with or without #)
  - page (default: 1)
  - limit (default: 20)

Response:
{
  "success": true,
  "data": [...confessions],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

### GET `/api/hashtags/recommended`
Get personalized confessions (like Explore/Reels)
```
Query Params:
  - page (default: 1)
  - limit (default: 20)

Response:
{
  "success": true,
  "data": [...confessions],
  "userInterests": ["love", "advice", "career"]
}
```

### GET `/api/hashtags`
Search hashtag suggestions (for autocomplete)
```
Query Params:
  - search (required) - partial hashtag name

Response:
{
  "success": true,
  "data": [
    {
      "tag": "love",
      "count": 45
    }
  ]
}
```

### POST `/api/hashtags/track-view`
Track when user views a hashtag-based confession
```
Body:
{
  "confessionId": "123abc"
}

Response:
{
  "success": true,
  "message": "View tracked"
}
```

## 🎨 Frontend Components

### HashtagInput
Smart textarea component with hashtag suggestions
```jsx
<HashtagInput 
  value={text}
  onChange={setText}
/>
```

Features:
- Real-time hashtag extraction
- Auto-suggestions dropdown
- Visual hashtag display
- Usage hints

### HashtagBadges
Display and manage hashtags
```jsx
<HashtagBadges 
  hashtags={['love', 'advice']}
  size="sm"
  clickable={true}
/>
```

Sizes: `xs`, `sm`, `md`, `lg`

### TrendingHashtags
Display trending hashtags widget
```jsx
<TrendingHashtags 
  limit={10}
  className="my-6"
/>
```

### HashtagExploreScreen
Full page for browsing specific hashtags
```
Route: /hashtags/:tag
```

## 🔄 Workflow Example

### For Content Creator
1. Go to "New Confession"
2. Type: "Just got promoted at work! 🎉 #career #excited #milestone"
3. See hashtags highlighted and suggestions
4. Hashtags automatically extracted: `career`, `excited`, `milestone`
5. Post confession
6. Hashtags are indexed and trending algorithm picks it up

### For Discovery User
1. See trending hashtags on Explore or Home
2. Click `#love` hashtag
3. View all confessions tagged with #love
4. Like a confession
5. Algorithm tracks interest in #love
6. Next time user visits Recommended, #love confessions ranked higher

## 🔐 Security & Privacy

### IP Privacy
- Device hashes tracked, not actual IPs
- Same hashtag view can't be counted twice from same device
- Non-personally identifiable

### Content Moderation
- Hashtags inherited from confession content
- Same moderation rules apply to hashtags
- Can't create empty or spam hashtags

### Rate Limiting
- Search: Standard rate limit applies
- View tracking: Per-device rate limit
- No spam protection needed (hashtags from confessions)

## 📊 Database Changes

### Confession Model Updates
```javascript
{
  // ... existing fields ...
  hashtags: {
    type: [String],
    default: [],
    index: true,
    lowercase: true,
    trim: true
  },
  hashtagViews: {
    type: [String], // deviceHashes
    default: []
  }
}
```

## 🚀 Performance Optimization

### Indexes
- `Confession.hashtags` - indexed for quick hashtag queries
- `Confession.isPublished` - partial index for published confessions
- `Confession.expiresAt` - TTL index

### Aggregation Pipeline
- Uses MongoDB aggregation for scoring
- Batch processing for trending calculation
- Caching recommended confessions (optional)

## 📱 Mobile Features

### Mobile-Optimized
- Hashtag suggestions don't cover textarea (sticky footer)
- Tap to select suggestions
- Swipe-friendly hashtag display
- Responsive hashtag explore page

### Share Integration
- Hashtags preserved when sharing confessions
- Deep links: `/hashtags/love`

## 🎯 Recommendation Algorithm Details

### Scoring Formula
```
baseScore = hashtagMatches × 10
engagementScore = (likes × 2) + (replies × 1) + (views × 0.5)
ageFactor = 1 / (1 + hoursSincePosted / 12)  // Decay over 48 hours
finalScore = (baseScore + engagementScore) × ageFactor
```

### Hashtag Similarity
- Doesn't use fuzzy matching (exact tag matches only)
- Case-insensitive (`#Love` = `#love`)
- Trim whitespace automatically

## 🔄 Future Enhancements

1. **Hashtag Hashtag Groups**
   - Related hashtags: `#love` → `#relationship`, `#heartbreak`
   - Hashtag aliases: `#lol` → `#funny`

2. **Hashtag Analytics**
   - For users: Sees which hashtags perform best
   - Trending over time graph
   - Peak interest hours

3. **Hashtag Challenges**
   - Timed hashtag challenges
   - Leaderboards
   - Badges for participation

4. **Hashtag Filters**
   - Filter confessions by multiple hashtags
   - Exclude hashtags filter
   - Category + hashtag combination

5. **Hashtag Moderation**
   - Block certain hashtags
   - Rename/merge hashtags (admin)
   - Hashtag suspensions

## ⚙️ Configuration

### Environment Variables
```env
# No new vars required - uses existing setup
```

### Performance Tuning
```javascript
// Optional: Adjust recommendation algorithm weights
const HASHTAG_MATCH_WEIGHT = 10;     // per matching hashtag
const LIKE_WEIGHT = 2;                // per like
const REPLY_WEIGHT = 1;               // per reply
const VIEW_WEIGHT = 0.5;              // per view
const RECENCY_HALFLIFE = 12;          // hours
```

## 🐛 Testing Checklist

- [ ] Create confession with #hashtags in text
- [ ] Hashtags extracted and displayed correctly
- [ ] Click hashtag to view related confessions
- [ ] Autocomplete works while typing
- [ ] Trending page shows correct hashtags
- [ ] Personal recommendations change based on likes
- [ ] Pagination works on hashtag pages
- [ ] Hashtag views are tracked (views count increases)
- [ ] Same device can't inflate views
- [ ] Mobile responsiveness verified
- [ ] No XSS vulnerabilities with hashtag displays
- [ ] Performance acceptable with large hashtag datasets

## 📖 Usage Examples

### Add Hashtag in Confession
```
User types: "I love this person so much #love #crush #confession"
System extracts: ["love", "crush", "confession"]
Saves to MongoDB and indexes immediately
```

### Browse by Hashtag
```
User clicks: #love badge on a confession
Routes to: /hashtags/love
Shows: All confessions with #love, sorted by likes
Pagination: 20 per page
```

### Get Recommendations
```
User has liked confessions with: #love, #advice, #mental-health
Visits: /explore/recommended
Gets: Recommendations prioritizing those three hashtags
Ranked by engagement with those hashtags
```

## 🆘 Troubleshooting

### Hashtags Not Extracting
- Check regex: `/#[\w]+/gi` should match
- Ensure text has `#` followed by alphanumeric
- Try: `#test`, `#hello123`, `#test_tag`

### Recommendations Not Personalized
- For logged-in users: Need at least 1 like
- For anonymous users: Falls back to trending
- Likes may take time to sync

### Performance Issues
- Ensure MongoDB indexes are created
- Use pagination (don't load all confessions)
- Limit trending hashtags to 10-20

---

**Created:** February 6, 2026
**Version:** 1.0.0
