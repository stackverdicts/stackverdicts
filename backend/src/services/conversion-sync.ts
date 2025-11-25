import axios from 'axios';
import { query, insert } from '../config/database';
import { settingsService } from './settings';
import { logger } from '../utils/logger';
import { generateId } from '../utils/id-generator';

/**
 * Conversion Sync Service
 *
 * Syncs conversions from affiliate networks that don't support postbacks
 * Runs daily via cron job to fetch new conversions
 */

interface ConversionRecord {
  networkTransactionId: string;
  offerId: string;
  offerName: string;
  payout: number;
  status: 'pending' | 'approved' | 'rejected';
  clickDate: Date;
  conversionDate: Date;
  subid1?: string; // video_id
  subid2?: string; // user_id
  subid3?: string; // campaign_name
}

class ConversionSyncService {
  /**
   * Sync conversions from Impact network
   */
  async syncImpact(): Promise<{ imported: number; updated: number }> {
    try {
      const accountSid = await settingsService.getSetting('impact_account_sid');
      const authToken = await settingsService.getSetting('impact_auth_token');

      if (!accountSid || !authToken) {
        throw new Error('Impact credentials not configured');
      }

      // Fetch conversions from last 7 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const response = await axios.get(
        `https://api.impact.com/Mediapartners/${accountSid}/Actions`,
        {
          auth: {
            username: accountSid as string,
            password: authToken as string,
          },
          params: {
            ActionDateStart: startDate.toISOString().split('T')[0],
            ActionDateEnd: new Date().toISOString().split('T')[0],
            PageSize: 1000,
          },
        }
      );

      const actions = response.data.Actions || [];
      let imported = 0;
      let updated = 0;

      for (const action of actions) {
        const existing = await query(
          'SELECT id FROM conversions WHERE network_transaction_id = ?',
          [action.Id]
        );

        const conversionData = {
          network: 'impact',
          network_transaction_id: action.Id,
          offer_id: action.CampaignId,
          offer_name: action.CampaignName,
          payout: parseFloat(action.Payout || 0),
          status: this.mapImpactStatus(action.State),
          click_date: new Date(action.EventDate),
          conversion_date: new Date(action.CreationDate),
          subid1: action.SharedId || null,
          subid2: action.SubId1 || null,
          subid3: action.SubId2 || null,
        };

        if (existing && existing.length > 0) {
          // Update existing conversion
          await query(
            `UPDATE conversions
             SET status = ?, payout = ?, updated_at = NOW()
             WHERE network_transaction_id = ?`,
            [conversionData.status, conversionData.payout, action.Id]
          );
          updated++;
        } else {
          // Insert new conversion
          await insert(
            `INSERT INTO conversions (
              id, network, network_transaction_id, offer_id, offer_name,
              payout, status, click_date, conversion_date,
              subid1, subid2, subid3
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId('conv'),
              conversionData.network,
              conversionData.network_transaction_id,
              conversionData.offer_id,
              conversionData.offer_name,
              conversionData.payout,
              conversionData.status,
              conversionData.click_date,
              conversionData.conversion_date,
              conversionData.subid1,
              conversionData.subid2,
              conversionData.subid3,
            ]
          );
          imported++;

          // Try to attribute to video if subid1 contains video_id
          if (conversionData.subid1) {
            await this.attributeToVideo(conversionData.subid1, action.Id);
          }
        }
      }

      await logger.info('ConversionSync', 'Impact sync completed', {
        imported,
        updated,
        total: actions.length,
      });

      return { imported, updated };
    } catch (error) {
      await logger.error('ConversionSync', 'Failed to sync Impact conversions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Sync conversions from Awin (formerly ShareASale)
   */
  async syncAwin(): Promise<{ imported: number; updated: number }> {
    try {
      const publisherId = await settingsService.getSetting('awin_publisher_id');
      const apiToken = await settingsService.getSetting('awin_api_token');

      if (!publisherId || !apiToken) {
        throw new Error('Awin credentials not configured');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const response = await axios.get(
        'https://api.awin.com/publishers/{publisherId}/transactions/',
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
          params: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            timezone: 'UTC',
          },
        }
      );

      const transactions = response.data || [];
      let imported = 0;
      let updated = 0;

      for (const transaction of transactions) {
        const existing = await query(
          'SELECT id FROM conversions WHERE network_transaction_id = ?',
          [transaction.id]
        );

        const conversionData = {
          network: 'awin',
          network_transaction_id: transaction.id.toString(),
          offer_id: transaction.advertiserId.toString(),
          offer_name: transaction.advertiserName,
          payout: parseFloat(transaction.commissionAmount.amount),
          status: this.mapAwinStatus(transaction.transactionStatus),
          click_date: new Date(transaction.clickDate),
          conversion_date: new Date(transaction.transactionDate),
          subid1: transaction.clickRefs?.clickRef || null,
          subid2: null,
          subid3: null,
        };

        if (existing && existing.length > 0) {
          await query(
            `UPDATE conversions
             SET status = ?, payout = ?, updated_at = NOW()
             WHERE network_transaction_id = ?`,
            [conversionData.status, conversionData.payout, transaction.id.toString()]
          );
          updated++;
        } else {
          await insert(
            `INSERT INTO conversions (
              id, network, network_transaction_id, offer_id, offer_name,
              payout, status, click_date, conversion_date,
              subid1, subid2, subid3
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId('conv'),
              conversionData.network,
              conversionData.network_transaction_id,
              conversionData.offer_id,
              conversionData.offer_name,
              conversionData.payout,
              conversionData.status,
              conversionData.click_date,
              conversionData.conversion_date,
              conversionData.subid1,
              conversionData.subid2,
              conversionData.subid3,
            ]
          );
          imported++;

          if (conversionData.subid1) {
            await this.attributeToVideo(conversionData.subid1, transaction.id.toString());
          }
        }
      }

      await logger.info('ConversionSync', 'Awin sync completed', {
        imported,
        updated,
        total: transactions.length,
      });

      return { imported, updated };
    } catch (error) {
      await logger.error('ConversionSync', 'Failed to sync Awin conversions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Sync conversions from ShareASale (LEGACY - use Awin instead)
   * @deprecated ShareASale is migrating to Awin by end of 2025. Use syncAwin() instead.
   */
  async syncShareASale(): Promise<{ imported: number; updated: number }> {
    try {
      const affiliateId = await settingsService.getSetting('shareasale_affiliate_id');
      const apiToken = await settingsService.getSetting('shareasale_api_token');
      const apiSecret = await settingsService.getSetting('shareasale_api_secret');

      if (!affiliateId || !apiToken || !apiSecret) {
        throw new Error('ShareASale credentials not configured');
      }

      // ShareASale requires special authentication
      const timestamp = new Date().toUTCString();
      const crypto = require('crypto');
      const hash = crypto
        .createHash('sha256')
        .update(`${apiToken}:${timestamp}:${apiSecret}`)
        .digest('hex');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const response = await axios.get(
        'https://shareasale.com/w.cfm',
        {
          params: {
            action: 'transactionList',
            affiliateId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          },
          headers: {
            'x-ShareASale-Date': timestamp,
            'x-ShareASale-Authentication': hash,
          },
        }
      );

      // Parse CSV response
      const transactions = this.parseShareASaleCSV(response.data);
      let imported = 0;
      let updated = 0;

      for (const transaction of transactions) {
        const existing = await query(
          'SELECT id FROM conversions WHERE network_transaction_id = ?',
          [transaction.transId]
        );

        const conversionData = {
          network: 'shareasale',
          network_transaction_id: transaction.transId,
          offer_id: transaction.merchantId,
          offer_name: transaction.merchantName,
          payout: parseFloat(transaction.commission),
          status: this.mapShareASaleStatus(transaction.status),
          click_date: new Date(transaction.clickDate),
          conversion_date: new Date(transaction.transDate),
          subid1: transaction.subid1 || null,
          subid2: transaction.subid2 || null,
          subid3: transaction.subid3 || null,
        };

        if (existing && existing.length > 0) {
          await query(
            `UPDATE conversions
             SET status = ?, payout = ?, updated_at = NOW()
             WHERE network_transaction_id = ?`,
            [conversionData.status, conversionData.payout, transaction.transId]
          );
          updated++;
        } else {
          await insert(
            `INSERT INTO conversions (
              id, network, network_transaction_id, offer_id, offer_name,
              payout, status, click_date, conversion_date,
              subid1, subid2, subid3
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId('conv'),
              conversionData.network,
              conversionData.network_transaction_id,
              conversionData.offer_id,
              conversionData.offer_name,
              conversionData.payout,
              conversionData.status,
              conversionData.click_date,
              conversionData.conversion_date,
              conversionData.subid1,
              conversionData.subid2,
              conversionData.subid3,
            ]
          );
          imported++;

          if (conversionData.subid1) {
            await this.attributeToVideo(conversionData.subid1, transaction.transId);
          }
        }
      }

      await logger.info('ConversionSync', 'ShareASale sync completed', {
        imported,
        updated,
        total: transactions.length,
      });

      return { imported, updated };
    } catch (error) {
      await logger.error('ConversionSync', 'Failed to sync ShareASale conversions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Sync conversions from PartnerStack
   */
  async syncPartnerStack(): Promise<{ imported: number; updated: number }> {
    try {
      const apiKey = await settingsService.getSetting('partnerstack_api_key');

      if (!apiKey) {
        throw new Error('PartnerStack API key not configured');
      }

      const response = await axios.get(
        'https://api.partnerstack.com/api/v2/rewards',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          params: {
            limit: 100,
            created_after: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }
      );

      const rewards = response.data.data || [];
      let imported = 0;
      let updated = 0;

      for (const reward of rewards) {
        const existing = await query(
          'SELECT id FROM conversions WHERE network_transaction_id = ?',
          [reward.id]
        );

        const metadata = reward.metadata || {};
        const conversionData = {
          network: 'partnerstack',
          network_transaction_id: reward.id,
          offer_id: reward.partnership_id,
          offer_name: reward.company_name,
          payout: parseFloat(reward.amount) / 100, // cents to dollars
          status: reward.status === 'paid' ? 'approved' : 'pending',
          click_date: new Date(reward.created_at),
          conversion_date: new Date(reward.created_at),
          subid1: metadata.video_id || null,
          subid2: metadata.user_id || null,
          subid3: metadata.campaign || null,
        };

        if (existing && existing.length > 0) {
          await query(
            `UPDATE conversions
             SET status = ?, payout = ?, updated_at = NOW()
             WHERE network_transaction_id = ?`,
            [conversionData.status, conversionData.payout, reward.id]
          );
          updated++;
        } else {
          await insert(
            `INSERT INTO conversions (
              id, network, network_transaction_id, offer_id, offer_name,
              payout, status, click_date, conversion_date,
              subid1, subid2, subid3
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId('conv'),
              conversionData.network,
              conversionData.network_transaction_id,
              conversionData.offer_id,
              conversionData.offer_name,
              conversionData.payout,
              conversionData.status,
              conversionData.click_date,
              conversionData.conversion_date,
              conversionData.subid1,
              conversionData.subid2,
              conversionData.subid3,
            ]
          );
          imported++;

          if (conversionData.subid1) {
            await this.attributeToVideo(conversionData.subid1, reward.id);
          }
        }
      }

      await logger.info('ConversionSync', 'PartnerStack sync completed', {
        imported,
        updated,
        total: rewards.length,
      });

      return { imported, updated };
    } catch (error) {
      await logger.error('ConversionSync', 'Failed to sync PartnerStack conversions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Run all sync jobs
   */
  async syncAll(): Promise<void> {
    await logger.info('ConversionSync', 'Starting all network syncs');

    const results = {
      impact: { imported: 0, updated: 0 },
      awin: { imported: 0, updated: 0 },
      shareasale: { imported: 0, updated: 0 }, // Legacy
      partnerstack: { imported: 0, updated: 0 },
    };

    try {
      results.impact = await this.syncImpact();
    } catch (error) {
      // Continue even if one network fails
    }

    try {
      results.awin = await this.syncAwin();
    } catch (error) {
      // Continue even if one network fails
    }

    try {
      // Only sync ShareASale if credentials exist (legacy support)
      const ssId = await settingsService.getSetting('shareasale_affiliate_id');
      if (ssId) {
        results.shareasale = await this.syncShareASale();
      }
    } catch (error) {
      // Continue even if one network fails
    }

    try {
      results.partnerstack = await this.syncPartnerStack();
    } catch (error) {
      // Continue even if one network fails
    }

    const totalImported =
      results.impact.imported +
      results.awin.imported +
      results.shareasale.imported +
      results.partnerstack.imported;

    const totalUpdated =
      results.impact.updated +
      results.awin.updated +
      results.shareasale.updated +
      results.partnerstack.updated;

    await logger.info('ConversionSync', 'All network syncs completed', {
      totalImported,
      totalUpdated,
      results,
    });
  }

  /**
   * Helper: Attribute conversion to video
   */
  private async attributeToVideo(videoId: string, transactionId: string): Promise<void> {
    try {
      // Check if video exists
      const video = await query(
        'SELECT id FROM youtube_videos WHERE id = ? OR youtube_video_id = ?',
        [videoId, videoId]
      );

      if (video && video.length > 0) {
        // Get conversion data
        const conversion = await query(
          'SELECT * FROM conversions WHERE network_transaction_id = ?',
          [transactionId]
        );

        if (conversion && conversion.length > 0) {
          const conv = conversion[0];

          // Create attribution record
          await insert(
            `INSERT INTO youtube_affiliate_conversions (
              id, video_id, offer_id, tracking_link, click_date,
              conversion_date, conversion_status, payout, revenue
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId('yac'),
              video[0].id,
              conv.offer_id,
              conv.network_transaction_id,
              conv.click_date,
              conv.conversion_date,
              conv.status,
              conv.payout,
              conv.payout,
            ]
          );

          await logger.info('ConversionSync', 'Attributed conversion to video', {
            videoId: video[0].id,
            transactionId,
            payout: conv.payout,
          });
        }
      }
    } catch (error) {
      // Don't throw - attribution is optional
      await logger.error('ConversionSync', 'Failed to attribute conversion', {
        error: error instanceof Error ? error.message : 'Unknown error',
        videoId,
        transactionId,
      });
    }
  }

  /**
   * Helper: Map Impact status to our status
   */
  private mapImpactStatus(state: string): 'pending' | 'approved' | 'rejected' {
    const stateMap: Record<string, 'pending' | 'approved' | 'rejected'> = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REVERSED: 'rejected',
      REJECTED: 'rejected',
    };
    return stateMap[state] || 'pending';
  }

  /**
   * Helper: Map Awin status to our status
   */
  private mapAwinStatus(status: string): 'pending' | 'approved' | 'rejected' {
    const statusMap: Record<string, 'pending' | 'approved' | 'rejected'> = {
      pending: 'pending',
      approved: 'approved',
      paid: 'approved',
      declined: 'rejected',
      deleted: 'rejected',
    };
    return statusMap[status.toLowerCase()] || 'pending';
  }

  /**
   * Helper: Map ShareASale status to our status (LEGACY)
   * @deprecated Use mapAwinStatus instead
   */
  private mapShareASaleStatus(status: string): 'pending' | 'approved' | 'rejected' {
    const statusMap: Record<string, 'pending' | 'approved' | 'rejected'> = {
      pending: 'pending',
      approved: 'approved',
      paid: 'approved',
      void: 'rejected',
      reversed: 'rejected',
    };
    return statusMap[status.toLowerCase()] || 'pending';
  }

  /**
   * Helper: Parse ShareASale CSV response
   */
  private parseShareASaleCSV(csvData: string): any[] {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const transactions = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const transaction: any = {};

      headers.forEach((header, index) => {
        transaction[header.trim()] = values[index]?.trim() || '';
      });

      transactions.push(transaction);
    }

    return transactions;
  }
}

export const conversionSyncService = new ConversionSyncService();
