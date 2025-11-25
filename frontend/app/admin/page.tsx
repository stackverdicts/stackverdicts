'use client';

import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';

const navigationCards = [
  // Content
  { name: 'Posts', href: '/admin/blog', icon: '📝', description: 'Manage blog content', color: 'from-purple-500 to-indigo-500' },
  { name: 'Post Schedule', href: '/admin/youtube-calendar', icon: '📅', description: 'Content schedule', color: 'from-blue-500 to-cyan-500' },

  // Analytics
  { name: 'Analytics', href: '/admin/analytics', icon: '📊', description: 'Performance & A/B testing', color: 'from-emerald-500 to-green-500' },
  { name: 'Conversions', href: '/admin/conversions', icon: '💵', description: 'Track affiliate revenue', color: 'from-green-500 to-emerald-500' },

  // Marketing
  { name: 'Marketing', href: '/admin/marketing', icon: '📣', description: 'Email & popups', color: 'from-pink-500 to-rose-500' },

  // Management
  { name: 'Settings', href: '/admin/settings', icon: '⚙️', description: 'System settings', color: 'from-slate-500 to-gray-500' },
];

export default function DashboardPage() {
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Manage your affiliate marketing platform</p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {navigationCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-transparent transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{card.name}</h3>
              <p className="text-sm text-gray-500">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
