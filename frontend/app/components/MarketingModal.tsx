'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

interface MarketingPopup {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  display_frequency: 'once_per_session' | 'every_page_view' | 'once_per_day' | 'once_per_week';
  delay_seconds: number;
}

const COOKIE_NAME = 'marketing_popup_dismissed';
const COOKIE_DAYS = 30;

export default function MarketingModal() {
  const [popup, setPopup] = useState<MarketingPopup | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', website: '', consent: false }); // website is honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [popupEnabled, setPopupEnabled] = useState(true);
  const pathname = usePathname();

  const checkDisplayFrequency = useCallback((popupData: MarketingPopup): boolean => {
    const storageKey = `popup_${popupData.id}`;
    const lastShown = localStorage.getItem(storageKey);

    switch (popupData.display_frequency) {
      case 'every_page_view':
        // Always show
        return true;

      case 'once_per_session':
        // Check sessionStorage
        const sessionKey = `popup_session_${popupData.id}`;
        if (sessionStorage.getItem(sessionKey)) {
          return false;
        }
        sessionStorage.setItem(sessionKey, 'true');
        return true;

      case 'once_per_day':
        if (lastShown) {
          const lastDate = new Date(parseInt(lastShown));
          const now = new Date();
          const daysSinceShown = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceShown < 1) {
            return false;
          }
        }
        localStorage.setItem(storageKey, Date.now().toString());
        return true;

      case 'once_per_week':
        if (lastShown) {
          const lastDate = new Date(parseInt(lastShown));
          const now = new Date();
          const daysSinceShown = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceShown < 7) {
            return false;
          }
        }
        localStorage.setItem(storageKey, Date.now().toString());
        return true;

      default:
        return false;
    }
  }, []);

  useEffect(() => {
    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    // Don't show popups on admin pages or login page
    if (pathname?.startsWith('/admin') || pathname === '/login') {
      // Clear any existing popup state
      setPopup(null);
      setIsVisible(false);
      return;
    }

    // Check if user has dismissed popup via cookie
    const dismissed = Cookies.get(COOKIE_NAME);
    if (dismissed) {
      return;
    }

    const fetchAndShowPopup = async () => {
      try {
        // Check if popups are enabled globally
        const settingsResponse = await fetch('http://localhost:3001/api/settings');
        const settingsData = await settingsResponse.json();
        const settingsByCategory = settingsData.settings || {};

        // Flatten settings from all categories
        const allSettings = Object.values(settingsByCategory).flat() as any[];
        const popupSetting = allSettings.find((s: any) => s.setting_key === 'popup_enabled');
        const enabled = popupSetting ? popupSetting.setting_value === true || popupSetting.setting_value === 'true' : true;

        setPopupEnabled(enabled);

        if (!enabled) {
          return;
        }

        const response = await fetch('http://localhost:3001/api/marketing-popups/active');
        const data = await response.json();

        if (data.popup) {
          const shouldShow = checkDisplayFrequency(data.popup);

          if (shouldShow) {
            setPopup(data.popup);

            // Apply delay if specified
            const delay = data.popup.delay_seconds * 1000;
            const newTimeoutId = setTimeout(() => {
              // Double-check pathname and cookie before showing
              if (!window.location.pathname.startsWith('/admin') &&
                  window.location.pathname !== '/login' &&
                  !Cookies.get(COOKIE_NAME)) {
                setIsVisible(true);
              }
            }, delay);
            setTimeoutId(newTimeoutId);
          }
        }
      } catch (error) {
        console.error('Failed to fetch marketing popup:', error);
      }
    };

    fetchAndShowPopup();

    // Cleanup timeout on unmount or pathname change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pathname, checkDisplayFrequency]);

  const handleClose = () => {
    // Set cookie for 30 days
    Cookies.set(COOKIE_NAME, 'true', { expires: COOKIE_DAYS });

    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Honeypot check - if website field is filled, it's a bot
    if (formData.website) {
      // Silently "succeed" to not tip off bots
      setSubmitted(true);
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Consent check
    if (!formData.consent) {
      setError('Please agree to receive marketing emails');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/api/marketing-popups/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          popup_id: popup?.id,
          website: formData.website, // honeypot
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Additional safety check at render time
  if (!popup || !isVisible || pathname?.startsWith('/admin') || pathname === '/login') {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 flex items-center gap-1 text-black hover:text-gray-700 text-sm font-medium"
        >
          <span>Close</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image side */}
          {popup.image_url && (
            <div className="md:w-1/2">
              <img
                src={popup.image_url}
                alt=""
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
          )}

          {/* Content side */}
          <div className={`p-8 pt-14 flex flex-col justify-center ${popup.image_url ? 'md:w-1/2' : 'w-full'}`}>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {popup.title}
            </h2>

            <div className="text-gray-600 mb-6 leading-relaxed">
              {popup.content.split('\n').map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-3' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-800 font-semibold">Thanks for subscribing!</p>
                <p className="text-green-600 text-sm mt-1">Check your inbox for confirmation.</p>
                <button
                  onClick={handleClose}
                  className="mt-4 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field - hidden from real users */}
                <div className="absolute left-[-9999px]" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-indigo-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border-2 border-indigo-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-0.5 min-w-[24px] min-h-[24px] w-6 h-6 text-emerald-600 focus:ring-emerald-500 border-2 border-indigo-600 rounded cursor-pointer accent-emerald-600"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer">
                    I agree to receive marketing emails and updates. You can unsubscribe at any time.
                  </label>
                </div>

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-500 text-white px-5 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold text-base disabled:opacity-50"
                  >
                    {submitting ? 'Subscribing...' : 'Subscribe Now'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-gray-600 hover:text-gray-800 px-5 py-2 font-medium text-base"
                  >
                    Maybe Later
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
