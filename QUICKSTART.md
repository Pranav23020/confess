# Quick Start Guide

Get your anonymous confession PWA running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v16+ (`node --version`)
- ✅ npm or yarn (`npm --version`)
- ✅ MongoDB installed OR MongoDB Atlas account

## Step-by-Step Setup

### 1️⃣ Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (root + client)
npm run install-all
```

### 2️⃣ Configure Environment

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/confessions
DEVICE_HASH_SECRET=change-this-to-random-string
MAX_CONFESSIONS_PER_DAY=5
MAX_REPLIES_PER_DAY=20
MAX_ACTIVE_CONFESSIONS=2
CONFESSION_EXPIRY_HOURS=24
```

### 3️⃣ Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 4️⃣ Run the Application

**Easy way (both frontend + backend):**
```bash
npm run dev
```

**Or separately:**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

### 5️⃣ Open in Browser

```
Frontend: http://localhost:3000
Backend API: http://localhost:5000/api/health
```

## 🎉 You're Done!

The app should now be running. Try:
1. Posting a confession
2. Replying to a confession
3. Viewing your profile

## Quick Test

Test if backend is working:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-02-04T..."}
```

## Common Issues

### Issue: MongoDB Connection Failed

**Fix:**
```bash
# Check if MongoDB is running
# Windows
sc query MongoDB

# Mac/Linux
ps aux | grep mongod

# Start if not running
net start MongoDB  # Windows
brew services start mongodb-community  # Mac
sudo systemctl start mongod  # Linux
```

### Issue: Port 5000 Already in Use

**Fix:**
```bash
# Find process using port 5000
# Windows
netstat -ano | findstr :5000

# Mac/Linux  
lsof -i:5000

# Kill the process or change PORT in .env
```

### Issue: Client Won't Start

**Fix:**
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

## Next Steps

1. ✅ **Test the app** - Post confessions, add replies
2. ✅ **Read README.md** - Understand architecture
3. ✅ **Check API docs** - Review available endpoints
4. ✅ **Customize** - Modify colors, text, features
5. ✅ **Deploy** - Follow production deployment guide

## Development Workflow

```bash
# Start development
npm run dev

# Test API endpoint
curl http://localhost:5000/api/confessions

# Build for production
cd client && npm run build

# Run production server
npm start
```

## Install as PWA

### On Mobile
1. Open http://localhost:3000 in Chrome/Safari
2. Tap "Add to Home Screen"
3. App appears on home screen

### On Desktop
1. Open http://localhost:3000 in Chrome
2. Click install icon in address bar
3. App opens in standalone window

## File Structure Quick Reference

```
confess/
├── server/          # Backend code
│   ├── models/      # Database schemas
│   ├── routes/      # API endpoints
│   └── index.js     # Server entry
├── client/          # Frontend code
│   ├── src/
│   │   ├── screens/ # Page components
│   │   ├── components/ # Reusable UI
│   │   └── api/     # API client
│   └── public/      # Static files
├── package.json     # Root dependencies
└── .env            # Configuration
```

## Useful Commands

```bash
# Install everything
npm run install-all

# Run both servers
npm run dev

# Backend only
npm run server

# Frontend only
npm run client

# Build production
npm run build

# Production server
npm start
```

## Testing Checklist

- [ ] Backend health check works
- [ ] Can post a confession
- [ ] Can view confessions feed
- [ ] Can add a reply
- [ ] Can report content
- [ ] Profile shows active confessions
- [ ] Limit enforcement works (try posting 3rd)
- [ ] PWA installs correctly

## Getting Help

1. Check error messages in browser console
2. Check server logs in terminal
3. Review README.md for detailed info
4. Check ARCHITECTURE.md for system design
5. Test API endpoints with curl

## Pro Tips

💡 Use browser DevTools (F12) to debug
💡 Check MongoDB Compass to view data
💡 Use Postman/Insomnia to test API
💡 Enable React DevTools extension
💡 Monitor server logs for errors

---

**Happy coding! 🚀**
