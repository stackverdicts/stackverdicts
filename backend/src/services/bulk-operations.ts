import { query } from '../config/database';
import { logger } from '../utils/logger';
import { youtubeScriptService } from './youtube-script';
import { landingPageService } from './landing-page';
import { emailMarketingService } from './email-marketing';

interface BulkScriptGenerationData {
  offerIds: string[];
  scriptType: 'tutorial' | 'review' | 'comparison' | 'listicle';
  tone: string;
  duration: number;
}

interface BulkLandingPageData {
  offerIds: string[];
  templateType: 'review' | 'comparison' | 'listicle' | 'educational' | 'squeeze';
  tone: string;
  includeLeadCapture: boolean;
}

interface BulkPublishData {
  pageIds: string[];
  action: 'publish' | 'unpublish';
}

interface BulkEmailSendData {
  subscriberIds: string[];
  campaignId?: string;
  templateId?: string;
  subject: string;
  content: string;
}

interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  results: any[];
}

class BulkOperationsService {
  /**
   * Bulk generate YouTube scripts for multiple offers
   */
  async bulkGenerateScripts(data: BulkScriptGenerationData): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: data.offerIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      results: [],
    };

    try {
      await logger.info('BulkOperations', 'Starting bulk script generation', {
        offerCount: data.offerIds.length,
        scriptType: data.scriptType,
      });

      for (const offerId of data.offerIds) {
        try {
          // Get offer details
          const offer = await query(
            'SELECT * FROM offers WHERE id = ?',
            [offerId]
          );

          if (!offer || offer.length === 0) {
            result.failed++;
            result.errors.push({ id: offerId, error: 'Offer not found' });
            continue;
          }

          const offerData = offer[0];

          // Generate script
          const script = await youtubeScriptService.generateScript({
            offerName: offerData.name,
            offerId: offerId,
            scriptType: data.scriptType,
            targetAudience: offerData.vertical || 'general audience',
            duration: data.duration,
            tone: data.tone,
            keyPoints: [],
          });

          result.successful++;
          result.results.push({
            offerId,
            offerName: offerData.name,
            scriptId: script.id,
          });
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: offerId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await logger.info('BulkOperations', 'Bulk script generation completed', {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      });

      return result;
    } catch (error) {
      await logger.error('BulkOperations', 'Bulk script generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Bulk generate landing pages for multiple offers
   */
  async bulkGenerateLandingPages(data: BulkLandingPageData): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: data.offerIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      results: [],
    };

    try {
      await logger.info('BulkOperations', 'Starting bulk landing page generation', {
        offerCount: data.offerIds.length,
        templateType: data.templateType,
      });

      for (const offerId of data.offerIds) {
        try {
          // Get offer details
          const offer = await query(
            'SELECT * FROM offers WHERE id = ?',
            [offerId]
          );

          if (!offer || offer.length === 0) {
            result.failed++;
            result.errors.push({ id: offerId, error: 'Offer not found' });
            continue;
          }

          const offerData = offer[0];

          // Generate landing page
          const page = await landingPageService.generateLandingPage({
            offerId: offerId,
            templateType: data.templateType,
            pageName: `${offerData.name} - ${data.templateType}`,
            targetKeywords: [],
            includeLeadCapture: data.includeLeadCapture,
            tone: data.tone,
          });

          result.successful++;
          result.results.push({
            offerId,
            offerName: offerData.name,
            pageId: page.id,
            slug: page.slug,
          });
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: offerId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await logger.info('BulkOperations', 'Bulk landing page generation completed', {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      });

      return result;
    } catch (error) {
      await logger.error('BulkOperations', 'Bulk landing page generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Bulk publish or unpublish landing pages
   */
  async bulkPublishPages(data: BulkPublishData): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: data.pageIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      results: [],
    };

    try {
      await logger.info('BulkOperations', 'Starting bulk publish operation', {
        pageCount: data.pageIds.length,
        action: data.action,
      });

      const newStatus = data.action === 'publish' ? 'published' : 'draft';
      const publishedAt = data.action === 'publish' ? new Date() : null;

      for (const pageId of data.pageIds) {
        try {
          await query(
            `UPDATE landing_pages
             SET status = ?, published_at = ?
             WHERE id = ?`,
            [newStatus, publishedAt, pageId]
          );

          result.successful++;
          result.results.push({
            pageId,
            newStatus,
          });
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: pageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await logger.info('BulkOperations', 'Bulk publish operation completed', {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      });

      return result;
    } catch (error) {
      await logger.error('BulkOperations', 'Bulk publish operation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Bulk update offer statuses
   */
  async bulkUpdateOfferStatus(
    offerIds: string[],
    status: 'active' | 'inactive'
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: offerIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      results: [],
    };

    try {
      await logger.info('BulkOperations', 'Starting bulk offer status update', {
        offerCount: offerIds.length,
        newStatus: status,
      });

      for (const offerId of offerIds) {
        try {
          await query(
            'UPDATE offers SET status = ? WHERE id = ?',
            [status, offerId]
          );

          result.successful++;
          result.results.push({
            offerId,
            newStatus: status,
          });
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: offerId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await logger.info('BulkOperations', 'Bulk offer status update completed', {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      });

      return result;
    } catch (error) {
      await logger.error('BulkOperations', 'Bulk offer status update failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Bulk delete items
   */
  async bulkDelete(
    itemIds: string[],
    itemType: 'scripts' | 'pages' | 'campaigns' | 'tests'
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: itemIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      results: [],
    };

    try {
      await logger.info('BulkOperations', 'Starting bulk delete', {
        itemCount: itemIds.length,
        itemType,
      });

      const tableMap: Record<string, string> = {
        scripts: 'youtube_scripts',
        pages: 'landing_pages',
        campaigns: 'email_campaigns',
        tests: 'ab_tests',
      };

      const table = tableMap[itemType];

      for (const itemId of itemIds) {
        try {
          await query(`DELETE FROM ${table} WHERE id = ?`, [itemId]);

          result.successful++;
          result.results.push({
            itemId,
            deleted: true,
          });
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: itemId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await logger.info('BulkOperations', 'Bulk delete completed', {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      });

      return result;
    } catch (error) {
      await logger.error('BulkOperations', 'Bulk delete failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Bulk enroll subscribers in email sequence
   */
  async bulkEnrollInSequence(
    subscriberIds: string[],
    sequenceId: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: subscriberIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      results: [],
    };

    try {
      await logger.info('BulkOperations', 'Starting bulk sequence enrollment', {
        subscriberCount: subscriberIds.length,
        sequenceId,
      });

      for (const subscriberId of subscriberIds) {
        try {
          await emailMarketingService.enrollInSequence(subscriberId, sequenceId);

          result.successful++;
          result.results.push({
            subscriberId,
            enrolled: true,
          });
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: subscriberId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await logger.info('BulkOperations', 'Bulk sequence enrollment completed', {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      });

      return result;
    } catch (error) {
      await logger.error('BulkOperations', 'Bulk sequence enrollment failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get bulk operation statistics
   */
  async getBulkOperationStats(): Promise<any> {
    try {
      const stats = {
        totalScripts: await this.getCount('youtube_scripts'),
        totalPages: await this.getCount('landing_pages'),
        totalCampaigns: await this.getCount('email_campaigns'),
        totalSubscribers: await this.getCount('email_subscribers'),
        totalTests: await this.getCount('ab_tests'),
      };

      return stats;
    } catch (error) {
      await logger.error('BulkOperations', 'Failed to get stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async getCount(table: string): Promise<number> {
    const result = await query(`SELECT COUNT(*) as count FROM ${table}`, []);
    return result?.[0]?.count || 0;
  }
}

// Export singleton instance
export const bulkOperationsService = new BulkOperationsService();
