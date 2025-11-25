'use client';

import { useState, useEffect } from 'react';

interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnailUrl: string;
  description: string;
  engagementScore: number;
}

interface KeywordIdea {
  keyword: string;
  searchVolume: number;
  competition: 'LOW' | 'MEDIUM' | 'HIGH';
  avgViews: number;
  topVideos: YouTubeVideo[];
  potential: number;
}

interface ResearchResult {
  mainKeyword: string;
  relatedKeywords: KeywordIdea[];
  topPerformingVideos: YouTubeVideo[];
  recommendations: string[];
}

interface QuotaUsage {
  today: number;
  limit: number;
  remaining: number;
  searches: number;
}

export default function YouTubeKeywordsPage() {
  const [keyword, setKeyword] = useState('');
  const [researching, setResearching] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState('');
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsage | null>(null);

  async function loadQuotaUsage() {
    try {
      const response = await fetch('http://localhost:3001/api/youtube-keyword-research/quota');
      const data = await response.json();
      if (data.success) {
        setQuotaUsage(data.data);
      }
    } catch (err) {
      console.error('Failed to load quota usage:', err);
    }
  }

  async function handleResearch() {
    if (!keyword.trim()) {
      setError('Please enter a keyword');
      return;
    }

    setResearching(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/youtube-keyword-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to research keyword');
      }

      setResult(data.data);

      // Reload quota usage after search
      await loadQuotaUsage();
    } catch (err) {
      console.error('Failed to research keyword:', err);
      setError(err instanceof Error ? err.message : 'Failed to research keyword');
    } finally {
      setResearching(false);
    }
  }

  // Load quota on mount
  useEffect(() => {
    loadQuotaUsage();
  }, []);

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  function getCompetitionColor(competition: string): string {
    switch (competition) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getPotentialColor(potential: number): string {
    if (potential >= 70) return 'text-green-600';
    if (potential >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">YouTube Keyword Research</h1>
              <p className="text-gray-500 mt-1">
                Discover high-potential video ideas based on search data
              </p>
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
        {/* Quota Usage */}
        {quotaUsage && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Daily API Quota</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {quotaUsage.today.toLocaleString()} / {quotaUsage.limit.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {quotaUsage.searches} searches performed today • {quotaUsage.remaining.toLocaleString()} units remaining
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700 mb-2">Usage</div>
                <div className="w-48 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      quotaUsage.today / quotaUsage.limit > 0.9
                        ? 'bg-red-500'
                        : quotaUsage.today / quotaUsage.limit > 0.7
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((quotaUsage.today / quotaUsage.limit) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((quotaUsage.today / quotaUsage.limit) * 100).toFixed(1)}% used
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
              placeholder="Enter a keyword (e.g., web hosting, VPS tutorial, cloud hosting comparison)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={researching}
            />
            <button
              onClick={handleResearch}
              disabled={researching || !keyword.trim()}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {researching ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Researching...
                </>
              ) : (
                'Research'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">Insights & Recommendations</h2>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-blue-800">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Keywords */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Keyword Ideas ({result.relatedKeywords.length})</h2>
                <p className="text-sm text-gray-500 mt-1">Sorted by potential score</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Keyword
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Est. Monthly Searches
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Competition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Potential
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.relatedKeywords.map((kw, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {kw.keyword}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatNumber(kw.searchVolume)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatNumber(kw.avgViews)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompetitionColor(kw.competition)}`}>
                            {kw.competition}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-semibold ${getPotentialColor(kw.potential)}`}>
                            {kw.potential}/100
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(kw.keyword)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            View on YouTube →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Performing Videos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Top Performing Videos</h2>
                <p className="text-sm text-gray-500 mt-1">Study these to understand what works</p>
              </div>
              <div className="p-6 space-y-4">
                {result.topPerformingVideos.map((video) => (
                  <div key={video.videoId} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-gray-900 hover:text-indigo-600 line-clamp-2"
                      >
                        {video.title}
                      </a>
                      <p className="text-sm text-gray-600 mt-1">{video.channelTitle}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{formatNumber(video.viewCount)} views</span>
                        <span>•</span>
                        <span>{formatNumber(video.likeCount)} likes</span>
                        <span>•</span>
                        <span>{formatNumber(video.commentCount)} comments</span>
                        <span>•</span>
                        <span className="text-indigo-600 font-medium">
                          {(video.engagementScore * 100).toFixed(2)}% engagement
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !researching && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Research YouTube Keywords</h2>
            <p className="text-gray-600 mb-6">
              Enter a keyword above to discover high-potential video ideas, competition levels, and top-performing content
            </p>
            <div className="bg-gray-50 rounded-lg p-4 max-w-2xl mx-auto">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">What you'll get:</h3>
              <ul className="text-sm text-gray-700 space-y-1 text-left">
                <li>• Related keyword variations with potential scores</li>
                <li>• Estimated search volumes and average views</li>
                <li>• Competition analysis (Low/Medium/High)</li>
                <li>• Top-performing videos to study</li>
                <li>• Actionable recommendations for content creation</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
