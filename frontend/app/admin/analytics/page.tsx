'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ========== INTERFACES ==========

interface UnifiedMetrics {
  overview: {
    totalRevenue: number;
    totalConversions: number;
    totalClicks: number;
    conversionRate: number;
    averageRevenuePerConversion: number;
  };
  affiliateMarketing: {
    revenue: number;
    conversions: number;
    clicks: number;
    topOffers: Array<{
      offer_id: string;
      offer_name: string;
      conversions: number;
      revenue: number;
    }>;
  };
  youtube: {
    totalVideos: number;
    totalViews: number;
    totalWatchTime: number;
    avgEngagementRate: number;
    affiliateRevenue: number;
    affiliateConversions: number;
    topVideos: Array<{
      video_id: string;
      title: string;
      views: number;
      conversions: number;
      revenue: number;
    }>;
  };
  emailMarketing: {
    totalSubscribers: number;
    activeSequences: number;
    emailsSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    campaigns: Array<{
      campaign_id: string;
      campaign_name: string;
      sent_count: number;
      open_rate: number;
      click_rate: number;
    }>;
  };
  trends: {
    daily: Array<{
      date: string;
      revenue: number;
      conversions: number;
      clicks: number;
      youtube_views: number;
      email_opens: number;
    }>;
  };
}

interface RevenueBreakdown {
  source: string;
  revenue: number;
  conversions: number;
  percentage: number;
}

// ========== COMPONENT ==========

export default function UnifiedAnalyticsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<UnifiedMetrics | null>(null);
  const [breakdown, setBreakdown] = useState<RevenueBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // days
  const [activeSection, setActiveSection] = useState<'overview' | 'affiliate' | 'youtube' | 'email' | 'abtesting'>('overview');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  async function loadData() {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const [metricsResponse, breakdownResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/unified-analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`http://localhost:3001/api/unified-analytics/revenue-breakdown?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
      ]);

      const metricsData = await metricsResponse.json();
      const breakdownData = await breakdownResponse.json();

      // Check if the API returned an error
      if (metricsData.error || !metricsData.overview) {
        console.error('API error:', metricsData.error || 'Invalid data structure');
        setMetrics(null);
        setBreakdown([]);
      } else {
        setMetrics(metricsData);
        setBreakdown(breakdownData.breakdown || []);
      }
    } catch (error) {
      console.error('Failed to load unified analytics:', error);
      setMetrics(null);
      setBreakdown([]);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(num: number): string {
    return `$${num.toFixed(2)}`;
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading unified analytics...</p>
        </div>
      </div>
    );
  }

  if (!loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Unified Analytics Dashboard</h1>
                <p className="text-gray-500 mt-1">Comprehensive performance across all systems</p>
              </div>
              <a
                href="/admin"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-5xl mb-4">!</div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">Failed to Load Analytics</h2>
            <p className="text-red-700 mb-4">
              There was an error loading the analytics data. This might be due to missing database tables or a connection issue.
            </p>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </main>
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
              <h1 className="text-3xl font-bold text-gray-900">Unified Analytics Dashboard</h1>
              <p className="text-gray-500 mt-1">
                Comprehensive performance across all systems
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setDateRange(7)}
                className={`px-4 py-2 rounded-lg ${
                  dateRange === 7
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange(30)}
                className={`px-4 py-2 rounded-lg ${
                  dateRange === 30
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setDateRange(90)}
                className={`px-4 py-2 rounded-lg ${
                  dateRange === 90
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {metrics && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard
                label="Total Revenue"
                value={formatCurrency(metrics.overview.totalRevenue)}
                subtitle={`${metrics.overview.totalConversions} conversions`}
                color="green"
                icon="💰"
              />
              <StatCard
                label="Total Clicks"
                value={formatNumber(metrics.overview.totalClicks)}
                subtitle={`${metrics.overview.conversionRate.toFixed(2)}% conversion rate`}
                color="blue"
                icon="👆"
              />
              <StatCard
                label="Avg Revenue/Conv"
                value={formatCurrency(metrics.overview.averageRevenuePerConversion)}
                subtitle="Per conversion"
                color="purple"
                icon="📊"
              />
              <StatCard
                label="YouTube Views"
                value={formatNumber(metrics.youtube.totalViews)}
                subtitle={`${metrics.youtube.totalVideos} videos`}
                color="red"
                icon="📹"
              />
              <StatCard
                label="Email Subscribers"
                value={formatNumber(metrics.emailMarketing.totalSubscribers)}
                subtitle={`${metrics.emailMarketing.emailsSent} sent`}
                color="teal"
                icon="📧"
              />
            </div>

            {/* Revenue Breakdown */}
            {breakdown.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue by Source</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {breakdown.map((item) => (
                    <div key={item.source} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-medium text-gray-500">{item.source}</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            {formatCurrency(item.revenue)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-indigo-600">{item.percentage.toFixed(1)}%</div>
                          <div className="text-sm text-gray-500">{item.conversions} conv</div>
                        </div>
                      </div>
                      <div className="mt-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section Tabs */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveSection('overview')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeSection === 'overview'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveSection('affiliate')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeSection === 'affiliate'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Affiliate Marketing
                  </button>
                  <button
                    onClick={() => setActiveSection('youtube')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeSection === 'youtube'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    YouTube
                  </button>
                  <button
                    onClick={() => setActiveSection('email')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeSection === 'email'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Email Marketing
                  </button>
                  <button
                    onClick={() => setActiveSection('abtesting')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeSection === 'abtesting'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    A/B Testing
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeSection === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <MetricBox
                        title="Affiliate Marketing"
                        value={formatCurrency(metrics.affiliateMarketing.revenue)}
                        subtitle={`${metrics.affiliateMarketing.conversions} conversions from ${formatNumber(metrics.affiliateMarketing.clicks)} clicks`}
                      />
                      <MetricBox
                        title="YouTube Performance"
                        value={formatNumber(metrics.youtube.totalViews) + ' views'}
                        subtitle={`${formatCurrency(metrics.youtube.affiliateRevenue)} in affiliate revenue`}
                      />
                      <MetricBox
                        title="Email Marketing"
                        value={`${metrics.emailMarketing.avgOpenRate.toFixed(1)}% open rate`}
                        subtitle={`${formatNumber(metrics.emailMarketing.emailsSent)} emails sent`}
                      />
                    </div>

                  </div>
                )}

                {activeSection === 'affiliate' && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <MetricBox
                        title="Revenue"
                        value={formatCurrency(metrics.affiliateMarketing.revenue)}
                      />
                      <MetricBox
                        title="Conversions"
                        value={metrics.affiliateMarketing.conversions.toString()}
                      />
                      <MetricBox
                        title="Clicks"
                        value={formatNumber(metrics.affiliateMarketing.clicks)}
                      />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Offers</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {metrics.affiliateMarketing.topOffers.map((offer) => (
                            <tr key={offer.offer_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{offer.offer_name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{offer.conversions}</td>
                              <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(offer.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeSection === 'youtube' && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <MetricBox
                        title="Total Views"
                        value={formatNumber(metrics.youtube.totalViews)}
                      />
                      <MetricBox
                        title="Watch Time"
                        value={`${(metrics.youtube.totalWatchTime / 60).toFixed(0)} hrs`}
                      />
                      <MetricBox
                        title="Affiliate Revenue"
                        value={formatCurrency(metrics.youtube.affiliateRevenue)}
                      />
                      <MetricBox
                        title="Engagement Rate"
                        value={`${metrics.youtube.avgEngagementRate.toFixed(2)}%`}
                      />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Videos</h3>
                    <div className="space-y-3">
                      {metrics.youtube.topVideos.map((video) => (
                        <div key={video.video_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-2">{video.title}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>👁️ {formatNumber(video.views)} views</span>
                                <span>•</span>
                                <span>✅ {video.conversions} conversions</span>
                                <span>•</span>
                                <span className="font-medium text-green-600">{formatCurrency(video.revenue)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'email' && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <MetricBox
                        title="Subscribers"
                        value={formatNumber(metrics.emailMarketing.totalSubscribers)}
                      />
                      <MetricBox
                        title="Active Sequences"
                        value={metrics.emailMarketing.activeSequences.toString()}
                      />
                      <MetricBox
                        title="Avg Open Rate"
                        value={`${metrics.emailMarketing.avgOpenRate.toFixed(1)}%`}
                      />
                      <MetricBox
                        title="Avg Click Rate"
                        value={`${metrics.emailMarketing.avgClickRate.toFixed(1)}%`}
                      />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Campaigns</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {metrics.emailMarketing.campaigns.map((campaign) => (
                            <tr key={campaign.campaign_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{campaign.campaign_name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{campaign.sent_count}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{campaign.open_rate.toFixed(1)}%</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{campaign.click_rate.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeSection === 'abtesting' && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🧪</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">A/B Testing</h3>
                    <p className="text-gray-600 mb-6">
                      Manage your A/B tests from here. This section displays active tests and their performance.
                    </p>
                    <a
                      href="/admin/ab-testing"
                      className="inline-block px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
                    >
                      Go to A/B Testing Manager
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
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
  value: string;
  subtitle: string;
  color: string;
  icon: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-700',
    teal: 'bg-teal-100 text-teal-700',
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

function MetricBox({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
    </div>
  );
}
