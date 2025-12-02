import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import EmailSignup from '../components/EmailSignup';
import AnimatedBackground from '../components/AnimatedBackground';

export default function TermsPage() {
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
                Terms of Service
              </h1>
              <p className="text-lg md:text-xl text-gray-100 leading-relaxed drop-shadow-md">
                Terms and conditions for using StackVerdicts.
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
            <h2>Agreement to Terms</h2>
            <p>
              By accessing StackVerdicts, you agree to these Terms of Service. If you do not agree,
              please do not use this website.
            </p>

            <h2>Use of Content</h2>
            <p>
              All content on this website, including articles, videos, and graphics, is for informational
              purposes only. You may view and share our content for personal, non-commercial use. You may
              not reproduce, distribute, or republish our content without permission.
            </p>

            <h2>Affiliate Disclosure</h2>
            <p>
              StackVerdicts contains affiliate links. When you click these links and make a purchase, we
              may earn a commission at no additional cost to you. This helps support our content. Our
              opinions and recommendations are our own and are not influenced by affiliate relationships.
            </p>

            <h2>Disclaimer</h2>
            <p>
              Content is provided "as is" without warranties of any kind. We strive for accuracy but do
              not guarantee that all information is complete, current, or error-free. Product features,
              prices, and availability may change. Always verify information with the product provider
              before making purchasing decisions.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              StackVerdicts shall not be liable for any damages arising from your use of this website or
              reliance on its content. This includes but is not limited to direct, indirect, incidental,
              or consequential damages.
            </p>

            <h2>External Links</h2>
            <p>
              This website contains links to third-party websites. We are not responsible for the content,
              privacy practices, or terms of service of external sites. Accessing external links is at your
              own risk.
            </p>

            <h2>Email Subscriptions</h2>
            <p>
              By subscribing to our newsletter, you consent to receive periodic emails from us. You may
              unsubscribe at any time using the link provided in each email.
            </p>

            <h2>Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the website after
              changes constitutes acceptance of the updated terms.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about these terms? Contact us at{' '}
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
