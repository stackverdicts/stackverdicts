'use client';

import { useEffect, useState } from 'react';

interface Conversion {
  id: string;
  offer_id: string;
  click_id: string | null;
  transaction_id: string;
  payout: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'reversed';
  conversion_date: string;
  approval_date: string | null;
  notes: string | null;
  created_at: string;
}

interface ConversionStats {
  total_conversions: number;
  approved_count: number;
  pending_count: number;
  rejected_count: number;
  reversed_count: number;
  total_revenue: number;
  average_payout: number;
}

export default function ConversionsPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testFormData, setTestFormData] = useState({
    campaignId: 'test-campaign-001',
    campaignName: 'Test Campaign',
    payout: '50.00',
    amount: '100.00',
    status: 'APPROVED',
  });

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [conversionsResponse, statsResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/conversions?status=${statusFilter}&limit=100`),
        fetch('http://localhost:3001/api/conversions/stats'),
      ]);

      const conversionsData = await conversionsResponse.json();
      const statsData = await statsResponse.json();

      setConversions(conversionsData.conversions || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load conversions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function simulatePostback() {
    try {
      const response = await fetch('http://localhost:3001/api/conversions/simulate-postback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testFormData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Postback simulated successfully!\n\nAction ID: ${result.postbackData.ActionId}\nCampaign: ${result.postbackData.CampaignName}\nStatus: ${result.postbackData.Status}\nPayout: $${result.postbackData.Payout}`);
        setShowTestModal(false);
        loadData();
      } else {
        alert('Failed to simulate postback');
      }
    } catch (error) {
      console.error('Failed to simulate postback:', error);
      alert('Failed to simulate postback');
    }
  }

  async function deleteConversion(id: string) {
    if (!confirm('Are you sure you want to delete this conversion?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/conversions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Failed to delete conversion');
      }
    } catch (error) {
      console.error('Failed to delete conversion:', error);
      alert('Failed to delete conversion');
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'reversed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function formatCurrency(amount: number, currency: string = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Conversion Tracking</h1>
              <p className="text-gray-500 mt-1">Monitor affiliate conversions and revenue</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTestModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Test Postback
              </button>
              <a
                href="/admin"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.total_revenue)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">From approved conversions</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Conversions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_conversions}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">All statuses</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg Payout</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.average_payout)}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Per approved conversion</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status Breakdown</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm"><span className="font-semibold text-green-600">{stats.approved_count}</span> approved</p>
                    <p className="text-sm"><span className="font-semibold text-yellow-600">{stats.pending_count}</span> pending</p>
                  </div>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="reversed">Reversed</option>
            </select>
            <button
              onClick={loadData}
              className="ml-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Conversions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payout
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Loading conversions...
                    </td>
                  </tr>
                ) : conversions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No conversions found. Test the postback webhook to create your first conversion!
                    </td>
                  </tr>
                ) : (
                  conversions.map((conversion) => (
                    <tr key={conversion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{conversion.transaction_id}</div>
                        {conversion.click_id && (
                          <div className="text-xs text-gray-500">Click: {conversion.click_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{conversion.offer_id}</div>
                        {conversion.notes && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{conversion.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(conversion.payout, conversion.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(conversion.status)}`}>
                          {conversion.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(conversion.conversion_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => deleteConversion(conversion.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Postback Modal */}
        {showTestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Simulate Impact.com Postback</h2>
              <p className="text-sm text-gray-600 mb-6">
                This will create a test conversion by simulating an Impact.com postback webhook call.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign ID
                  </label>
                  <input
                    type="text"
                    value={testFormData.campaignId}
                    onChange={(e) => setTestFormData({ ...testFormData, campaignId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={testFormData.campaignName}
                    onChange={(e) => setTestFormData({ ...testFormData, campaignName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payout ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={testFormData.payout}
                      onChange={(e) => setTestFormData({ ...testFormData, payout: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={testFormData.amount}
                      onChange={(e) => setTestFormData({ ...testFormData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={testFormData.status}
                    onChange={(e) => setTestFormData({ ...testFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="REVERSED">REVERSED</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={simulatePostback}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Simulate Postback
                </button>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Webhook Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Postback Webhook URL</h3>
          <p className="text-sm text-blue-800 mb-2">
            Configure this URL in your Impact.com account to receive conversion notifications:
          </p>
          <code className="block bg-white px-3 py-2 rounded border border-blue-300 text-sm text-blue-900 font-mono">
            http://localhost:3001/api/postback/impact
          </code>
          <p className="text-xs text-blue-700 mt-2">
            Parameters: ActionId, CampaignId, CampaignName, Status, Payout, Amount, Currency, EventDate, SharedId
          </p>
        </div>
      </main>
    </div>
  );
}
