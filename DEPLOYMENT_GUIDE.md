# 🚀 Complete Deployment Guide: Render + Vercel

## **BACKEND DEPLOYMENT (Render)**

### Step 1: Push Code to GitHub

```bash
# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for production deployment"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/confess.git
git branch -M main
git push -u origin main
```

### Step 2: Create Account & Connect to Render

1. Go to https://render.com
2. Sign up with GitHub account
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Select the repository

### Step 3: Configure Render Service

**Basic Settings:**
- **Name:** `confess-backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** Free or Starter (depends on traffic)

### Step 4: Add Environment Variables

Go to **Environment** tab and add:

```
MONGODB_URI = mongodb+srv://user:password@cluster.mongodb.net/confessions?retryWrites=true&w=majority
REDIS_URL = rediss://default:YOUR_PASSWORD@positive-chimp-22228.upstash.io:6379
DEVICE_HASH_SECRET = (generate random string - use: openssl rand -base64 32)
SESSION_SECRET = (generate random string)
JWT_SECRET = (generate random string)
NODE_ENV = production
PORT = 5000
ALLOWED_ORIGINS = https://your-app-name.vercel.app,https://yourdomain.com
MAX_CONFESSIONS_PER_DAY = 5
MAX_REPLIES_PER_DAY = 20
GOOGLE_CLIENT_ID = your-google-id
GOOGLE_CLIENT_SECRET = your-google-secret
```

### Step 5: Generate Secret Keys

Run this in terminal to generate secure secrets:

```bash
# Windows PowerShell:
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char]$(Get-Random -Maximum 127 -Minimum 33) } | Join-String))) 

# Or use online: https://generate-random.org/encryption-key-generator?qty=1&len=32&type=base64
```

### Step 6: Deploy

Click **"Deploy"** button. Render will:
- Build the app
- Install dependencies
- Start the server
- Give you a URL like: `https://confess-backend.onrender.com`

**Note:** Free tier services sleep after 15 mins of inactivity. Use Starter plan for always-on.

---

## **FRONTEND DEPLOYMENT (Vercel)**

### Step 1: Update API URL

Edit [client/src/api/index.js](client/src/api/index.js):

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});
```

### Step 2: Update Vercel Config

Edit [client/vercel.json](client/vercel.json):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "env": {
    "REACT_APP_API_URL": "@api_url"
  }
}
```

### Step 3: Deploy to Vercel

**Option A: Using Git (Recommended)**

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Select root folder: `.` (root)
6. For "Build and Output settings":
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/build`
   - Install Command: `npm install`

**Option B: Using Vercel CLI**

```bash
npm install -g vercel
cd client
vercel --prod
```

### Step 4: Add Environment Variables in Vercel Dashboard

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:

```
REACT_APP_API_URL = https://confess-backend.onrender.com/api
```

### Step 5: Deploy

Click "Deploy". Vercel will automatically build and deploy.

---

## **POST-DEPLOYMENT CHECKLIST**

### Test Backend
```bash
curl https://confess-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "services": {
    "mongodb": { "status": "connected" },
    "redis": { "status": "connected" }
  }
}
```

### Test Frontend
- Visit your Vercel URL: `https://your-app-name.vercel.app`
- Try creating a confession
- Check if data appears in MongoDB

### Enable CORS in Backend
Update `ALLOWED_ORIGINS` in Render environment variables:
```
ALLOWED_ORIGINS=https://your-app-name.vercel.app
```

---

## **CUSTOM DOMAIN (Optional)**

### Add Domain to Vercel
1. Vercel Dashboard → Settings → Domains
2. Add your domain
3. Update nameservers at your domain provider
4. Wait 24-48 hours for propagation

### Update Backend CORS
```
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## **MONITORING & LOGS**

### Render Logs
- Dashboard → Your service → Logs tab
- View real-time logs

### Vercel Analytics
- Dashboard → Analytics tab
- View performance metrics

### MongoDB Atlas
- Cluster → Metrics
- Monitor database usage

---

## **TROUBLESHOOTING**

### Frontend Can't Connect to Backend

**Error:** "Failed to fetch confessions"

**Solution:**
1. Check `ALLOWED_ORIGINS` in Render environment
2. Verify `REACT_APP_API_URL` is correct in Vercel
3. Check Render backend is running: curl the health endpoint

### CORS Errors

**Error:** "Access to XMLHttpRequest blocked by CORS"

**Solution:**
Update in Render environment:
```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### Database Connection Failed

**Error:** "MongoDB connection error"

**Solution:**
1. Verify MongoDB Atlas IP whitelist includes Render (0.0.0.0/0)
2. Check MONGODB_URI is correct format
3. Test locally first

### Redis Connection Timeout

**Error:** "Redis connection failed"

**Solution:**
1. Verify Upstash is running in dashboard
2. Check REDIS_URL is from Upstash (not HTTP URL)
3. Render can use Redis even in free tier

---

## **COST BREAKDOWN**

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Render Backend** | $0 (sleeps after 15 min) | $7/mo (always-on) |
| **Vercel Frontend** | ✅ Free | ✅ Free |
| **MongoDB Atlas** | ✅ Free (512MB) | $9/mo (2GB+) |
| **Upstash Redis** | ✅ Free (10K commands/day) | $0.20/day (pay-as-you-go) |
| **Total Minimum** | **$0** | **~$7/mo** |

---

## **QUICK SUMMARY**

```
1. Push code to GitHub
2. Connect Render → Add env vars → Deploy
3. Get Render URL: https://confess-backend.onrender.com
4. Connect Vercel → Add REACT_APP_API_URL → Deploy
5. Update ALLOWED_ORIGINS in Render
6. Test: https://your-vercel-app.vercel.app
7. Done! 🎉
```

Need help with any step? Just ask!
