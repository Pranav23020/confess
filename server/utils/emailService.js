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
    console.log('\n🔍 VERIFYING EMAIL SERVICE...');
    console.log('═══════════════════════════════════════════════════════════════');

    try {
        // Check environment variables
        const emailUser = process.env.EMAIL_USER;
        const emailPassword = process.env.EMAIL_PASSWORD;
        const frontendUrl = process.env.FRONTEND_URL;

        console.log('\n📋 Environment Variable Check:');
        console.log(`   EMAIL_USER: ${emailUser ? `✅ ${emailUser}` : '❌ NOT SET'}`);
        console.log(`   EMAIL_PASSWORD: ${emailPassword ? `✅ Set (${emailPassword.length} chars)` : '❌ NOT SET'}`);
        console.log(`   FRONTEND_URL: ${frontendUrl ? `✅ ${frontendUrl}` : '⚠️  Using default'}`);

        if (!emailUser || !emailPassword) {
            console.error('\n❌ Missing EMAIL_USER or EMAIL_PASSWORD!');
            console.error('   Please set these environment variables:');
            console.error('   - EMAIL_USER=noreply@anonconfess.in');
            console.error('   - EMAIL_PASSWORD=your_zoho_app_password');
            return false;
        }

        console.log('\n🔗 Attempting SMTP Connection to Zoho...');
        console.log('   Host: smtppro.zoho.in');
        console.log('   Port: 465 (SSL)');
        console.log('   Timeout: 10 seconds');

        const transporter = createTransporter();

        console.log('\n✔️  Verifying SMTP connection...');
        const startTime = Date.now();
        
        await transporter.verify();
        
        const duration = Date.now() - startTime;
        console.log(`\n✅ ZOHO SMTP CONNECTION SUCCESSFUL!`);
        console.log(`   ⏱️  Connection time: ${duration}ms`);
        console.log(`   📧 Email: ${emailUser}`);
        console.log(`   🔐 Ready to send password reset emails`);
        console.log('═══════════════════════════════════════════════════════════════\n');
        
        return true;
    } catch (error) {
        const duration = Date.now() - (Date.now() - 10000); // Approximate
        
        console.error('\n❌ EMAIL SERVICE VERIFICATION FAILED');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error(`   Error Type: ${error.name}`);
        console.error(`   Error Message: ${error.message}`);
        console.error(`   Error Code: ${error.code || 'N/A'}`);
        
        if (error.message.includes('timeout')) {
            console.error('\n🔍 DIAGNOSIS: Connection Timeout');
            console.error('   Possible causes:');
            console.error('   1. ❌ EMAIL_PASSWORD is incorrect or incomplete');
            console.error('   2. ❌ Zoho servers are unreachable from this network');
            console.error('   3. ⚠️  Firewall is blocking port 465');
            console.error('   4. ⚠️  Network connectivity issue');
            console.error('\n   Solutions:');
            console.error('   - Verify EMAIL_PASSWORD is the complete Zoho App Password');
            console.error('   - Try regenerating a new Zoho App Password');
            console.error('   - Check if port 465 (SSL SMTP) is accessible');
        } else if (error.message.includes('Invalid login')) {
            console.error('\n🔍 DIAGNOSIS: Authentication Failed');
            console.error('   Possible causes:');
            console.error('   1. ❌ EMAIL_PASSWORD is wrong');
            console.error('   2. ❌ EMAIL_USER is incorrect');
            console.error('\n   Try:');
            console.error('   - Generate a NEW Zoho App Password');
            console.error('   - Copy the ENTIRE password (not just part of it)');
        }
        
        console.error('\n📞 Debug Info:');
        console.error(`   Full Error: ${error.toString()}`);
        console.error('═══════════════════════════════════════════════════════════════\n');
        
        return false;
    }
};

module.exports = {
    sendPasswordResetEmail,
    verifyEmailService
};
