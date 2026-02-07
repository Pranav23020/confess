const nodemailer = require('nodemailer');

/**
 * Zoho SMTP Configuration
 * Production-ready email service for password reset
 */
const createTransporter = () => {
    const emailUser = process.env.EMAIL_USER || 'noreply@anonconfess.in';
    const emailPassword = process.env.EMAIL_PASSWORD;

    console.log('📧 Email Service Configuration:');
    console.log(`   EMAIL_USER: ${emailUser}`);
    console.log(`   EMAIL_PASSWORD: ${emailPassword ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`   Password length: ${emailPassword ? emailPassword.length : 0} chars`);
    console.log(`   SMTP Host: smtppro.zoho.in:465 (SSL)`);

    if (!emailPassword) {
        console.error('❌ EMAIL_PASSWORD environment variable is not set!');
    }

    const config = {
        host: 'smtppro.zoho.in',
        port: 465,
        secure: true, // SSL
        auth: {
            user: emailUser,
            pass: emailPassword
        },
        // Connection timeout settings for production
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        // Debug logging
        logger: true,
        debug: true
    };

    console.log('🔗 Creating Nodemailer transporter with SSL...');
    return nodemailer.createTransport(config);
};

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.resetUrl - Password reset URL
 * @param {string} options.username - User's username
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetEmail = async ({ email, resetUrl, username }) => {
    try {
        console.log(`\n📧 Sending password reset email to: ${email}`);
        
        const transporter = createTransporter();

        const mailOptions = {
            from: '"AnonConfess" <noreply@anonconfess.in>',
            to: email,
            subject: 'Reset your AnonConfess password',
            html: generateResetEmailTemplate({ resetUrl, username }),
            text: generateResetEmailText({ resetUrl, username })
        };

        console.log('   Connecting to Zoho SMTP...');
        const startTime = Date.now();
        
        const info = await transporter.sendMail(mailOptions);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Password reset email sent successfully!`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Time: ${duration}ms`);
        console.log(`   To: ${email}`);
        
        return true;
    } catch (error) {
        console.error(`\n❌ Failed to send password reset email to ${email}`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        
        // Log full error for debugging
        if (process.env.NODE_ENV === 'development') {
            console.error('   Full error:', error);
        }
        
        // Don't throw - we'll return false to indicate failure
        return false;
    }
};

/**
 * Generate HTML email template for password reset
 */
const generateResetEmailTemplate = ({ resetUrl, username }) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f172a;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                🔐 AnonConfess
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 22px; font-weight: 600;">
                                Reset Your Password
                            </h2>
                            
                            <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                                Hi <strong style="color: #f1f5f9;">${username || 'there'}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 24px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your password for your AnonConfess account. Click the button below to create a new password:
                            </p>
                            
                            <!-- Reset Button -->
                            <table role="presentation" style="margin: 0 0 24px;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${resetUrl}" 
                                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(103, 126, 234, 0.3);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <div style="padding: 20px; background-color: #0f172a; border-radius: 8px; margin: 0 0 24px; border-left: 4px solid #667eea;">
                                <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Or copy this link:
                                </p>
                                <p style="margin: 0; color: #667eea; font-size: 13px; word-break: break-all; line-height: 1.5;">
                                    ${resetUrl}
                                </p>
                            </div>
                            
                            <!-- Warning -->
                            <div style="padding: 16px; background-color: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 4px solid #ef4444; margin: 0 0 24px;">
                                <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
                                    <strong style="color: #ef4444;">⚠️ Important:</strong> This link expires in <strong>30 minutes</strong> and can only be used once.
                                </p>
                            </div>
                            
                            <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                                If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                            </p>
                            
                            <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                                For security reasons, we cannot tell you if this email address is associated with an AnonConfess account.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155;">
                            <p style="margin: 0 0 12px; color: #64748b; font-size: 14px;">
                                <strong>AnonConfess</strong> - Share anonymously, connect authentically
                            </p>
                            <p style="margin: 0; color: #475569; font-size: 12px;">
                                This is an automated email. Please do not reply.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

/**
 * Generate plain text version for email clients that don't support HTML
 */
const generateResetEmailText = ({ resetUrl, username }) => {
    return `
Reset Your AnonConfess Password

Hi ${username || 'there'},

We received a request to reset your password for your AnonConfess account.

To reset your password, click the link below or copy it into your browser:
${resetUrl}

⚠️ IMPORTANT:
- This link expires in 30 minutes
- It can only be used once
- If you didn't request this reset, please ignore this email

Your password will remain unchanged if you don't click the link.

---
AnonConfess - Share anonymously, connect authentically
This is an automated email. Please do not reply.
`;
};

/**
 * Verify email service configuration
 * Should be called on server startup
 */
const verifyEmailService = async () => {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║          🔍 COMPREHENSIVE EMAIL SERVICE DIAGNOSTICS           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        // ========== ENVIRONMENT CHECK ==========
        console.log('📋 STEP 1: Environment Variables Check');
        console.log('─────────────────────────────────────────────────────────────');
        
        const emailUser = process.env.EMAIL_USER;
        const emailPassword = process.env.EMAIL_PASSWORD;
        const frontendUrl = process.env.FRONTEND_URL;
        const nodeEnv = process.env.NODE_ENV;
        
        console.log(`   EMAIL_USER:    ${emailUser ? `✅ ${emailUser}` : '❌ NOT SET'}`);
        console.log(`   EMAIL_PASSWORD: ${emailPassword ? `✅ Set (${emailPassword.length} chars)` : '❌ NOT SET'}`);
        console.log(`   FRONTEND_URL:  ${frontendUrl ? `✅ ${frontendUrl}` : '⚠️  NOT SET (using default)'}`);
        console.log(`   NODE_ENV:      ${nodeEnv ? `✅ ${nodeEnv}` : '⚠️  development'}`);

        if (!emailUser || !emailPassword) {
            console.error('\n❌ FATAL: Missing EMAIL_USER or EMAIL_PASSWORD!\n');
            return false;
        }

        // ========== CONFIGURATION VALIDATION ==========
        console.log('\n✔️ STEP 2: Configuration Validation');
        console.log('─────────────────────────────────────────────────────────────');
        
        const passwordLength = emailPassword.length;
        const hasSpaces = emailPassword.includes(' ');
        
        console.log(`   Password Length: ${passwordLength} chars`);
        if (passwordLength < 20) {
            console.warn(`   ⚠️  WARNING: Password seems short (${passwordLength} chars)`);
            console.warn(`       Zoho App Passwords are typically 30-50+ characters`);
            console.warn(`       Check if you copied the COMPLETE password from Zoho`);
        } else {
            console.log(`   ✅ Password length looks good`);
        }
        
        console.log(`   Contains Spaces: ${hasSpaces ? '❌ YES (remove them!)' : '✅ NO (correct)'}`);
        if (hasSpaces) {
            console.warn(`   ⚠️  PASSWORD CONTAINS SPACES - This will fail!`);
            console.warn(`       Paste without spaces: ${emailPassword.replace(/ /g, '')}`);
        }

        // ========== SMTP CONFIGURATION ==========
        console.log('\n🔗 STEP 3: SMTP Configuration');
        console.log('─────────────────────────────────────────────────────────────');
        console.log(`   SMTP Host:        smtppro.zoho.in`);
        console.log(`   SMTP Port:        465 (SSL)`);
        console.log(`   Authentication:   Enabled`);
        console.log(`   Encryption:       SSL/TLS`);
        console.log(`   Connection Type:  Secure`);

        // ========== FRONTEND SETUP CHECK ==========
        console.log('\n🌐 STEP 4: Frontend Setup Check');
        console.log('─────────────────────────────────────────────────────────────');
        
        if (!frontendUrl) {
            console.warn(`   ⚠️  FRONTEND_URL not set`);
            console.warn(`       Password reset emails will use default URL`);
            console.warn(`       Set FRONTEND_URL to your actual domain`);
        } else {
            const urlObj = new URL(frontendUrl).href;
            console.log(`   ✅ Frontend URL: ${frontendUrl}`);
            console.log(`   ✅ Reset Link Format: ${frontendUrl}/reset-password/:token`);
            
            // Check if URL is valid
            if (!frontendUrl.startsWith('http')) {
                console.error(`   ❌ INVALID: URL must start with http:// or https://`);
            }
            if (frontendUrl.endsWith('/')) {
                console.warn(`   ⚠️  URL ends with slash - consider removing it`);
            }
        }

        // ========== NETWORK CONNECTIVITY ==========
        console.log('\n📡 STEP 5: Network Connectivity Check');
        console.log('─────────────────────────────────────────────────────────────');
        
        try {
            const dns = require('dns').promises;
            console.log(`   Attempting DNS resolution for smtppro.zoho.in...`);
            const addresses = await dns.resolve4('smtppro.zoho.in');
            console.log(`   ✅ DNS Resolution: Success`);
            console.log(`   ✅ Zoho IP Addresses: ${addresses.join(', ')}`);
            console.log(`   ✅ Network connectivity: OK`);
        } catch (dnsError) {
            console.error(`   ❌ DNS Resolution Failed: ${dnsError.message}`);
            console.error(`   ❌ Cannot reach smtppro.zoho.in`);
            console.error(`   💡 Possible causes:`);
            console.error(`      - No internet connection`);
            console.error(`      - Firewall blocking DNS`);
            console.error(`      - Zoho server temporarily down`);
            return false;
        }

        // ========== NODEMAILER CONNECTION ==========
        console.log('\n🔌 STEP 6: Nodemailer Connection Test');
        console.log('─────────────────────────────────────────────────────────────');
        
        const transporter = createTransporter();
        console.log(`   Creating Nodemailer transporter...`);
        console.log(`   Timeout Settings:`);
        console.log(`      - Connection Timeout: 10 seconds`);
        console.log(`      - Greeting Timeout: 10 seconds`);
        console.log(`      - Socket Timeout: 10 seconds`);

        console.log(`\n   Attempting SMTP handshake...`);
        const startTime = Date.now();
        
        await transporter.verify();
        
        const duration = Date.now() - startTime;
        console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
        console.log(`║              ✅ EMAIL SERVICE READY - SUCCESS! ✅              ║`);
        console.log(`╚═══════════════════════════════════════════════════════════════╝`);
        console.log(`\n   Connection Details:`);
        console.log(`   ✅ SMTP Server:    smtppro.zoho.in:465`);
        console.log(`   ✅ Email Account:  ${emailUser}`);
        console.log(`   ✅ Connection Time: ${duration}ms`);
        console.log(`   ✅ Status:         Ready to send emails`);
        console.log(`   ✅ Frontend URL:   ${frontendUrl || 'default'}`);
        console.log(`\n   Password reset emails will be sent to users at:`)
        console.log(`   📧 From: AnonConfess <${emailUser}>`);
        console.log(`   🔗 Reset Link: ${frontendUrl || 'https://anonconfess.in'}/reset-password/:token\n`);
        
        return true;
    } catch (error) {
        const startTime = Date.now();
        
        console.error(`\n╔═══════════════════════════════════════════════════════════════╗`);
        console.error(`║            ❌ EMAIL SERVICE VERIFICATION FAILED ❌             ║`);
        console.error(`╚═══════════════════════════════════════════════════════════════╝\n`);
        
        console.error(`   Error Type:    ${error.name}`);
        console.error(`   Error Message: ${error.message}`);
        console.error(`   Error Code:    ${error.code || 'N/A'}`);

        // ========== DETAILED DIAGNOSTICS ==========
        console.error(`\n🔍 STEP 7: Detailed Diagnostics`);
        console.error(`─────────────────────────────────────────────────────────────`);

        if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
            console.error(`\n⏱️  ISSUE: Connection Timeout (took 10+ seconds)`);
            console.error(`\n💡 DIAGNOSIS - Possible causes:`);
            console.error(`\n   1️⃣  PASSWORD ISSUE (Most Common)`);
            console.error(`       ❌ EMAIL_PASSWORD might be:`);
            console.error(`          - Incomplete or truncated`);
            console.error(`          - Contains spaces (should not)`);
            console.error(`          - Wrong account password (not App Password)`);
            console.error(`       ✅ Solution:`);
            console.error(`          - Go to https://accounts.zoho.in/home#security/security`);
            console.error(`          - Find "App-Specific Passwords"`);
            console.error(`          - Generate a NEW one for "AnonConfess Backend"`);
            console.error(`          - Copy the ENTIRE password (no spaces)`);
            console.error(`          - Paste in Render without any spaces`);

            console.error(`\n   2️⃣  NETWORK/FIREWALL ISSUE`);
            console.error(`       ❌ Render might be blocked:`);
            console.error(`          - Port 465 blocked by firewall`);
            console.error(`          - Render IP whitelisted in Zoho`);
            console.error(`          - ISP blocking SMTP`);
            console.error(`       ✅ Solution:`);
            console.error(`          - Check Zoho allows SMTP access`);
            console.error(`          - Verify no IP restrictions on Zoho account`);
            console.error(`          - Try contacting Zoho support`);

            console.error(`\n   3️⃣  ZOHO SERVER ISSUE`);
            console.error(`       ❌ Zoho servers might be:`);
            console.error(`          - Temporarily down`);
            console.error(`          - Experiencing issues`);
            console.error(`          - Under maintenance`);
            console.error(`       ✅ Solution:`);
            console.error(`          - Wait a few minutes and redeploy`);
            console.error(`          - Check Zoho status page`);

            console.error(`\n   4️⃣  RENDER DEPLOYMENT ISSUE`);
            console.error(`       ❌ Environment might not be synced`);
            console.error(`       ✅ Solution:`);
            console.error(`          - Verify EMAIL_PASSWORD is correct in Render`);
            console.error(`          - Redeploy the service`);
            console.error(`          - Check environment variables were saved`);
        } else if (error.message.includes('Invalid login') || error.message.includes('Authentication')) {
            console.error(`\n🔐 ISSUE: Authentication Failed`);
            console.error(`\n💡 DIAGNOSIS:`);
            console.error(`   ❌ Email credentials are WRONG`);
            console.error(`   ✅ Solution:`);
            console.error(`      - EMAIL_USER: noreply@anonconfess.in (correct?)`);
            console.error(`      - EMAIL_PASSWORD: Generate NEW one from Zoho`);
            console.error(`      - Make sure it's App Password, not regular password`);
            console.error(`      - Copy ENTIRE password without spaces`);
        } else if (error.message.includes('ENOTFOUND')) {
            console.error(`\n🌐 ISSUE: DNS Resolution Failed`);
            console.error(`\n💡 DIAGNOSIS:`);
            console.error(`   ❌ Cannot resolve smtppro.zoho.in`);
            console.error(`   ❌ No internet connection or DNS issue`);
            console.error(`   ✅ Solution:`);
            console.error(`      - Check Render has internet access`);
            console.error(`      - Try redeploy`);
            console.error(`      - Contact Render support if persists`);
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error(`\n🔌 ISSUE: Connection Refused`);
            console.error(`\n💡 DIAGNOSIS:`);
            console.error(`   ❌ Zoho SMTP server refused connection`);
            console.error(`   ❌ Port 465 might not be accessible`);
            console.error(`   ✅ Solution:`);
            console.error(`      - Verify SMTP access enabled on Zoho account`);
            console.error(`      - Check port 465 is correct (not 587 or 25)`);
            console.error(`      - Contact Zoho support`);
        }

        // ========== ENVIRONMENT VARIABLE CHECK ==========
        console.error(`\n⚙️  STEP 8: Environment Variables in Use`);
        console.error(`─────────────────────────────────────────────────────────────`);
        console.error(`   EMAIL_USER:    ${process.env.EMAIL_USER || '❌ NOT SET'}`);
        console.error(`   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? `✅ Set (${process.env.EMAIL_PASSWORD.length} chars)` : '❌ NOT SET'}`);
        console.error(`   FRONTEND_URL:  ${process.env.FRONTEND_URL || '⚠️  NOT SET'}`);
        console.error(`   NODE_ENV:      ${process.env.NODE_ENV || 'development'}`);

        // ========== VERCEL/FRONTEND CHECK ==========
        console.error(`\n🌐 STEP 9: Vercel/Frontend Configuration Check`);
        console.error(`─────────────────────────────────────────────────────────────`);
        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) {
            console.error(`   ⚠️  FRONTEND_URL is not set`);
            console.error(`       Password reset links will not work properly`);
        } else {
            try {
                new URL(frontendUrl);
                console.error(`   ✅ FRONTEND_URL is valid: ${frontendUrl}`);
            } catch {
                console.error(`   ❌ FRONTEND_URL is INVALID format: ${frontendUrl}`);
                console.error(`       Must be: https://anonconfess.in or https://domain.vercel.app`);
            }
        }

        console.error(`\n📞 NEXT STEPS:`);
        console.error(`   1. Check the diagnostics above for your specific issue`);
        console.error(`   2. Update the recommended environment variable`);
        console.error(`   3. Redeploy the service`);
        console.error(`   4. Check logs again`);
        console.error(`\n═══════════════════════════════════════════════════════════════\n`);
        
        return false;
    }
};

module.exports = {
    sendPasswordResetEmail,
    verifyEmailService
};
