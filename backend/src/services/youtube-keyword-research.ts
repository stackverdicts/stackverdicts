import { settingsService } from './settings';
import { logger } from '../utils/logger';
import { query, queryOne, insert } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface YouTubeVideoResult {
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
  searchVolume: number; // Estimated based on video count and views
  competition: 'LOW' | 'MEDIUM' | 'HIGH';
  avgViews: number;
  topVideos: YouTubeVideoResult[];
  potential: number; // 0-100 score
}

interface KeywordResearchResult {
  mainKeyword: string;
  relatedKeywords: KeywordIdea[];
  topPerformingVideos: YouTubeVideoResult[];
  recommendations: string[];
}

class YouTubeKeywordResearchService {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private quotaUsed = 0;

  async researchKeyword(keyword: string): Promise<KeywordResearchResult> {
    try {
      this.quotaUsed = 0;

      // Check cache first (24 hour expiry)
      const cached = await this.getCachedResult(keyword);
      if (cached) {
        await logger.info('YouTubeKeywordResearch', 'Returned cached result', {
          keyword,
          cacheAge: 'hours',
        });
        return cached.research_data;
      }

      const apiKey = await settingsService.getSetting('youtube_api_key');

      if (!apiKey) {
        throw new Error('YouTube API key not configured. Please add it in Settings > Integrations');
      }

      // Get search results for the main keyword
      const mainResults = await this.searchVideos(apiKey, keyword, 15); // Reduced from 20 to 15

      // Generate related keywords (optimized to 6 variations instead of 10)
      const relatedKeywords = await this.generateRelatedKeywords(apiKey, keyword);

      // Analyze top performing videos
      const topVideos = mainResults
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 10);

      // Generate recommendations
      const recommendations = this.generateRecommendations(mainResults, relatedKeywords);

      const result = {
        mainKeyword: keyword,
        relatedKeywords,
        topPerformingVideos: topVideos,
        recommendations,
      };

      // Cache the result
      await this.cacheResult(keyword, result, this.quotaUsed);

      // Track quota usage
      await this.trackQuotaUsage(this.quotaUsed);

      await logger.info('YouTubeKeywordResearch', 'Research completed', {
        keyword,
        quotaUsed: this.quotaUsed,
        relatedKeywordsCount: relatedKeywords.length,
      });

      return result;
    } catch (error) {
      await logger.error('YouTubeKeywordResearch', 'Failed to research keyword', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyword,
        quotaUsed: this.quotaUsed,
      });
      throw error;
    }
  }

  async getQuotaUsage(): Promise<{ today: number; limit: number; remaining: number; searches: number }> {
    const today = new Date().toISOString().split('T')[0];

    const usage = await queryOne<{ quota_used: number; searches_performed: number }>(
      'SELECT quota_used, searches_performed FROM youtube_api_quota_usage WHERE date = ?',
      [today]
    );

    const quotaUsed = usage?.quota_used || 0;
    const searches = usage?.searches_performed || 0;
    const limit = 10000; // Daily YouTube API quota
    const remaining = Math.max(0, limit - quotaUsed);

    return {
      today: quotaUsed,
      limit,
      remaining,
      searches,
    };
  }

  private async getCachedResult(keyword: string): Promise<any | null> {
    try {
      const normalizedKeyword = keyword.toLowerCase().trim();

      const cached = await queryOne(
        `SELECT * FROM youtube_keyword_cache
         WHERE keyword = ? AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [normalizedKeyword]
      );

      if (cached) {
        return {
          ...cached,
          research_data: typeof cached.research_data === 'string'
            ? JSON.parse(cached.research_data)
            : cached.research_data,
        };
      }

      return null;
    } catch (error) {
      // If cache fails, continue with fresh search
      return null;
    }
  }

  private async cacheResult(keyword: string, result: KeywordResearchResult, quotaUsed: number): Promise<void> {
    try {
      const normalizedKeyword = keyword.toLowerCase().trim();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

      await insert(
        `INSERT INTO youtube_keyword_cache (id, keyword, research_data, quota_used, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), normalizedKeyword, JSON.stringify(result), quotaUsed, expiresAt]
      );
    } catch (error) {
      // Non-critical - log but don't fail
      await logger.error('YouTubeKeywordResearch', 'Failed to cache result', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyword,
      });
    }
  }

  private async trackQuotaUsage(quotaUsed: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Try to update existing record
      const result = await query(
        `UPDATE youtube_api_quota_usage
         SET quota_used = quota_used + ?,
             searches_performed = searches_performed + 1,
             updated_at = NOW()
         WHERE date = ?`,
        [quotaUsed, today]
      );

      // If no rows affected, insert new record
      if (result.affectedRows === 0) {
        await insert(
          `INSERT INTO youtube_api_quota_usage (id, date, quota_used, searches_performed)
           VALUES (?, ?, ?, 1)`,
          [uuidv4(), today, quotaUsed]
        );
      }
    } catch (error) {
      // Non-critical - log but don't fail
      await logger.error('YouTubeKeywordResearch', 'Failed to track quota usage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        quotaUsed,
      });
    }
  }

  private async searchVideos(
    apiKey: string,
    query: string,
    maxResults: number = 15
  ): Promise<YouTubeVideoResult[]> {
    try {
      // Search for videos (costs 100 units)
      const searchUrl = `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=viewCount&key=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      this.quotaUsed += 100; // Search cost

      if (searchData.error) {
        throw new Error(searchData.error.message || 'YouTube API error');
      }

      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

      if (!videoIds) {
        return [];
      }

      // Get detailed statistics for these videos (costs 1 unit)
      const statsUrl = `${this.baseUrl}/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
      const statsResponse = await fetch(statsUrl);
      const statsData = await statsResponse.json();

      this.quotaUsed += 1; // Videos list cost

      if (statsData.error) {
        throw new Error(statsData.error.message || 'YouTube API error');
      }

      return statsData.items.map((item: any) => {
        const stats = item.statistics;
        const snippet = item.snippet;

        const viewCount = parseInt(stats.viewCount || '0');
        const likeCount = parseInt(stats.likeCount || '0');
        const commentCount = parseInt(stats.commentCount || '0');

        // Calculate engagement score
        const engagementScore = this.calculateEngagementScore(
          viewCount,
          likeCount,
          commentCount
        );

        return {
          videoId: item.id,
          title: snippet.title,
          channelTitle: snippet.channelTitle,
          publishedAt: snippet.publishedAt,
          viewCount,
          likeCount,
          commentCount,
          thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
          description: snippet.description,
          engagementScore,
        };
      });
    } catch (error) {
      await logger.error('YouTubeKeywordResearch', 'Failed to search videos', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
      });
      throw error;
    }
  }

  private async generateRelatedKeywords(
    apiKey: string,
    baseKeyword: string
  ): Promise<KeywordIdea[]> {
    const relatedKeywords: KeywordIdea[] = [];
    const analyzedKeywords = new Set<string>();

    // Step 1: Get suggestions from top videos in the niche
    const mainVideos = await this.searchVideos(apiKey, baseKeyword, 10);
    const seedKeywords = new Set<string>();

    // Extract keywords from video titles
    for (const video of mainVideos) {
      const titleWords = video.title.toLowerCase();
      // Look for common patterns that indicate topics
      const patterns = [
        /(?:best|top)\s+([^|]+?)(?:\s+for|\s+in|\s+2024|\s+2025|$)/gi,
        /how\s+to\s+([^|]+?)(?:\s+in|\s+for|\s+2024|\s+2025|$)/gi,
        /([a-z\s]+)\s+vs\s+([a-z\s]+)/gi,
        /([a-z\s]+)\s+review/gi,
        /([a-z\s]+)\s+tutorial/gi,
      ];

      for (const pattern of patterns) {
        const matches = titleWords.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].length > 3 && match[1].length < 50) {
            seedKeywords.add(match[1].trim());
          }
        }
      }
    }

    // Step 2: Add strategic modifiers and variations
    const modifiers = {
      commercial: ['best', 'top', 'review', 'vs', 'comparison'],
      educational: ['how to', 'tutorial', 'guide', 'tips'],
      specific: ['for beginners', 'for small business', 'for developers', 'explained'],
      temporal: ['2025', 'latest'],
    };

    const variations = [
      baseKeyword,
      ...Array.from(seedKeywords).slice(0, 8), // Top extracted keywords
    ];

    // Add modifier combinations
    for (const keyword of [baseKeyword, ...Array.from(seedKeywords).slice(0, 3)]) {
      modifiers.commercial.forEach(mod => variations.push(`${mod} ${keyword}`));
      modifiers.educational.slice(0, 2).forEach(mod => variations.push(`${mod} ${keyword}`));
    }

    // Step 3: Analyze each variation for opportunity
    for (const variation of variations.slice(0, 20)) {
      if (analyzedKeywords.has(variation)) continue;
      analyzedKeywords.add(variation);

      try {
        const videos = await this.searchVideos(apiKey, variation, 10);

        if (videos.length === 0) continue;

        const avgViews = videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length;
        const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
        const maxViews = Math.max(...videos.map(v => v.viewCount));
        const minViews = Math.min(...videos.map(v => v.viewCount));

        // Better competition analysis
        const avgEngagement = videos.reduce((sum, v) => sum + v.engagementScore, 0) / videos.length;
        const viewVariance = maxViews > 0 ? (maxViews - minViews) / maxViews : 0;

        // High variance = opportunity (no dominant videos)
        // Check channel sizes (videos from smaller channels = less competition)
        const avgSubscriberIndicator = avgViews; // Approximate

        const competition = this.determineCompetition(
          avgEngagement,
          avgViews,
          viewVariance,
          videos.length
        );

        // Calculate realistic potential score
        const potential = this.calculatePotential(
          avgViews,
          competition,
          videos.length,
          viewVariance,
          avgEngagement
        );

        // Only include keywords with meaningful data
        if (potential >= 30) {
          relatedKeywords.push({
            keyword: variation,
            searchVolume: Math.round(totalViews / 12),
            competition,
            avgViews: Math.round(avgViews),
            topVideos: videos.slice(0, 3),
            potential,
          });
        }
      } catch (error) {
        continue;
      }
    }

    // Sort by potential and return diverse results
    return relatedKeywords
      .sort((a, b) => {
        // Prioritize medium competition with good potential
        const aScore = a.potential + (a.competition === 'MEDIUM' ? 10 : 0);
        const bScore = b.potential + (b.competition === 'MEDIUM' ? 10 : 0);
        return bScore - aScore;
      })
      .slice(0, 15);
  }

  private determineCompetition(
    avgEngagement: number,
    avgViews: number,
    viewVariance: number,
    resultCount: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    // High engagement + high views + low variance = HIGH competition (dominated)
    if (avgEngagement > 0.08 && avgViews > 500000 && viewVariance < 0.5) {
      return 'HIGH';
    }

    // High views but high variance = MEDIUM (opportunity exists)
    if (avgViews > 100000 && viewVariance > 0.6) {
      return 'MEDIUM';
    }

    // Low views or very high variance = LOW competition
    if (avgViews < 50000 || viewVariance > 0.8) {
      return 'LOW';
    }

    return 'MEDIUM';
  }

  private calculateEngagementScore(
    views: number,
    likes: number,
    comments: number
  ): number {
    if (views === 0) return 0;

    const likeRate = likes / views;
    const commentRate = comments / views;

    // Weighted engagement score
    return (likeRate * 0.7) + (commentRate * 0.3);
  }

  private calculatePotential(
    avgViews: number,
    competition: string,
    resultCount: number,
    viewVariance: number = 0,
    avgEngagement: number = 0
  ): number {
    let score = 0;

    // Demand score (0-35 points) - sweet spot is 10K-200K views
    if (avgViews > 200000) {
      score += 25; // Good demand but may be saturated
    } else if (avgViews > 50000) {
      score += 35; // Perfect sweet spot
    } else if (avgViews > 10000) {
      score += 30; // Good opportunity
    } else if (avgViews > 1000) {
      score += 15; // Low but viable
    } else {
      score += 5; // Very low demand
    }

    // Competition score (0-35 points)
    if (competition === 'LOW') {
      score += 35; // Easy to rank
    } else if (competition === 'MEDIUM') {
      score += 30; // Best balance of demand and competition
    } else {
      score += 10; // Hard to rank
    }

    // Variance score (0-20 points) - high variance = no dominant player
    if (viewVariance > 0.8) {
      score += 20; // Wide open field
    } else if (viewVariance > 0.6) {
      score += 15; // Some opportunity
    } else if (viewVariance > 0.4) {
      score += 10;
    } else {
      score += 5; // Dominated by few videos
    }

    // Engagement quality (0-10 points) - moderate engagement is good
    if (avgEngagement > 0.03 && avgEngagement < 0.08) {
      score += 10; // Engaged audience, not oversaturated
    } else if (avgEngagement >= 0.08) {
      score += 5; // Very competitive
    } else {
      score += 3; // Low engagement
    }

    return Math.min(Math.round(score), 100);
  }

  private generateRecommendations(
    mainResults: YouTubeVideoResult[],
    relatedKeywords: KeywordIdea[]
  ): string[] {
    const recommendations: string[] = [];

    // Identify goldmine opportunities
    const goldmines = relatedKeywords.filter(k =>
      k.potential >= 70 &&
      (k.competition === 'LOW' || k.competition === 'MEDIUM')
    ).slice(0, 3);

    if (goldmines.length > 0) {
      recommendations.push(
        `🎯 GOLDMINE OPPORTUNITIES: ${goldmines.map(k => `"${k.keyword}" (${k.potential}/100)`).join(' | ')}`
      );
    }

    // Find low-hanging fruit
    const lowHangingFruit = relatedKeywords.filter(k =>
      k.competition === 'LOW' &&
      k.avgViews > 5000 &&
      k.potential >= 60
    ).slice(0, 2);

    if (lowHangingFruit.length > 0) {
      recommendations.push(
        `🍎 EASY WINS: "${lowHangingFruit.map(k => k.keyword).join('", "')}" - Low competition with decent demand`
      );
    }

    // Identify underserved topics
    const avgViews = mainResults.reduce((sum, v) => sum + v.viewCount, 0) / mainResults.length;
    const recentVideos = mainResults.filter(v => {
      const publishDate = new Date(v.publishedAt);
      const monthsOld = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsOld < 6;
    });

    if (recentVideos.length < mainResults.length * 0.3 && avgViews > 10000) {
      recommendations.push('📈 TREND OPPORTUNITY: Limited recent content but good demand - create fresh updated content');
    }

    // Strategic advice based on competition
    const highCompetition = relatedKeywords.filter(k => k.competition === 'HIGH').length;
    const totalKeywords = relatedKeywords.length;

    if (highCompetition / totalKeywords > 0.5) {
      recommendations.push('⚠️ STRATEGY: Most keywords are highly competitive - focus on the medium/low competition variants or add unique angles');
    } else {
      recommendations.push('✅ GOOD NICHE: Decent balance of opportunity - multiple keywords worth targeting');
    }

    // Suggest content angles
    const bestPerformingType = this.identifyBestContentType(relatedKeywords);
    if (bestPerformingType) {
      recommendations.push(`💡 CONTENT TIP: "${bestPerformingType}" style videos perform well in this niche`);
    }

    return recommendations;
  }

  private identifyBestContentType(keywords: KeywordIdea[]): string | null {
    const types = {
      tutorial: keywords.filter(k => k.keyword.includes('how to') || k.keyword.includes('tutorial')),
      comparison: keywords.filter(k => k.keyword.includes('vs') || k.keyword.includes('comparison')),
      review: keywords.filter(k => k.keyword.includes('review')),
      best: keywords.filter(k => k.keyword.includes('best') || k.keyword.includes('top')),
    };

    let bestType: string | null = null;
    let bestScore = 0;

    for (const [type, kws] of Object.entries(types)) {
      if (kws.length > 0) {
        const avgPotential = kws.reduce((sum, k) => sum + k.potential, 0) / kws.length;
        if (avgPotential > bestScore) {
          bestScore = avgPotential;
          bestType = type;
        }
      }
    }

    return bestType;
  }
}

export const youtubeKeywordResearchService = new YouTubeKeywordResearchService();
