'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

interface Product {
  id: string;
  name: string;
  category: string;
  commission_value: number;
}

// ========== COMPONENT ==========

export default function EmailMarketingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateType, setGenerateType] = useState<'template' | 'sequence'>('sequence');

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sequenceName, setSequenceName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [numberOfEmails, setNumberOfEmails] = useState(5);
  const [daysBetweenEmails, setDaysBetweenEmails] = useState(3);
  const [tone, setTone] = useState('professional');

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
        loadProducts(),
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

  async function loadProducts() {
    const response = await fetch('http://localhost:3001/api/products?active_only=true&limit=100');
    const data = await response.json();
    setProducts(data.products || []);
  }

  async function handleGenerateSequence() {
    if (!selectedProductId || !sequenceName || !purpose) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;

    setGenerating(true);
    try {
      const response = await fetch('http://localhost:3001/api/email/sequences/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequenceName,
          productName: selectedProduct.name,
          productId: selectedProductId,
          purpose,
          numberOfEmails,
          daysBetweenEmails,
          tone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate sequence');
      }

      const data = await response.json();
      alert(`Email sequence "${sequenceName}" generated with ${data.sequence.steps.length} emails!`);

      // Reset form
      setShowGenerateModal(false);
      setSequenceName('');
      setPurpose('');

      // Reload sequences
      loadSequences();
    } catch (error) {
      console.error('Failed to generate sequence:', error);
      alert(`Failed to generate sequence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
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
                AI-powered email campaigns and automation sequences
              </p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <span>✨</span>
              <span>Generate Sequence</span>
            </button>
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
              <button
                onClick={() => {
                  setGenerateType('sequence');
                  setShowGenerateModal(true);
                }}
                className="text-indigo-600 hover:text-blue-700 text-sm font-medium"
              >
                + New Sequence
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {sequences.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No email sequences yet. Generate your first automated sequence!
              </div>
            ) : (
              sequences.slice(0, 5).map((sequence) => (
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
                        <span className="capitalize">{sequence.trigger_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 text-sm text-indigo-600 hover:bg-blue-50 rounded-lg"
                    >
                      View Details
                    </button>
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
              <button className="text-indigo-600 hover:text-blue-700 text-sm font-medium">
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
              <button className="text-indigo-600 hover:text-blue-700 text-sm font-medium">
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

      {/* Generate Sequence Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Generate Email Sequence</h2>
              <p className="text-gray-500 mt-1">AI will create a complete drip sequence</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Choose a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.category}) - ${product.commission_value || 0} commission
                    </option>
                  ))}
                </select>
              </div>

              {/* Sequence Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sequence Name *
                </label>
                <input
                  type="text"
                  value={sequenceName}
                  onChange={(e) => setSequenceName(e.target.value)}
                  placeholder="e.g., Welcome Series, Product Launch Sequence"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose *
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Describe the goal of this email sequence..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Number of Emails */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Emails
                  </label>
                  <input
                    type="number"
                    value={numberOfEmails}
                    onChange={(e) => setNumberOfEmails(parseInt(e.target.value))}
                    min="2"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days Between Emails
                  </label>
                  <input
                    type="number"
                    value={daysBetweenEmails}
                    onChange={(e) => setDaysBetweenEmails(parseInt(e.target.value))}
                    min="1"
                    max="30"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Writing Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateSequence}
                disabled={generating || !selectedProductId || !sequenceName || !purpose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Generate Sequence</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
