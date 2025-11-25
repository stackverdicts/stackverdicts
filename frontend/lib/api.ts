import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Offers
  async getOffers(params?: {
    vertical?: string;
    minPayout?: number;
    minEpc?: number;
    country?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.client.get('/api/offers', { params });
    return response.data;
  }

  async getOffer(offerId: string) {
    const response = await this.client.get(`/api/offers/${offerId}`);
    return response.data;
  }

  async syncOffers(filters?: {
    vertical?: string;
    country?: string;
    minPayout?: number;
    minEpc?: number;
  }) {
    const response = await this.client.post('/api/offers/sync', filters);
    return response.data;
  }

  async generateContent(
    offerId: string,
    options?: {
      includeGoogleAds?: boolean;
      includeFacebookAds?: boolean;
      tone?: string;
      variant?: number;
    }
  ) {
    const response = await this.client.post(
      `/api/offers/${offerId}/generate-content`,
      options
    );
    return response.data;
  }

  async getVerticals() {
    const response = await this.client.get('/api/offers/meta/verticals');
    return response.data;
  }

  // Tracking
  async trackClick(data: {
    offer_id: string;
    content_id?: string;
    traffic_source: string;
    campaign_id?: string;
    ad_group_id?: string;
    creative_id?: string;
    gclid?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }) {
    const response = await this.client.post('/api/tracking/track-click', data);
    return response.data;
  }

  async getClickStats(params?: {
    offerId?: string;
    trafficSource?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.client.get('/api/tracking/stats', { params });
    return response.data;
  }

  // Analytics
  async getCampaignPerformance(params?: {
    startDate?: string;
    endDate?: string;
    trafficSource?: string;
    status?: string;
  }) {
    const response = await this.client.get('/api/analytics/campaigns', { params });
    return response.data;
  }

  async getOfferPerformance(params?: {
    vertical?: string;
    minConversions?: number;
    minRevenue?: number;
    status?: string;
  }) {
    const response = await this.client.get('/api/analytics/offers', { params });
    return response.data;
  }

  async getDashboardStats(days: number = 30) {
    const response = await this.client.get('/api/analytics/dashboard', {
      params: { days },
    });
    return response.data;
  }

  async getFunnelData(params?: {
    offerId?: string;
    days?: number;
  }) {
    const response = await this.client.get('/api/analytics/funnel', { params });
    return response.data;
  }

  // Campaigns
  async getCampaigns(params?: {
    status?: string;
    offerId?: string;
    trafficSource?: string;
  }) {
    const response = await this.client.get('/api/campaigns', { params });
    return response.data;
  }

  async getCampaign(campaignId: string) {
    const response = await this.client.get(`/api/campaigns/${campaignId}`);
    return response.data;
  }

  async createCampaign(data: {
    offer_id: string;
    content_id?: string;
    campaign_name: string;
    traffic_source: string;
    campaign_id_external?: string;
    ad_group_id_external?: string;
    daily_budget?: number;
    total_budget?: number;
    notes?: string;
  }) {
    const response = await this.client.post('/api/campaigns', data);
    return response.data;
  }

  async updateCampaign(
    campaignId: string,
    data: {
      campaign_name?: string;
      status?: string;
      daily_budget?: number;
      total_budget?: number;
      total_cost?: number;
      notes?: string;
    }
  ) {
    const response = await this.client.patch(`/api/campaigns/${campaignId}`, data);
    return response.data;
  }

  async deleteCampaign(campaignId: string) {
    const response = await this.client.delete(`/api/campaigns/${campaignId}`);
    return response.data;
  }

  // Networks
  async getNetworks(params?: {
    type?: string;
    active_only?: boolean;
  }) {
    const response = await this.client.get('/api/networks', { params });
    return response.data;
  }

  async getNetwork(networkId: string) {
    const response = await this.client.get(`/api/networks/${networkId}`);
    return response.data;
  }

  async createNetwork(data: {
    network_name: string;
    network_slug: string;
    network_type?: string;
    description?: string;
    default_commission_type?: string;
    default_commission_value?: number;
    has_recurring?: boolean;
    recurring_percentage?: number;
    cookie_duration_days?: number;
    tracking_url_template?: string;
    requires_approval?: boolean;
    payment_threshold?: number;
    payment_schedule?: string;
    affiliate_dashboard_url?: string;
    contact_email?: string;
  }) {
    const response = await this.client.post('/api/networks', data);
    return response.data;
  }

  async updateNetwork(
    networkId: string,
    data: {
      network_name?: string;
      network_type?: string;
      description?: string;
      default_commission_type?: string;
      default_commission_value?: number;
      has_recurring?: boolean;
      recurring_percentage?: number;
      cookie_duration_days?: number;
      tracking_url_template?: string;
      requires_approval?: boolean;
      payment_threshold?: number;
      payment_schedule?: string;
      affiliate_dashboard_url?: string;
      contact_email?: string;
      is_active?: boolean;
    }
  ) {
    const response = await this.client.put(`/api/networks/${networkId}`, data);
    return response.data;
  }

  async deleteNetwork(networkId: string) {
    const response = await this.client.delete(`/api/networks/${networkId}`);
    return response.data;
  }

  // Manual Offers
  async createOffer(data: {
    network_id: string;
    name: string;
    description?: string;
    vertical?: string;
    payout: number;
    commission_type?: string;
    commission_value?: number;
    recurring_commission?: number;
    affiliate_url?: string;
    affiliate_link_template?: string;
    countries?: string[];
    epc?: number;
    conversion_rate?: number;
    requires_approval?: boolean;
    status?: string;
  }) {
    const response = await this.client.post('/api/offers', data);
    return response.data;
  }

  async updateOffer(
    offerId: string,
    data: {
      name?: string;
      description?: string;
      vertical?: string;
      payout?: number;
      commission_type?: string;
      commission_value?: number;
      recurring_commission?: number;
      affiliate_url?: string;
      affiliate_link_template?: string;
      epc?: number;
      conversion_rate?: number;
      status?: string;
    }
  ) {
    const response = await this.client.put(`/api/offers/${offerId}`, data);
    return response.data;
  }

  async deleteOffer(offerId: string) {
    const response = await this.client.delete(`/api/offers/${offerId}`);
    return response.data;
  }
}

export const api = new ApiClient();
