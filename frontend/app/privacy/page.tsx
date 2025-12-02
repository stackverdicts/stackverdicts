import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import EmailSignup from '../components/EmailSignup';
import AnimatedBackground from '../components/AnimatedBackground';

export default function PrivacyPage() {
  return (
    <>
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[200px] md:min-h-[240px] flex items-center overflow-hidden">
          <AnimatedBackground />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight text-white drop-shadow-lg">
                Privacy Policy
              </h1>
              <p className="text-lg md:text-xl text-gray-100 leading-relaxed drop-shadow-md">
                How we collect, use, and protect your information.
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-12 md:py-16">
          <div
            className="prose prose-base md:prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-2xl prose-h2:mb-2 prose-h2:mt-8
              prose-h3:text-xl prose-h3:mb-1 prose-h3:mt-5
              prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:text-indigo-700 hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
              prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
              prose-li:text-gray-800 prose-li:my-0.5 prose-li:marker:text-emerald-600 prose-li:marker:font-semibold
              [&_li:first-child]:mt-0"
          >
            <h2>Information We Collect</h2>
            <p>When you interact with StackVerdicts, we may collect:</p>
            <ul>
              <li>Name and email address when you subscribe to our newsletter</li>
              <li>IP address and browser information for security and analytics</li>
              <li>Information about how you interact with our content and links</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <ul>
              <li>To send you newsletters and updates you've subscribed to</li>
              <li>To improve our website and content</li>
              <li>To track affiliate link performance</li>
              <li>To respond to your inquiries</li>
            </ul>

            <h2>Affiliate Links Disclosure</h2>
            <p>
              StackVerdicts participates in affiliate marketing programs. This means we may earn a commission
              when you click on affiliate links and make a purchase. When you click an affiliate link, the
              third-party merchant may place cookies on your device to track the referral. These cookies are
              governed by the respective merchant's privacy policy.
            </p>

            <h2>Cookies</h2>
            <p>We use cookies to:</p>
            <ul>
              <li>Remember your preferences (such as dismissing popups)</li>
              <li>Understand how visitors use our site</li>
              <li>Track affiliate referrals through third-party merchant cookies</li>
            </ul>
            <p>
              You can disable cookies in your browser settings, though this may affect site functionality.
            </p>

            <h2>Email Communications</h2>
            <p>
              If you subscribe to our newsletter, we use a third-party email service to send communications.
              We track email opens and clicks to improve our content. You can unsubscribe at any time using
              the link at the bottom of any email.
            </p>

            <h2>Third-Party Services</h2>
            <p>
              We use third-party services for email delivery and affiliate tracking. These services may
              receive your data as necessary to perform their functions. We do not sell your personal
              information to third parties.
            </p>

            <h2>Data Security</h2>
            <p>
              We implement reasonable security measures to protect your information. However, no method of
              transmission over the internet is 100% secure.
            </p>

            <h2>Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal information by
              contacting us. You can unsubscribe from emails at any time.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Changes will be posted on this page.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about this policy? Contact us at{' '}
              <a href="/contact">our contact page</a>.
            </p>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last Updated: December 2024
            </p>
          </div>
        </div>
      </main>

      <EmailSignup />
      <Footer />
    </>
  );
}
