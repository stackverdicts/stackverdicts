'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ========== INTERFACES ==========

interface EmailStats {
  subscribers: {
    total_subscribers: number;
    active_subscribers: number;
    unsubscribed: number;
    avg_engagement_score: number;
  };
  campaigns: {
    total_campaigns: number;
    completed_campaigns: number;
    total_emails_sent: number;
    avg_open_rate: number;
    avg_click_rate: number;
  };
  sequences: {
    total_sequences: number;
    active_sequences: number;
    total_enrollments: number;
    avg_completion_rate: number;
  };
}

interface EmailSequence {
  id: string;
  sequence_name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  trigger_type: string;
  total_enrolled: number;
  created_at: string;
}

interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  status: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  created_at: string;
}

interface Subscriber {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  engagement_score: number;
  total_emails_opened: number;
  created_at: string;
}

// ========== COMPONENT ==========

export default function EmailMarketingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadSequences(),
        loadCampaigns(),
        loadSubscribers(),
      ]);
    } catch (error) {
      console.error('Failed to load email data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    const response = await fetch('http://localhost:3001/api/email/stats');
    const data = await response.json();
    setStats(data);
  }

  async function loadSequences() {
    const response = await fetch('http://localhost:3001/api/email/sequences?limit=10');
    const data = await response.json();
    setSequences(data.sequences || []);
  }

  async function loadCampaigns() {
    const response = await fetch('http://localhost:3001/api/email/campaigns?limit=10');
    const data = await response.json();
    setCampaigns(data.campaigns || []);
  }

  async function loadSubscribers() {
    const response = await fetch('http://localhost:3001/api/email/subscribers?limit=10');
    const data = await response.json();
    setSubscribers(data.subscribers || []);
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      draft: 'bg-gray-100 text-gray-700',
      completed: 'bg-blue-100 text-blue-700',
      sent: 'bg-indigo-100 text-indigo-700',
      subscribed: 'bg-green-100 text-green-700',
      unsubscribed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  function formatTriggerType(trigger: string): string {
    const labels: Record<string, string> = {
      manual: 'Manual',
      lead_capture: 'Lead Capture',
      tag_added: 'Tag Added',
      purchase: 'After Purchase',
      abandoned_cart: 'Abandoned Cart',
    };
    return labels[trigger] || trigger;
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email marketing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
              <p className="text-gray-500 mt-1">
                Manage email sequences and campaigns
              </p>
            </div>
            <Link
              href="/admin/email/sequences/new"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Sequence</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Subscribers"
              value={stats.subscribers.total_subscribers}
              subtitle={`${stats.subscribers.active_subscribers} active`}
              color="blue"
              icon="👥"
            />
            <StatCard
              label="Email Sequences"
              value={stats.sequences.total_sequences}
              subtitle={`${stats.sequences.active_sequences} active`}
              color="purple"
              icon="🔄"
            />
            <StatCard
              label="Avg Open Rate"
              value={`${(stats.campaigns.avg_open_rate || 0).toFixed(1)}%`}
              subtitle={`${(stats.campaigns.avg_click_rate || 0).toFixed(1)}% click rate`}
              color="green"
              icon="📧"
            />
            <StatCard
              label="Emails Sent"
              value={stats.campaigns.total_emails_sent}
              subtitle={`${stats.campaigns.completed_campaigns} campaigns`}
              color="indigo"
              icon="📬"
            />
          </div>
        )}

        {/* Sequences Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Email Sequences</h2>
              <Link
                href="/admin/email/sequences/new"
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                + New Sequence
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {sequences.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="mb-4">No email sequences yet</p>
                <Link
                  href="/admin/email/sequences/new"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Create your first sequence
                </Link>
              </div>
            ) : (
              sequences.map((sequence) => (
                <div key={sequence.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{sequence.sequence_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sequence.status)}`}>
                          {sequence.status}
                        </span>
                      </div>
                      {sequence.description && (
                        <p className="text-sm text-gray-600 mb-2">{sequence.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{sequence.total_enrolled} enrolled</span>
                        <span>•</span>
                        <span>{formatTriggerType(sequence.trigger_type)}</span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/email/sequences/${sequence.id}`}
                      className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Campaigns</h2>
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {campaigns.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No campaigns yet
              </div>
            ) : (
              campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{campaign.campaign_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{campaign.sent_count} sent</span>
                        <span>•</span>
                        <span>{(campaign.open_rate || 0).toFixed(1)}% opened</span>
                        <span>•</span>
                        <span>{(campaign.click_rate || 0).toFixed(1)}% clicked</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Subscribers */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Subscribers</h2>
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                Manage Subscribers
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {subscribers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No subscribers yet
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscriber
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.slice(0, 10).map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscriber.first_name || subscriber.last_name
                              ? `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim()
                              : 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{subscriber.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscriber.status)}`}>
                          {subscriber.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Score: {subscriber.engagement_score} ({subscriber.total_emails_opened} opened)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subscriber.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ========== HELPER COMPONENTS ==========

function StatCard({
  label,
  value,
  subtitle,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
  icon: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className={`rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs mt-1 opacity-75">{subtitle}</div>
    </div>
  );
}
