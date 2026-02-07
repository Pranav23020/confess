/**
 * Email Service Test Script
 * Run this to verify your Zoho email configuration
 * 
 * Usage: node test-email.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sendPasswordResetEmail, verifyEmailService } = require('./utils/emailService');

async function testEmailConfiguration() {
    console.log('\n🔍 Testing Email Configuration...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Missing'}`);
    console.log(`   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing'}`);
    console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:3000 (default)'}`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('\n❌ Missing email configuration!');
        console.log('   Please set EMAIL_USER and EMAIL_PASSWORD in your .env file');
        console.log('   See .env.example for reference\n');
        process.exit(1);
    }
    
    // Test SMTP connection
    console.log('\n🔌 Testing SMTP Connection...');
    const isVerified = await verifyEmailService();
    
    if (!isVerified) {
        console.log('\n❌ Email service verification failed!');
        console.log('   Check your Zoho App Password and credentials\n');
        process.exit(1);
    }
    
    // Prompt for test email (optional)
    console.log('\n📧 Would you like to send a test email?');
    console.log('   Edit this file and set TEST_EMAIL to your email address');
    console.log('   Then run: node test-email.js\n');
    
    const TEST_EMAIL = process.env.TEST_EMAIL || null;
    
    if (TEST_EMAIL) {
        console.log(`   Sending test email to: ${TEST_EMAIL}`);
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const testResetUrl = `${frontendUrl}/reset-password/test-token-abc123def456`;
        
        try {
            const sent = await sendPasswordResetEmail({
                email: TEST_EMAIL,
                resetUrl: testResetUrl,
                username: 'TestUser'
            });
            
            if (sent) {
                console.log('   ✅ Test email sent successfully!');
                console.log('   Check your inbox (and spam folder)\n');
            } else {
                console.log('   ❌ Failed to send test email');
                console.log('   Check server logs for details\n');
            }
        } catch (error) {
            console.log('   ❌ Error sending test email:', error.message);
        }
    } else {
        console.log('   💡 To send a test email, set TEST_EMAIL in your .env:');
        console.log('      TEST_EMAIL=your-email@example.com\n');
    }
    
    console.log('✅ Email configuration test complete!\n');
}

// Run the test
testEmailConfiguration().catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
