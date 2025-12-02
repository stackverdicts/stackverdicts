'use client';

import { useState, useRef, useEffect } from 'react';
import AnimatedBackground from './AnimatedBackground';

export default function EmailSignup() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const formLoadTime = useRef<number>(Date.now());

  useEffect(() => {
    formLoadTime.current = Date.now();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      // Silently "succeed" to not tip off the bot
      setStatus('success');
      return;
    }

    // Time-based check - if submitted too fast (under 2 seconds), likely a bot
    const timeSinceLoad = Date.now() - formLoadTime.current;
    if (timeSinceLoad < 2000) {
      setStatus('success');
      return;
    }

    if (!email || !firstName) {
      setErrorMessage('Please fill in all fields');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/email/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          source: 'website_footer',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      setStatus('success');
      setFirstName('');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <section className="relative py-16 overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 uppercase tracking-wide">
            Stay Updated
          </h2>
          <p className="text-lg text-white max-w-2xl mx-auto">
            Get the latest developer tool reviews, hosting comparisons, and tech insights delivered straight to your inbox.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-emerald-500/20 border border-emerald-300/30 rounded-lg p-6 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">You're subscribed!</h3>
            <p className="text-white">Thanks for joining. Check your inbox for a welcome email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            {/* Honeypot field - hidden from real users, bots will fill it */}
            <div className="absolute opacity-0 pointer-events-none" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
              <label htmlFor="website">Website</label>
              <input
                type="text"
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-white/20 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all border-b border-b-gray-300 sm:border-b-white/20 sm:border-r sm:border-r-gray-300"
                disabled={status === 'loading'}
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-white/20 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all border-t-0 sm:border-t sm:border-r-0"
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <span className="uppercase tracking-wide">Subscribe</span>
                )}
              </button>
            </div>

            {status === 'error' && errorMessage && (
              <p className="mt-3 text-red-200 text-sm text-center">{errorMessage}</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
