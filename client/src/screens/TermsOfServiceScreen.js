import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const TermsOfServiceScreen = () => {
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
            Terms of Service
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Last updated: February 6, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 pb-32">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              By accessing or using anonconfess ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Description of Service</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              anonconfess is an anonymous confession platform where users can share thoughts, feelings, and experiences 
              without revealing their identity. All confessions automatically expire after 24 hours.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. User Eligibility</h2>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>You must be at least 13 years old to use this Service</li>
              <li>You must comply with all local laws regarding online conduct</li>
              <li>You must not be prohibited from using the Service under applicable laws</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Prohibited Content and Conduct</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              You agree NOT to post content that:
            </p>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>Is illegal, harmful, threatening, abusive, harassing, or defamatory</li>
              <li>Contains hate speech, discrimination, or promotes violence</li>
              <li>Contains explicit sexual content or pornography</li>
              <li>Exploits or endangers minors in any way</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains personal information of others without consent</li>
              <li>Contains spam, phishing attempts, or malicious links</li>
              <li>Impersonates any person or entity</li>
              <li>Encourages self-harm or suicide</li>
              <li>Contains graphic violence or gore</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Content Moderation</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>Remove any content that violates these Terms</li>
              <li>Suspend or terminate accounts that repeatedly violate these Terms</li>
              <li>Use automated systems to detect and block prohibited content</li>
              <li>Cooperate with law enforcement when legally required</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-3">
              <strong>Important:</strong> While content is anonymous, serious violations (threats, illegal activity) may 
              result in disclosure to authorities if legally required.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Rate Limits</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              To prevent spam and abuse, we enforce rate limits:
            </p>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>Maximum 5 confessions per day per device</li>
              <li>Maximum 20 replies per day per device</li>
              <li>Maximum 2-5 active confessions at any time (default: 2)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Intellectual Property</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              You retain ownership of content you post. By posting, you grant us a worldwide, non-exclusive, 
              royalty-free license to use, display, and distribute your content for the purpose of operating the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Disclaimers</h2>
            <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2 ml-4">
              <li>The Service is provided "AS IS" without warranties of any kind</li>
              <li>We do not endorse or verify user-generated content</li>
              <li>We are not responsible for advice or opinions shared by users</li>
              <li>Anonymity is not absolute - legal authorities may compel disclosure</li>
              <li>This is not a crisis service - please contact emergency services if needed</li>
            </ul>
          </section>

          <section className="mb-8 bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-800">
            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-400 mb-4">⚠️ Crisis Resources</h2>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed mb-3">
              If you're in crisis or contemplating self-harm:
            </p>
            <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 space-y-2 ml-4">
              <li><strong>National Suicide Prevention Lifeline:</strong> 988 (US)</li>
              <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
              <li><strong>International:</strong> findahelpline.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              To the maximum extent permitted by law, anonconfess and its operators shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">10. Indemnification</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              You agree to indemnify and hold harmless anonconfess from any claims, damages, or expenses arising from 
              your violation of these Terms or your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">11. Changes to Terms</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. 
              Continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">12. Termination</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We reserve the right to terminate or suspend access to the Service immediately, without prior notice, 
              for any violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">13. Governing Law</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to 
              conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">14. Contact</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              For questions about these Terms, please use the Report feature on our platform or contact us through 
              the available channels.
            </p>
          </section>

          <div className="mt-12 p-6 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-slate-700 dark:text-slate-300 text-sm">
              <strong>Summary:</strong> Be respectful, be kind, and use this space responsibly. We're here to provide 
              a safe space for anonymous expression, not a platform for harm.
            </p>
          </div>

        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default TermsOfServiceScreen;
