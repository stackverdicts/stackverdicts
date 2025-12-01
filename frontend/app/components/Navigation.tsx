'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img
                src="/logo-with-text.svg"
                alt="StackVerdicts"
                className="h-20 -mt-3.5 -ml-5 md:ml-0 md:h-24 md:-mt-5.5"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-gray-800 hover:text-indigo-900 transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                href="/blog"
                className="text-gray-800 hover:text-indigo-900 transition-colors font-medium"
              >
                Blog
              </Link>
              <a
                href="https://www.youtube.com/@stackverdicts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-800 hover:text-indigo-900 transition-colors font-medium"
              >
                Videos
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Slide-in Menu */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Slide-in Panel */}
        <div
          className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between pt-2 px-4 pb-4 border-b border-gray-200">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <img
                src="/logo-with-text.svg"
                alt="StackVerdicts"
                style={{ width: '230px' }}
              />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md text-gray-800 hover:bg-gray-100 transition-colors mt-3"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4">
            <div className="flex flex-col space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-800 hover:text-indigo-900 hover:bg-gray-50 transition-colors font-medium px-4 py-3 rounded-lg"
              >
                Home
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-800 hover:text-indigo-900 hover:bg-gray-50 transition-colors font-medium px-4 py-3 rounded-lg"
              >
                Blog
              </Link>
              <a
                href="https://www.youtube.com/@stackverdicts"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-800 hover:text-indigo-900 hover:bg-gray-50 transition-colors font-medium px-4 py-3 rounded-lg"
              >
                Videos
              </a>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
