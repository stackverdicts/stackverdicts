import { GoogleAdsApi, Customer } from 'google-ads-api';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface KeywordSuggestion {
  keyword: string;
  search_volume: number;
  competition: 'LOW' | 'MEDIUM' | 'HIGH';
  low_top_of_page_bid_micros: number;
  high_top_of_page_bid_micros: number;
  avg_cpc: number;
  keyword_idea_type: string;
}

export interface KeywordResearchParams {
  offerName: string;
  offerDescription?: string;
  landingPageUrl?: string;
  targetCountries?: string[];
  maxResults?: number;
}

/**
 * Google Ads Keyword Planner Service
 * Provides keyword research and suggestions for paid search campaigns
 */
class GoogleAdsService {
  private client: GoogleAdsApi | null = null;
  private customer: Customer | null = null;

  constructor() {
    // Initialize will be called when credentials are available
  }

  /**
   * Initialize the Google Ads client
   */
  private async initialize(): Promise<void> {
    if (this.client && this.customer) {
      return; // Already initialized
    }

    try {
      // Check if credentials are configured
      if (!env.GOOGLE_ADS_CLIENT_ID || !env.GOOGLE_ADS_CLIENT_SECRET) {
        throw new Error('Google Ads API credentials not configured');
      }

      this.client = new GoogleAdsApi({
        client_id: env.GOOGLE_ADS_CLIENT_ID,
        client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
        developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
      });

      // Get customer instance
      this.customer = this.client.Customer({
        customer_id: env.GOOGLE_ADS_CUSTOMER_ID,
        refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
      });

      await logger.info('GoogleAds', 'Google Ads API initialized successfully');
    } catch (error) {
      await logger.error('GoogleAds', 'Failed to initialize Google Ads API', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get keyword suggestions using Google Ads Keyword Planner
   */
  async getKeywordSuggestions(params: KeywordResearchParams): Promise<KeywordSuggestion[]> {
    try {
      await this.initialize();

      if (!this.customer) {
        throw new Error('Google Ads customer not initialized');
      }

      await logger.info('GoogleAds', 'Generating keyword suggestions', {
        offerName: params.offerName,
        countries: params.targetCountries,
      });

      // Prepare keyword seed from offer details
      const keywords = this.extractKeywordsFromOffer(params.offerName, params.offerDescription);

      // Build the request for keyword ideas
      const request: any = {
        keyword_seeds: keywords,
        language: 'en',
        geo_target_constants: this.getGeoTargets(params.targetCountries),
        keyword_plan_network: 'GOOGLE_SEARCH',
      };

      // Add URL seed if provided
      if (params.landingPageUrl) {
        request.url_seed = {
          url: params.landingPageUrl,
        };
      }

      // Get keyword ideas from Google Ads
      const response = await this.customer.keywordPlanIdeaService.generateKeywordIdeas(request);

      // Process and format results
      const suggestions: KeywordSuggestion[] = response.results
        .slice(0, params.maxResults || 50)
        .map((result: any) => {
          const metrics = result.keyword_idea_metrics;
          const lowBid = parseInt(metrics.low_top_of_page_bid_micros || '0');
          const highBid = parseInt(metrics.high_top_of_page_bid_micros || '0');
          const avgCpc = (lowBid + highBid) / 2 / 1_000_000; // Convert micros to dollars

          return {
            keyword: result.text,
            search_volume: parseInt(metrics.avg_monthly_searches || '0'),
            competition: this.mapCompetition(metrics.competition),
            low_top_of_page_bid_micros: lowBid,
            high_top_of_page_bid_micros: highBid,
            avg_cpc: avgCpc,
            keyword_idea_type: result.keyword_idea_type || 'KEYWORD',
          };
        })
        .filter((suggestion) => suggestion.search_volume > 0) // Only return keywords with search volume
        .sort((a, b) => b.search_volume - a.search_volume); // Sort by search volume descending

      await logger.success('GoogleAds', `Generated ${suggestions.length} keyword suggestions`, {
        offerName: params.offerName,
        topKeyword: suggestions[0]?.keyword,
      });

      return suggestions;
    } catch (error) {
      await logger.error('GoogleAds', 'Failed to generate keyword suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        offerName: params.offerName,
      });

      // Return empty array if API fails (don't break content generation)
      return [];
    }
  }

  /**
   * Extract relevant keywords from offer name and description
   */
  private extractKeywordsFromOffer(name: string, description?: string): string[] {
    const text = `${name} ${description || ''}`.toLowerCase();

    // Remove common words and extract meaningful terms
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.includes(word))
      .slice(0, 10); // Limit to 10 seed keywords

    return words;
  }

  /**
   * Map competition level to string
   */
  private mapCompetition(competition: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const comp = competition?.toUpperCase();
    if (comp === 'LOW' || comp === 'MEDIUM' || comp === 'HIGH') {
      return comp as 'LOW' | 'MEDIUM' | 'HIGH';
    }
    return 'MEDIUM'; // Default
  }

  /**
   * Get geo target constants for countries
   */
  private getGeoTargets(countries?: string[]): string[] {
    // Map common country codes to Google Ads geo target constants
    const geoMap: Record<string, string> = {
      US: 'geoTargetConstants/2840', // United States
      CA: 'geoTargetConstants/2124', // Canada
      UK: 'geoTargetConstants/2826', // United Kingdom
      GB: 'geoTargetConstants/2826', // United Kingdom (alternate code)
      AU: 'geoTargetConstants/2036', // Australia
      DE: 'geoTargetConstants/2276', // Germany
      FR: 'geoTargetConstants/2250', // France
      ES: 'geoTargetConstants/2724', // Spain
      IT: 'geoTargetConstants/2380', // Italy
      BR: 'geoTargetConstants/2076', // Brazil
      MX: 'geoTargetConstants/2484', // Mexico
      IN: 'geoTargetConstants/2356', // India
      JP: 'geoTargetConstants/2392', // Japan
      CN: 'geoTargetConstants/2156', // China
    };

    if (!countries || countries.length === 0) {
      // Default to US if no countries specified
      return ['geoTargetConstants/2840'];
    }

    return countries
      .map((country) => geoMap[country.toUpperCase()])
      .filter(Boolean);
  }

  /**
   * Check if Google Ads API is configured
   */
  isConfigured(): boolean {
    return !!(
      env.GOOGLE_ADS_CLIENT_ID &&
      env.GOOGLE_ADS_CLIENT_SECRET &&
      env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      env.GOOGLE_ADS_CUSTOMER_ID &&
      env.GOOGLE_ADS_REFRESH_TOKEN
    );
  }
}

export const googleAdsService = new GoogleAdsService();
