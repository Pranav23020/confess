# =================================
# PASSWORD RESET SYSTEM - SETUP GUIDE
# =================================

## Overview
This guide covers the complete setup and usage of the secure password reset system for AnonConfess.

---

## 🔒 Security Features

✅ **Cryptographically Secure Tokens**
- Uses `crypto.randomBytes(32)` for token generation
- Tokens are hashed with SHA-256 before storage
- 30-minute expiration window
- One-time use tokens (cleared after successful reset)

✅ **Anti-Enumeration Protection**
- Generic success messages regardless of user existence
- Random delays to prevent timing attacks
- Same response whether email exists or not

✅ **Rate Limiting**
- Forgot Password: 3 requests per 15 minutes per IP
- Reset Password: 5 attempts per 15 minutes per IP

✅ **Password Security**
- Minimum 6 characters (can be increased)
- Hashed with bcrypt (strength: 10)
- Password confirmation required

---

## 📧 Email Configuration (Zoho Mail)

### 1. Get Zoho App Password

1. Log in to [Zoho Mail Control Panel](https://accounts.zoho.in/home#security/security)
2. Navigate to **Security** → **App-Specific Passwords**
3. Generate a new password for "AnonConfess Backend"
4. Copy the generated password (you won't see it again)

### 2. Environment Variables

Add to your `.env` file:

```env
# Email Configuration (Zoho)
EMAIL_USER=noreply@anonconfess.in
EMAIL_PASSWORD=your_zoho_app_password_here

# Frontend URL for reset links
FRONTEND_URL=https://your-frontend-domain.com
```

For local development:
```env
FRONTEND_URL=http://localhost:3000
```

### 3. Verify Configuration

When the server starts, you should see:
```
✅ Zoho email service is ready
```

If you see an error, check:
- Email credentials are correct
- Zoho App Password (not regular password)
- SMTP settings match: `smtppro.zoho.in:465`

---

## 🔄 API Endpoints

### 1. Request Password Reset

**Endpoint:** `POST /api/auth/forgot-password`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Always the same):**
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

**Rate Limit:** 3 requests per 15 minutes per IP

**Security Notes:**
- Always returns success (prevents user enumeration)
- Only sends email if user exists AND has a password
- Google-only accounts won't receive reset emails

---

### 2. Reset Password

**Endpoint:** `POST /api/auth/reset-password/:token`

**Request:**
```json
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

**Error Responses:**

Invalid/Expired Token:
```json
{
  "success": false,
  "error": "Invalid or expired reset token. Please request a new password reset."
}
```

Passwords Don't Match:
```json
{
  "success": false,
  "error": "Passwords do not match"
}
```

Password Too Short:
```json
{
  "success": false,
  "error": "Password must be at least 6 characters long"
}
```

**Rate Limit:** 5 requests per 15 minutes per IP

---

## 💾 Database Schema

The User model includes these fields for password reset:

```javascript
{
  resetPasswordToken: {
    type: String,
    select: false // Hidden by default for security
  },
  resetPasswordExpires: {
    type: Date,
    select: false // Hidden by default for security
  }
}
```

**Indexes:**
- `resetPasswordToken`: For efficient token lookups during reset

---

## 🎨 Email Template

The password reset email includes:

✅ **Professional HTML Design**
- Branded header with gradient
- Prominent reset button
- Alternative text link
- Responsive design

✅ **Security Warnings**
- 30-minute expiration notice
- One-time use reminder
- Instructions to ignore if not requested

✅ **Plain Text Fallback**
- Full functionality for email clients that don't support HTML

---

## 🔄 Complete Flow Diagram

```
┌─────────────────┐
│ User Request    │
│ Password Reset  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ POST /api/auth/forgot-password  │
│ Rate Limited: 3/15min           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Find User by Email      │
│ (Check has password)    │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Generate Random Token        │
│ crypto.randomBytes(32)       │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Hash Token (SHA-256)         │
│ Store in DB with 30min exp   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Send Email via Zoho SMTP     │
│ (with unhashed token in URL) │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ User Clicks Reset Link       │
│ /reset-password/:token       │
└────────┬─────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ POST /api/auth/reset-password  │
│ Rate Limited: 5/15min          │
└────────┬───────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Hash Token & Find in DB      │
│ Check expiry < 30min         │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Validate New Password        │
│ (match, length, etc.)        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Hash Password (bcrypt)       │
│ Save to User                 │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Clear Reset Token Fields     │
│ (one-time use)               │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Return Success               │
│ User can now login           │
└──────────────────────────────┘
```

---

## 🧪 Testing the System

### 1. Test Email Delivery (Development)

```bash
# Start server
cd server
npm run dev

# Should see:
# ✅ Zoho email service is ready
```

### 2. Test Forgot Password

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Check email inbox for reset link.

### 3. Test Reset Password

Extract token from email URL, then:

```bash
curl -X POST http://localhost:5000/api/auth/reset-password/TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{"password":"newpass123","confirmPassword":"newpass123"}'
```

### 4. Test Rate Limiting

Make 4 requests quickly to `/forgot-password` - the 4th should be blocked.

### 5. Test Token Expiry

Wait 31 minutes after requesting reset, then try to use the token - should fail.

---

## 🛡️ Security Checklist

- [x] Tokens are cryptographically random
- [x] Tokens are hashed in database
- [x] Tokens expire after 30 minutes
- [x] Tokens are single-use only
- [x] No user enumeration possible
- [x] Rate limiting on both endpoints
- [x] Passwords hashed with bcrypt
- [x] Email sent over SSL (port 465)
- [x] Generic error messages
- [x] Timing attack prevention

---

## 🚨 Common Issues & Solutions

### Email not sending

**Problem:** "Email service verification failed"

**Solutions:**
1. Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
2. Ensure using Zoho App Password, not regular password
3. Check Zoho account is active
4. Verify SMTP access is enabled in Zoho settings

### Token always invalid

**Problem:** "Invalid or expired reset token"

**Solutions:**
1. Check `FRONTEND_URL` matches your actual frontend domain
2. Ensure token from URL is complete (no truncation)
3. Check server time is accurate (for expiry calculation)
4. Verify token hasn't been used already (one-time use)

### Rate limiting too strict

**Problem:** Users getting blocked too often

**Solutions:**
1. Increase `windowMs` or `max` in rate limiters
2. Adjust per environment (looser in dev, strict in prod)
3. Consider implementing per-user limits instead of per-IP

---

## 📊 Monitoring & Logging

The system logs key events:

```
✅ Successful password reset
❌ Failed email sending
⚠️  Rate limit triggered
🔍 Invalid token attempts
```

Monitor these logs for:
- Unusual reset patterns
- Email delivery issues
- Potential abuse attempts
- System health

---

## 🔒 Production Deployment Checklist

Before deploying to production:

- [ ] Update `FRONTEND_URL` to production domain
- [ ] Use strong Zoho App Password
- [ ] Enable HTTPS on frontend and backend
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS settings
- [ ] Monitor rate limit threshold effectiveness
- [ ] Set up email delivery monitoring
- [ ] Configure log aggregation
- [ ] Test complete flow in production environment
- [ ] Document support procedures for reset issues

---

## 📚 Code Reference

**Key Files:**
- `server/models/User.js` - Database schema with reset fields
- `server/routes/auth.js` - Password reset endpoints
- `server/utils/emailService.js` - Email sending logic
- `server/index.js` - Email service initialization

**Key Functions:**
- `User.getResetPasswordToken()` - Generates and hashes token
- `sendPasswordResetEmail()` - Sends formatted email
- `verifyEmailService()` - Validates SMTP configuration

---

## 🆘 Support

For issues or questions:
1. Check server logs for specific errors
2. Verify all environment variables are set
3. Test email service with `verifyEmailService()`
4. Review rate limit headers in responses
5. Check Zoho Mail admin console for delivery status

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
