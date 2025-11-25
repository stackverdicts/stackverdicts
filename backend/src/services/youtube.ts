import axios from 'axios';
import { settingsService } from './settings';
import { logger } from '../utils/logger';

interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
      maxres?: { url: string };
    };
    categoryId?: string;
    tags?: string[];
  };
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

interface YouTubeChannelResponse {
  items: Array<{
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  }>;
}

interface YouTubePlaylistResponse {
  items: Array<{
    contentDetails: {
      videoId: string;
    };
  }>;
  nextPageToken?: string;
}

interface YouTubeVideosResponse {
  items: YouTubeVideo[];
}

class YouTubeService {
  private apiKey: string | null = null;

  /**
   * Get API key from settings
   */
  private async getApiKey(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    const apiKey = await settingsService.getSetting('youtube_api_key');
    if (!apiKey || apiKey === '') {
      throw new Error('YouTube API key not configured. Please add it in Settings > Integrations.');
    }

    this.apiKey = apiKey as string;
    return this.apiKey;
  }

  /**
   * Parse ISO 8601 duration to seconds
   * Example: PT1H2M10S -> 3730 seconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Get the uploads playlist ID for a channel
   */
  async getUploadsPlaylistId(channelId: string): Promise<string> {
    try {
      const apiKey = await this.getApiKey();

      const response = await axios.get<YouTubeChannelResponse>(
        'https://www.googleapis.com/youtube/v3/channels',
        {
          params: {
            part: 'contentDetails',
            id: channelId,
            key: apiKey,
          },
        }
      );

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      return response.data.items[0].contentDetails.relatedPlaylists.uploads;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new Error('Invalid YouTube API key or quota exceeded');
      }
      throw error;
    }
  }

  /**
   * Get all video IDs from uploads playlist
   */
  async getVideoIdsFromPlaylist(playlistId: string, maxResults: number = 50): Promise<string[]> {
    try {
      const apiKey = await this.getApiKey();
      const videoIds: string[] = [];
      let pageToken: string | undefined;

      do {
        const response = await axios.get<YouTubePlaylistResponse>(
          'https://www.googleapis.com/youtube/v3/playlistItems',
          {
            params: {
              part: 'contentDetails',
              playlistId,
              maxResults: Math.min(maxResults - videoIds.length, 50),
              pageToken,
              key: apiKey,
            },
          }
        );

        const items = response.data.items || [];
        videoIds.push(...items.map(item => item.contentDetails.videoId));

        pageToken = response.data.nextPageToken;

        // Stop if we've reached maxResults
        if (videoIds.length >= maxResults) {
          break;
        }
      } while (pageToken);

      await logger.info('YouTube', 'Fetched video IDs from playlist', {
        playlistId,
        count: videoIds.length,
      });

      return videoIds;
    } catch (error) {
      await logger.error('YouTube', 'Failed to fetch playlist items', {
        error: error instanceof Error ? error.message : 'Unknown error',
        playlistId,
      });
      throw error;
    }
  }

  /**
   * Get video details in batches
   */
  async getVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
    try {
      const apiKey = await this.getApiKey();
      const videos: YouTubeVideo[] = [];

      // YouTube API allows max 50 video IDs per request
      const batchSize = 50;
      for (let i = 0; i < videoIds.length; i += batchSize) {
        const batch = videoIds.slice(i, i + batchSize);

        const response = await axios.get<YouTubeVideosResponse>(
          'https://www.googleapis.com/youtube/v3/videos',
          {
            params: {
              part: 'snippet,contentDetails,statistics',
              id: batch.join(','),
              key: apiKey,
            },
          }
        );

        videos.push(...(response.data.items || []));
      }

      await logger.info('YouTube', 'Fetched video details', {
        count: videos.length,
      });

      return videos;
    } catch (error) {
      await logger.error('YouTube', 'Failed to fetch video details', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Sync channel videos
   */
  async syncChannelVideos(channelId: string, maxVideos: number = 50): Promise<{
    fetched: number;
    imported: number;
    updated: number;
    errors: string[];
  }> {
    try {
      await logger.info('YouTube', 'Starting channel sync', {
        channelId,
        maxVideos,
      });

      // Get uploads playlist ID
      const uploadsPlaylistId = await this.getUploadsPlaylistId(channelId);

      // Get video IDs from playlist
      const videoIds = await this.getVideoIdsFromPlaylist(uploadsPlaylistId, maxVideos);

      if (videoIds.length === 0) {
        return {
          fetched: 0,
          imported: 0,
          updated: 0,
          errors: ['No videos found in channel'],
        };
      }

      // Get video details
      const videos = await this.getVideoDetails(videoIds);

      await logger.info('YouTube', 'Sync complete', {
        channelId,
        videosFound: videos.length,
      });

      return {
        fetched: videos.length,
        imported: 0, // Will be updated by the caller
        updated: 0,
        errors: [],
      };
    } catch (error) {
      await logger.error('YouTube', 'Channel sync failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        channelId,
      });

      throw error;
    }
  }

  /**
   * Format video data for database insertion
   */
  formatVideoForDatabase(video: YouTubeVideo) {
    const thumbnail =
      video.snippet.thumbnails.maxres?.url ||
      video.snippet.thumbnails.high?.url ||
      video.snippet.thumbnails.medium?.url ||
      video.snippet.thumbnails.default?.url ||
      '';

    return {
      youtubeVideoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description || '',
      thumbnailUrl: thumbnail,
      publishedAt: new Date(video.snippet.publishedAt),
      duration: this.parseDuration(video.contentDetails.duration),
      categoryId: video.snippet.categoryId,
      tags: video.snippet.tags || [],
      statistics: {
        views: parseInt(video.statistics.viewCount || '0'),
        likes: parseInt(video.statistics.likeCount || '0'),
        comments: parseInt(video.statistics.commentCount || '0'),
      },
    };
  }
}

export const youtubeService = new YouTubeService();
