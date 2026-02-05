# Anonymous Confessions PWA

A production-ready Progressive Web App for anonymous confessions with 24-hour auto-expiration. Built with safety, privacy, and scalability in mind.

## 🌟 Features

### Core Functionality
- ✅ **Anonymous posting** - No login, accounts, or profiles required
- ✅ **24-hour expiration** - All confessions auto-delete after 24 hours
- ✅ **2 confession limit** - Maximum 2 active confessions per user
- ✅ **Anonymous replies** - Users can reply to confessions
- ✅ **Text-only** - Simple, distraction-free content
- ✅ **Report system** - Community-driven content moderation
- ✅ **Dark mode first** - Beautiful dark UI with smooth animations

### Technical Features
- ✅ **PWA compliant** - Installable on mobile devices
- ✅ **Offline support** - Service worker caching
- ✅ **TTL auto-deletion** - MongoDB TTL indexes for automatic cleanup
- ✅ **Device-based identity** - Privacy-first anonymous tracking
- ✅ **Rate limiting** - Prevent spam and abuse
- ✅ **Profanity filtering** - Basic content moderation
- ✅ **RESTful API** - Clean, stateless backend

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18
- React Router v6
- Tailwind CSS
- Axios
- PWA service worker

**Backend:**
- Node.js + Express
- MongoDB with TTL indexes
- Helmet (security)
- Express Rate Limit
- Bad-words (profanity filter)

**Database:**
- MongoDB (local or Atlas)
- Collections: Confessions, Replies, Reports
- TTL indexes for auto-deletion

## 📦 Project Structure

```
confess/
├── client/                 # React frontend
│   ├── public/
│   │   ├── manifest.json   # PWA manifest
│   │   ├── service-worker.js
│   │   └── offline.html
│   └── src/
│       ├── api/            # API client
│       ├── components/     # Reusable components
│       ├── screens/        # Screen components
│       ├── App.js
│       └── index.js
├── server/                 # Express backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Helper functions
│   ├── middleware/        # Express middleware
│   └── index.js           # Server entry point
├── package.json
├── .env.example
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Clone and Install

```bash
cd confess
npm run install-all
```

This installs dependencies for both frontend and backend.

### Step 2: Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/confessions
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/confessions

# Security
DEVICE_HASH_SECRET=your-random-secret-key-here

# Rate Limiting
MAX_CONFESSIONS_PER_DAY=5
MAX_REPLIES_PER_DAY=20

# Confession Limits
MAX_ACTIVE_CONFESSIONS=2
CONFESSION_EXPIRY_HOURS=24
```

### Step 3: Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas**
- Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
- Get connection string
- Update `MONGODB_URI` in `.env`

### Step 4: Run the Application

**Development mode (both frontend & backend):**
```bash
npm run dev
```

**Or run separately:**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### Step 5: Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 📱 Installing as PWA

### Mobile (Chrome/Safari)
1. Open http://localhost:3000 in mobile browser
2. Tap browser menu (⋮ or share button)
3. Select "Add to Home Screen"
4. App icon appears on home screen

### Desktop (Chrome/Edge)
1. Open http://localhost:3000
2. Click install icon in address bar
3. Click "Install"

## 🔒 Security & Privacy

### Anonymous Device Tracking
- Uses hashed IP + User-Agent
- No personal data stored
- Only used for:
  - 2-confession limit enforcement
  - Rate limiting
  - Report tracking

### Profanity Filter
- Automatic detection using `bad-words` library
- Rejects submissions with inappropriate content
- Customizable word list

### Rate Limiting
- 5 confessions per device per day
- 20 replies per device per day
- 100 general API requests per 15 minutes
- 10 reports per hour

### Auto-Moderation
- Content hidden after 5 reports
- Automatic TTL deletion after 24 hours
- Cascade delete replies with confession

## 🛠️ API Endpoints

### Confessions
- `POST /api/confessions` - Create confession
- `GET /api/confessions` - Get all confessions (paginated)
- `GET /api/confessions/:id` - Get single confession with replies

### Replies
- `POST /api/replies` - Create reply
- `GET /api/replies/:confessionId` - Get replies for confession

### User
- `GET /api/user/active-confession-count` - Get active confession count
- `GET /api/user/my-confessions` - Get user's active confessions

### Reports
- `POST /api/reports` - Report confession or reply

### Health
- `GET /api/health` - Server health check

## 📊 Database Schema

### Confessions Collection
```javascript
{
  text: String (max 500 chars),
  deviceHash: String (indexed),
  replyCount: Number (default 0),
  reportCount: Number (default 0),
  isHidden: Boolean (default false),
  createdAt: Date,
  expiresAt: Date (TTL indexed)
}
```

### Replies Collection
```javascript
{
  confessionId: ObjectId (indexed, ref: Confession),
  text: String (max 300 chars),
  deviceHash: String,
  reportCount: Number (default 0),
  isHidden: Boolean (default false),
  createdAt: Date
}
```

### Reports Collection
```javascript
{
  targetType: String ('confession' | 'reply'),
  targetId: ObjectId (indexed),
  deviceHash: String,
  reason: String,
  createdAt: Date (TTL: 24 hours)
}
```

## 🚢 Production Deployment

### Environment Setup
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...your-atlas-uri
DEVICE_HASH_SECRET=long-random-secret-key
```

### Build Frontend
```bash
cd client
npm run build
```

### Deploy Options

**Option 1: Single Server (Node.js)**
```bash
# Serve React build from Express
npm start
```

**Option 2: Separate Deployment**
- Frontend: Vercel, Netlify, Cloudflare Pages
- Backend: Heroku, Railway, DigitalOcean, AWS

**Option 3: Docker**
```dockerfile
# Create Dockerfile and deploy to any container platform
```

### HTTPS Required
- PWA requires HTTPS in production
- Use Let's Encrypt or platform SSL

## 💰 Monetization Preparation

### Ad Integration Points
```javascript
// Add ad components in:
- Between confession cards in feed
- After posting confession (interstitial)
- Profile screen banner
```

### Premium Features (Future)
```javascript
- Extended confession lifetime (48h)
- Priority visibility
- Custom themes
- Analytics dashboard
```

### Payment Integration
```javascript
// Use Stripe/Razorpay - no app store needed
import { loadStripe } from '@stripe/stripe-js';
```

## 🧪 Testing

```bash
# Test backend API
curl http://localhost:5000/api/health

# Test confession creation
curl -X POST http://localhost:5000/api/confessions \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test confession that is long enough to pass validation"}'

# Test get confessions
curl http://localhost:5000/api/confessions
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```
✓ Check MongoDB is running
✓ Verify MONGODB_URI in .env
✓ Check network access (Atlas whitelist)
```

### Port Already in Use
```bash
# Find and kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

### PWA Not Installing
```
✓ Must be HTTPS (or localhost)
✓ Check manifest.json is valid
✓ Verify service worker registered
✓ Check browser console for errors
```

### Confessions Not Expiring
```
✓ Verify TTL index created: Confession.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
✓ Check MongoDB version (TTL requires 2.2+)
✓ expiresAt field must be Date type
```

## 📈 Scaling Considerations

### Database Optimization
- Add indexes on frequently queried fields
- Use MongoDB Atlas auto-scaling
- Implement read replicas for high traffic

### Caching
- Add Redis for API response caching
- Cache active confession counts
- Cache popular confessions

### CDN
- Serve static assets from CDN
- Use CloudFlare for DDoS protection

### Load Balancing
- Use PM2 for Node.js clustering
- Deploy multiple backend instances
- Use NGINX as reverse proxy

## 🔮 Future Enhancements

- [ ] Image uploads (with moderation)
- [ ] Categories/tags
- [ ] Trending confessions
- [ ] Search functionality
- [ ] Push notifications
- [ ] Admin dashboard
- [ ] Advanced analytics
- [ ] A/B testing framework
- [ ] Multi-language support

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 👨‍💻 Support

For issues or questions:
1. Check this README
2. Review code comments
3. Test with provided curl commands
4. Check browser/server console logs

---

**Built with privacy, safety, and user experience as top priorities.**
