import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const PrivacyPolicyScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/50 dark:bg-surface-dark/50 backdrop-blur-xl border-b border-white/10 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Last updated: February 6, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 pb-32">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Welcome to anonconfess ("we," "our," or "us"). We are committed to protecting your privacy and ensuring your anonymity. 
              This Privacy Policy explains how we collect, use, and safeguard your information when you use our anonymous confession platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-6 mb-3">2.1 Account Information (Optional)</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              If you choose to create an account via Google OAuth:
            </p>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>Email address</li>
              <li>Display name</li>
              <li>Profile picture</li>
              <li>Google ID (for authentication)</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-6 mb-3">2.2 Anonymous Usage Data</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              To maintain platform integrity while preserving anonymity:
            </p>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>Device fingerprint hash (for rate limiting and abuse prevention)</li>
              <li>Hashed IP address (never stored in plain text)</li>
              <li>Browser type and version (for compatibility)</li>
              <li>Timestamp of activities</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mt-6 mb-3">2.3 Content Data</h3>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>Confessions and replies you post (public and anonymous)</li>
              <li>Hashtags you use</li>
              <li>Images you upload (optional)</li>
              <li>Likes and interactions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>To provide and maintain the anonymous confession service</li>
              <li>To prevent spam, abuse, and enforce rate limits</li>
              <li>To improve user experience and platform features</li>
              <li>To detect and prevent violations of our Terms of Service</li>
              <li>To comply with legal obligations when required</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Anonymity Protection</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              <strong>Your confessions are anonymous by design:</strong>
            </p>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>We do NOT link confessions to user accounts publicly</li>
              <li>Only you can see which confessions you posted (when logged in)</li>
              <li>Other users cannot see who posted any confession</li>
              <li>IP addresses are hashed with HMAC-SHA256 and never stored in plain text</li>
              <li>Device fingerprints are one-way hashed and cannot be reversed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Data Retention</h2>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li><strong>Confessions:</strong> Automatically deleted after 24 hours</li>
              <li><strong>Replies:</strong> Deleted when parent confession expires</li>
              <li><strong>Account data:</strong> Retained until you delete your account</li>
              <li><strong>Logs and analytics:</strong> Retained for up to 90 days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Third-Party Services</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li><strong>Google OAuth:</strong> For optional account authentication</li>
              <li><strong>MongoDB Atlas:</strong> Database hosting (encrypted at rest)</li>
              <li><strong>Upstash Redis:</strong> For rate limiting and caching</li>
              <li><strong>Render:</strong> Backend hosting</li>
              <li><strong>Vercel:</strong> Frontend hosting and CDN</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Cookies and Local Storage</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We use HTTP-only cookies for authentication (JWT tokens) and local storage for user preferences. 
              You can clear these at any time through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Data Security</h2>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>All data transmitted over HTTPS/TLS encryption</li>
              <li>Passwords hashed with bcrypt (if email/password auth is used)</li>
              <li>Database access restricted by IP whitelist and authentication</li>
              <li>Regular security updates and monitoring</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Your Rights</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>Access your account data</li>
              <li>Delete your confessions before they auto-expire</li>
              <li>Delete your account at any time</li>
              <li>Export your data (contact us)</li>
              <li>Opt-out of analytics (by disabling cookies)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">10. Children's Privacy</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Our service is not intended for users under 13 years of age. We do not knowingly collect personal 
              information from children under 13. If you believe we have collected such information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">11. Changes to This Policy</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated 
              "Last updated" date. Continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">12. Contact Us</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us through the Report feature on our platform.
            </p>
          </section>

        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PrivacyPolicyScreen;
