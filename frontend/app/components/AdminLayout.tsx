'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname?.startsWith('/admin/blog')) return 'Posts';
    if (pathname?.startsWith('/admin/youtube-calendar')) return 'Post Schedule';
    if (pathname?.startsWith('/admin/analytics')) return 'Analytics';
    if (pathname?.startsWith('/admin/conversions')) return 'Conversions';
    if (pathname?.startsWith('/admin/marketing')) return 'Marketing';
    if (pathname?.startsWith('/admin/email')) return 'Email Marketing';
    if (pathname?.startsWith('/admin/marketing-popups')) return 'Marketing Popups';
    if (pathname?.startsWith('/admin/ab-testing')) return 'A/B Testing';
    if (pathname?.startsWith('/admin/settings')) return 'Settings';
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-3">
                <img src="/logo.svg" alt="StackVerdicts" className="h-8 w-auto" />
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    StackVerdicts
                  </h1>
                </div>
              </Link>
              <div className="hidden sm:block w-px h-8 bg-gray-200" />
              <div className="hidden sm:block">
                <h2 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h2>
              </div>
            </div>

            {/* Right side - User actions */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                target="_blank"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Site
              </Link>
              <div className="hidden sm:block w-px h-8 bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
