'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ========== INTERFACES ==========

interface ChannelOverview {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalWatchTime: number;
  avgEngagementRate: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  topVideos: TopVideo[];
}

interface TopVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  views: number;
  likes: number;
  engagement_rate: number;
  conversions: number;
}

interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  published_at: string;
  duration: number;
  privacy_status: string;
  latest_views: number;
  latest_engagement_rate: number;
  script_title: string;
}

interface RevenueAttribution {
  video_id: string;
  youtube_video_id: string;
  title: string;
  offer_id: string;
  offer_name: string;
  total_clicks: number;
  conversions: number;
  revenue: number;
  payout: number;
}

// ========== COMPONENT ==========

export default function YouTubeAnalyticsPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<ChannelOverview | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [attribution, setAttribution] = useState<RevenueAttribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'revenue'>('overview');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [channelId, setChannelId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    fetched: number;
    imported: number;
    updated: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([
        loadOverview(),
        loadVideos(),
        loadAttribution(),
      ]);
    } catch (error) {
      console.error('Failed to load YouTube analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOverview() {
    try {
      const response = await fetch('http://localhost:3001/api/youtube-analytics/overview');
      const data = await response.json();
      setOverview(data);
    } catch (error) {
      console.error('Failed to load overview:', error);
    }
  }

  async function loadVideos() {
    try {
      const response = await fetch('http://localhost:3001/api/youtube-analytics/videos?limit=20');
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  }

  async function loadAttribution() {
    try {
      const response = await fetch('http://localhost:3001/api/youtube-analytics/attribution');
      const data = await response.json();
      setAttribution(data.attribution || []);
    } catch (error) {
      console.error('Failed to load attribution:', error);
    }
  }

  async function handleSync() {
    if (!channelId.trim()) {
      alert('Please enter a YouTube Channel ID');
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/youtube-analytics/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channelId.trim(),
          maxVideos: 50,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync channel');
      }

      setSyncResult(data);

      // Reload data after successful sync
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to sync channel');
      console.error('Failed to sync channel:', error);
    } finally {
      setSyncing(false);
    }
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

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  function formatWatchTime(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours.toFixed(1)} hours`;
    }
    return `${minutes} min`;
  }

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading YouTube analytics...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">YouTube Analytics</h1>
              <p className="text-gray-500 mt-1">
                Track video performance and affiliate conversions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSyncModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Sync Channel</span>
              </button>
              <button
                onClick={() => router.push('/admin/youtube-calendar')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <span>📹</span>
                <span>Content Calendar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Channel Overview Stats */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Videos"
              value={overview.totalVideos}
              subtitle={`${formatNumber(overview.totalViews)} total views`}
              color="red"
              icon="📹"
            />
            <StatCard
              label="Total Watch Time"
              value={formatWatchTime(overview.totalWatchTime)}
              subtitle={`${formatNumber(overview.totalLikes)} likes`}
              color="purple"
              icon="⏱️"
            />
            <StatCard
              label="Avg Engagement"
              value={`${(overview.avgEngagementRate || 0).toFixed(2)}%`}
              subtitle={`${formatNumber(overview.totalComments)} comments`}
              color="blue"
              icon="💬"
            />
            <StatCard
              label="Affiliate Revenue"
              value={`$${(overview.totalRevenue || 0).toFixed(2)}`}
              subtitle={`${overview.totalConversions} conversions`}
              color="green"
              icon="💰"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Top Videos
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'videos'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Videos
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'revenue'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Revenue Attribution
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Top Videos Tab */}
            {activeTab === 'overview' && overview && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Performing Videos</h2>
                {overview.topVideos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No videos tracked yet. Add videos to start tracking performance.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {overview.topVideos.map((video) => (
                      <div
                        key={video.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/admin/youtube-analytics/videos/${video.id}`)}
                      >
                        {video.thumbnail_url && (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-40 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {video.title}
                          </h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-gray-500 text-xs">Views</div>
                              <div className="font-semibold text-gray-900">
                                {formatNumber(video.views || 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Likes</div>
                              <div className="font-semibold text-gray-900">
                                {formatNumber(video.likes || 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Engagement</div>
                              <div className="font-semibold text-gray-900">
                                {(video.engagement_rate || 0).toFixed(2)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Conversions</div>
                              <div className="font-semibold text-green-600">
                                {video.conversions || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All Videos Tab */}
            {activeTab === 'videos' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">All Tracked Videos</h2>
                  <span className="text-sm text-gray-500">{videos.length} videos</span>
                </div>
                {videos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No videos tracked yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/admin/youtube-analytics/videos/${video.id}`)}
                      >
                        <div className="flex items-start space-x-4">
                          {video.thumbnail_url && (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-32 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{video.title}</h3>
                            {video.script_title && (
                              <p className="text-sm text-gray-500 mb-2">Script: {video.script_title}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>👁️ {formatNumber(video.latest_views || 0)} views</span>
                              <span>•</span>
                              <span>📊 {(video.latest_engagement_rate || 0).toFixed(2)}% engagement</span>
                              <span>•</span>
                              <span>
                                {new Date(video.published_at).toLocaleDateString()}
                              </span>
                              {video.duration && (
                                <>
                                  <span>•</span>
                                  <span>{formatDuration(video.duration)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {video.privacy_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Revenue Attribution Tab */}
            {activeTab === 'revenue' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Revenue Attribution</h2>
                  <span className="text-sm text-gray-500">Last 30 days</span>
                </div>
                {attribution.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No conversions tracked yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Video
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Offer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clicks
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conversions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payout
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attribution.map((item, index) => (
                          <tr key={`${item.video_id}-${item.offer_id}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.title}</div>
                              <div className="text-sm text-gray-500">{item.youtube_video_id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.offer_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.total_clicks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {item.conversions}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              ${(item.revenue || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${(item.payout || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900">
                            Total
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {attribution.reduce((sum, item) => sum + (item.conversions || 0), 0)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600">
                            ${attribution.reduce((sum, item) => sum + (item.revenue || 0), 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            ${attribution.reduce((sum, item) => sum + (item.payout || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Sync YouTube Channel</h2>
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSyncResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {!syncResult ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube Channel ID
                  </label>
                  <input
                    type="text"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    placeholder="UC..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={syncing}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Find your Channel ID: YouTube Studio → Settings → Channel → Advanced Settings
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    This will fetch up to 50 of your most recent videos and import them into the analytics tracker.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowSyncModal(false);
                      setSyncResult(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    disabled={syncing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={syncing || !channelId.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {syncing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <span>🔄</span>
                        <span>Sync Now</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-green-900 mb-2">Sync Complete!</h3>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>✓ Fetched: {syncResult.fetched} videos</p>
                      <p>✓ Imported: {syncResult.imported} new videos</p>
                      <p>✓ Updated: {syncResult.updated} existing videos</p>
                    </div>
                  </div>

                  {syncResult.errors.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2">
                        {syncResult.errors.length} Warning{syncResult.errors.length > 1 ? 's' : ''}
                      </h4>
                      <ul className="text-xs text-yellow-800 space-y-1">
                        {syncResult.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                        {syncResult.errors.length > 5 && (
                          <li>• ... and {syncResult.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowSyncModal(false);
                      setSyncResult(null);
                      setChannelId('');
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
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
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
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
