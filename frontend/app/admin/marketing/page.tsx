'use client';

import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

const marketingTools = [
  {
    name: 'Email Marketing',
    href: '/admin/email',
    icon: '📧',
    description: 'Manage email campaigns and sequences',
    color: 'from-pink-500 to-rose-500'
  },
  {
    name: 'Marketing Popups',
    href: '/admin/marketing-popups',
    icon: '💬',
    description: 'Create and manage lead capture popups',
    color: 'from-violet-500 to-purple-500'
  },
];

export default function MarketingPage() {
  return (
    <AdminLayout>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Tools</h1>
            <p className="text-gray-600">Manage your email campaigns and lead capture tools</p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {marketingTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-white rounded border border-gray-200 p-8 hover:shadow-lg hover:border-transparent transition-all duration-200"
              >
                <div className={`w-16 h-16 rounded bg-gradient-to-br ${tool.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                  {tool.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-gray-600">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
    </AdminLayout>
  );
}
