import { query, queryOne, insert } from '../config/database';
import { generateId } from '../utils/id-generator';
import { logger } from '../utils/logger';

interface CreateTestData {
  testName: string;
  testType: 'landing_page' | 'email_subject' | 'email_content';
  variants: Array<{
    variantName: string;
    variantType: 'control' | 'variant_a' | 'variant_b' | 'variant_c';
    trafficPercentage: number;
    landingPageId?: string;
    emailSubject?: string;
    emailContent?: string;
  }>;
}

interface RecordEventData {
  testId: string;
  variantId: string;
  eventType: 'impression' | 'conversion';
  userIdentifier?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  conversionValue?: number;
  metadata?: any;
}

class ABTestingService {
  /**
   * Create a new A/B test with variants
   */
  async createTest(data: CreateTestData): Promise<any> {
    try {
      const testId = generateId('test');

      // Create the test
      await insert(
        `INSERT INTO ab_tests (id, test_name, test_type, status)
         VALUES (?, ?, ?, 'draft')`,
        [testId, data.testName, data.testType]
      );

      // Create variants
      const variantIds: string[] = [];
      for (const variant of data.variants) {
        const variantId = generateId('variant');
        variantIds.push(variantId);

        await insert(
          `INSERT INTO ab_test_variants (
            id, test_id, variant_name, variant_type, traffic_percentage,
            landing_page_id, email_subject, email_content
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            variantId,
            testId,
            variant.variantName,
            variant.variantType,
            variant.trafficPercentage,
            variant.landingPageId || null,
            variant.emailSubject || null,
            variant.emailContent || null,
          ]
        );
      }

      const test = await this.getTestById(testId);

      await logger.info('ABTesting', 'A/B test created', {
        testId,
        testName: data.testName,
        variantCount: data.variants.length,
      });

      return test;
    } catch (error) {
      await logger.error('ABTesting', 'Failed to create A/B test', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get test by ID with variants
   */
  async getTestById(testId: string): Promise<any> {
    try {
      const test = await queryOne(
        'SELECT * FROM ab_tests WHERE id = ?',
        [testId]
      );

      if (!test) {
        throw new Error('Test not found');
      }

      const variants = await query(
        'SELECT * FROM ab_test_variants WHERE test_id = ? ORDER BY variant_type',
        [testId]
      );

      return {
        ...test,
        variants,
      };
    } catch (error) {
      await logger.error('ABTesting', 'Failed to get test', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testId,
      });
      throw error;
    }
  }

  /**
   * Get all tests
   */
  async getAllTests(filters?: {
    status?: string;
    testType?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      let sql = `
        SELECT
          t.*,
          COUNT(DISTINCT v.id) as variant_count,
          SUM(v.impressions) as total_impressions,
          SUM(v.conversions) as total_conversions,
          AVG(v.conversion_rate) as avg_conversion_rate
        FROM ab_tests t
        LEFT JOIN ab_test_variants v ON t.id = v.test_id
      `;

      const params: any[] = [];
      const conditions: string[] = [];

      if (filters?.status) {
        conditions.push('t.status = ?');
        params.push(filters.status);
      }

      if (filters?.testType) {
        conditions.push('t.test_type = ?');
        params.push(filters.testType);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' GROUP BY t.id ORDER BY t.created_at DESC';

      if (filters?.limit) {
        sql += ' LIMIT ? OFFSET ?';
        params.push(filters.limit, filters.offset || 0);
      }

      const tests = await query(sql, params);
      return tests || [];
    } catch (error) {
      await logger.error('ABTesting', 'Failed to get tests', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Start a test
   */
  async startTest(testId: string): Promise<void> {
    try {
      await query(
        `UPDATE ab_tests
         SET status = 'running', start_date = NOW()
         WHERE id = ?`,
        [testId]
      );

      await logger.info('ABTesting', 'A/B test started', { testId });
    } catch (error) {
      await logger.error('ABTesting', 'Failed to start test', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testId,
      });
      throw error;
    }
  }

  /**
   * Pause a test
   */
  async pauseTest(testId: string): Promise<void> {
    try {
      await query(
        `UPDATE ab_tests SET status = 'paused' WHERE id = ?`,
        [testId]
      );

      await logger.info('ABTesting', 'A/B test paused', { testId });
    } catch (error) {
      await logger.error('ABTesting', 'Failed to pause test', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testId,
      });
      throw error;
    }
  }

  /**
   * Complete a test
   */
  async completeTest(testId: string, winningVariantId?: string): Promise<void> {
    try {
      await query(
        `UPDATE ab_tests
         SET status = 'completed', end_date = NOW(), winning_variant_id = ?
         WHERE id = ?`,
        [winningVariantId || null, testId]
      );

      await logger.info('ABTesting', 'A/B test completed', {
        testId,
        winningVariantId,
      });
    } catch (error) {
      await logger.error('ABTesting', 'Failed to complete test', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testId,
      });
      throw error;
    }
  }

  /**
   * Record an event (impression or conversion)
   */
  async recordEvent(data: RecordEventData): Promise<void> {
    try {
      const eventId = generateId('event');

      // Insert event
      await insert(
        `INSERT INTO ab_test_events (
          id, test_id, variant_id, event_type, user_identifier,
          ip_address, user_agent, referrer, conversion_value, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId,
          data.testId,
          data.variantId,
          data.eventType,
          data.userIdentifier || null,
          data.ipAddress || null,
          data.userAgent || null,
          data.referrer || null,
          data.conversionValue || 0,
          data.metadata ? JSON.stringify(data.metadata) : null,
        ]
      );

      // Update variant stats
      if (data.eventType === 'impression') {
        await query(
          `UPDATE ab_test_variants
           SET impressions = impressions + 1
           WHERE id = ?`,
          [data.variantId]
        );
      } else if (data.eventType === 'conversion') {
        await query(
          `UPDATE ab_test_variants
           SET conversions = conversions + 1,
               revenue_generated = revenue_generated + ?,
               conversion_rate = (conversions + 1) / NULLIF(impressions, 0) * 100
           WHERE id = ?`,
          [data.conversionValue || 0, data.variantId]
        );
      }

      await logger.debug('ABTesting', 'Event recorded', {
        testId: data.testId,
        variantId: data.variantId,
        eventType: data.eventType,
      });
    } catch (error) {
      await logger.error('ABTesting', 'Failed to record event', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get variant to serve (based on traffic allocation)
   */
  async getVariantForUser(testId: string, userIdentifier?: string): Promise<any> {
    try {
      // Get test status
      const test = await queryOne(
        'SELECT status FROM ab_tests WHERE id = ?',
        [testId]
      );

      if (!test || test.status !== 'running') {
        return null;
      }

      // Get variants
      const variants = await query(
        'SELECT * FROM ab_test_variants WHERE test_id = ? ORDER BY variant_type',
        [testId]
      );

      if (!variants || variants.length === 0) {
        return null;
      }

      // Simple random selection based on traffic percentage
      const random = Math.random() * 100;
      let cumulative = 0;

      for (const variant of variants) {
        cumulative += variant.traffic_percentage;
        if (random <= cumulative) {
          return variant;
        }
      }

      // Fallback to first variant
      return variants[0];
    } catch (error) {
      await logger.error('ABTesting', 'Failed to get variant', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testId,
      });
      throw error;
    }
  }

  /**
   * Get test results
   */
  async getTestResults(testId: string): Promise<any> {
    try {
      const test = await queryOne(
        'SELECT * FROM ab_tests WHERE id = ?',
        [testId]
      );

      if (!test) {
        throw new Error('Test not found');
      }

      const variants = await query(
        `SELECT
          v.*,
          CASE
            WHEN v.impressions > 0 THEN (v.conversions / v.impressions * 100)
            ELSE 0
          END as calculated_conversion_rate,
          CASE
            WHEN v.conversions > 0 THEN (v.revenue_generated / v.conversions)
            ELSE 0
          END as average_order_value
         FROM ab_test_variants v
         WHERE v.test_id = ?
         ORDER BY v.variant_type`,
        [testId]
      );

      // Calculate statistical significance (simplified chi-square test)
      let controlVariant = variants.find((v: any) => v.variant_type === 'control');
      const testVariants = variants.filter((v: any) => v.variant_type !== 'control');

      const significanceResults = testVariants.map((variant: any) => {
        if (!controlVariant || controlVariant.impressions === 0 || variant.impressions === 0) {
          return {
            variantId: variant.id,
            isSignificant: false,
            confidence: 0,
          };
        }

        // Simple z-test for proportions
        const p1 = controlVariant.conversions / controlVariant.impressions;
        const p2 = variant.conversions / variant.impressions;
        const pooledP = (controlVariant.conversions + variant.conversions) /
                        (controlVariant.impressions + variant.impressions);

        const se = Math.sqrt(pooledP * (1 - pooledP) *
                            (1 / controlVariant.impressions + 1 / variant.impressions));

        const zScore = se > 0 ? Math.abs(p2 - p1) / se : 0;

        // Convert z-score to confidence (simplified)
        const confidence = Math.min(99.9, (1 - Math.exp(-zScore)) * 100);

        return {
          variantId: variant.id,
          isSignificant: zScore > 1.96, // 95% confidence
          confidence,
          zScore,
        };
      });

      return {
        test,
        variants,
        significance: significanceResults,
      };
    } catch (error) {
      await logger.error('ABTesting', 'Failed to get test results', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testId,
      });
      throw error;
    }
  }

  /**
   * Delete a test
   */
  async deleteTest(testId: string): Promise<void> {
    try {
      await query('DELETE FROM ab_tests WHERE id = ?', [testId]);

      await logger.info('ABTesting', 'A/B test deleted', { testId });
    } catch (error) {
      await logger.error('ABTesting', 'Failed to delete test', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testId,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const abTestingService = new ABTestingService();
