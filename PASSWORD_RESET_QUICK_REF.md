# Password Reset System - Quick Reference

## 🚀 Quick Start

### 1. Environment Setup

Add to your `.env` file:

```env
# Email Configuration (Zoho)
EMAIL_USER=noreply@anonconfess.in
EMAIL_PASSWORD=your_zoho_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000  # or your production URL
```

### 2. Start Server

```bash
cd server
npm start
```

Look for:
```
✅ Zoho email service is ready
```

---

## 📡 API Endpoints

### Request Password Reset

```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

**Rate Limit:** 3 requests per 15 minutes

---

### Reset Password

```bash
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

**Error Response (Invalid Token):**
```json
{
  "success": false,
  "error": "Invalid or expired reset token. Please request a new password reset."
}
```

**Rate Limit:** 5 requests per 15 minutes

---

## 🔒 Security Features

✅ **Token Security**
- Generated with `crypto.randomBytes(32)`
- Hashed with SHA-256 before storage
- 30-minute expiration
- One-time use only

✅ **Anti-Enumeration**
- Same response whether user exists or not
- Random timing delays
- No information leakage

✅ **Rate Limiting**
- IP-based rate limiting
- Separate limits for forgot and reset
- Prevents brute force attacks

✅ **Password Security**
- Minimum 6 characters
- Confirmation required
- Hashed with bcrypt (strength: 10)

---

## 🧪 Testing with cURL

### 1. Request Reset Email

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 2. Check Email Inbox

Look for email from "AnonConfess <noreply@anonconfess.in>"

Extract the token from the reset URL:
```
http://localhost:3000/reset-password/abc123def456...
                                     ↑ This is the token
```

### 3. Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/reset-password/TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newPassword123",
    "confirmPassword": "newPassword123"
  }'
```

### 4. Login with New Password

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "newPassword123"
  }'
```

---

## 📧 Email Template Preview

**Subject:** Reset your AnonConfess password

**Content:**
- Branded header with gradient
- User's username displayed
- Prominent "Reset Password" button
- Alternative text link (for button non-working)
- 30-minute expiration warning
- Security notice about ignoring if not requested

---

## 🐛 Troubleshooting

### Email Not Sending

**Check:**
1. Environment variables are set correctly
2. Using Zoho App Password (not regular password)
3. Server logs show: `✅ Zoho email service is ready`
4. No firewall blocking port 465

**Test email config:**
```javascript
// Add this to your code temporarily
const { verifyEmailService } = require('./utils/emailService');
verifyEmailService().then(result => {
  console.log('Email test result:', result);
});
```

---

### Token Always Invalid

**Check:**
1. Token not truncated in URL
2. Token used within 30 minutes
3. Token not already used (one-time use)
4. Server time is correct

---

### Rate Limiting Issues

**Adjust limits in `server/routes/auth.js`:**

```javascript
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,  // ← Increase this
  // ...
});
```

---

## 📊 Database Changes

The User model now includes:

```javascript
{
  resetPasswordToken: String,     // Hashed token
  resetPasswordExpires: Date,     // Expiration timestamp
}
```

**Indexes:**
- `resetPasswordToken` (for efficient lookups)

---

## 🔐 Production Checklist

Before deploying:

- [ ] Set `EMAIL_USER` and `EMAIL_PASSWORD` in production env
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Verify `NODE_ENV=production`
- [ ] Test email delivery in production
- [ ] Monitor rate limit effectiveness
- [ ] Set up email delivery alerts
- [ ] Document support procedures

---

## 📚 Files Modified/Created

```
server/
├── models/User.js                    # ✏️ Updated (reset fields)
├── routes/auth.js                    # ✏️ Updated (new endpoints)
├── utils/emailService.js             # ✨ Created (email logic)
└── index.js                          # ✏️ Updated (email verification)

docs/
├── PASSWORD_RESET_SETUP.md           # ✨ Created (full guide)
└── PASSWORD_RESET_QUICK_REF.md       # ✨ Created (this file)

.env.example                          # ✏️ Updated (email vars)
```

---

## 🆘 Support

**Common Issues:**

1. **"Email service verification failed"**
   → Check Zoho credentials and SMTP access

2. **"Invalid or expired reset token"**
   → Token expired (>30 min) or already used

3. **"Too many password reset requests"**
   → Rate limit hit, wait 15 minutes

4. **Email not arriving**
   → Check spam folder, verify email service logs

---

## 🎯 Key Takeaways

✅ **Security First**
- Cryptographically secure tokens
- No user enumeration
- Rate limiting enabled
- One-time use tokens

✅ **Production Ready**
- Comprehensive error handling
- Detailed logging
- Email service verification
- Environment-based configuration

✅ **User Friendly**
- Beautiful HTML email
- Clear instructions
- 30-minute validity window
- Helpful error messages

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** 2024
