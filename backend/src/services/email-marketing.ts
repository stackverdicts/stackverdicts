import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { query, queryOne, insert } from '../config/database';
import { generateId } from '../utils/id-generator';
import { logger } from '../utils/logger';
import { resend, FROM_EMAIL } from '../lib/resend';

interface EmailTemplateGenerationRequest {
  templateType: 'welcome' | 'nurture' | 'promotional' | 'transactional' | 'custom';
  offerName?: string;
  offerId?: string;
  purpose: string;
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'friendly';
  includeOffer?: boolean;
  targetAudience?: string;
}

interface GeneratedEmailTemplate {
  id: string;
  subjectLine: string;
  previewText: string;
  htmlContent: string;
  plainTextContent: string;
}

interface SequenceGenerationRequest {
  sequenceName: string;
  offerName: string;
  offerId?: string;
  purpose: string;
  numberOfEmails: number;
  daysBetweenEmails: number;
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'friendly';
}

interface CampaignCreationRequest {
  campaignName: string;
  campaignType: 'one_time' | 'drip' | 'nurture' | 'promotional';
  subjectLine: string;
  fromName: string;
  fromEmail: string;
  templateId?: string;
  htmlContent?: string;
  segmentCriteria?: any;
  sendDate?: Date;
}

interface SubscriberData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  source?: string;
  sourcePageId?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

class EmailMarketingService {
  private client: Anthropic;
  private model = 'claude-3-5-sonnet-20241022';

  constructor() {
    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate email template with Claude AI
   */
  async generateEmailTemplate(request: EmailTemplateGenerationRequest): Promise<GeneratedEmailTemplate> {
    try {
      await logger.info('EmailMarketingService', 'Generating email template', {
        templateType: request.templateType,
        purpose: request.purpose,
      });

      const prompt = this.buildEmailPrompt(request);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const parsedTemplate = this.parseClaudeEmailResponse(content.text);

      // Save to database
      const templateId = generateId('template');

      await insert(
        `INSERT INTO email_templates (
          id, template_name, template_type, subject_line, preview_text,
          html_content, plain_text_content, variables
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          templateId,
          request.purpose,
          request.templateType,
          parsedTemplate.subjectLine,
          parsedTemplate.previewText,
          parsedTemplate.htmlContent,
          parsedTemplate.plainTextContent,
          JSON.stringify(parsedTemplate.variables || {}),
        ]
      );

      await logger.info('EmailMarketingService', 'Email template generated', {
        templateId,
      });

      return {
        id: templateId,
        ...parsedTemplate,
      };
    } catch (error) {
      await logger.error('EmailMarketingService', 'Failed to generate email template', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate complete email sequence with Claude AI
   */
  async generateEmailSequence(request: SequenceGenerationRequest): Promise<any> {
    try {
      await logger.info('EmailMarketingService', 'Generating email sequence', {
        sequenceName: request.sequenceName,
        numberOfEmails: request.numberOfEmails,
      });

      const prompt = this.buildSequencePrompt(request);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const parsedSequence = this.parseClaudeSequenceResponse(content.text);

      // Save sequence to database
      const sequenceId = generateId('sequence');

      await insert(
        `INSERT INTO email_sequences (
          id, sequence_name, description, trigger_type, status
        ) VALUES (?, ?, ?, 'manual', 'draft')`,
        [sequenceId, request.sequenceName, request.purpose]
      );

      // Save sequence steps
      for (let i = 0; i < parsedSequence.emails.length; i++) {
        const email = parsedSequence.emails[i];
        const stepId = generateId('step');

        await insert(
          `INSERT INTO email_sequence_steps (
            id, sequence_id, step_number, step_name, subject_line,
            html_content, plain_text_content, delay_value, delay_unit
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'days')`,
          [
            stepId,
            sequenceId,
            i + 1,
            email.stepName,
            email.subjectLine,
            email.htmlContent,
            email.plainTextContent,
            i === 0 ? 0 : request.daysBetweenEmails,
          ]
        );
      }

      const sequence = await queryOne(
        'SELECT * FROM email_sequences WHERE id = ?',
        [sequenceId]
      );

      const steps = await query(
        'SELECT * FROM email_sequence_steps WHERE sequence_id = ? ORDER BY step_number',
        [sequenceId]
      );

      await logger.info('EmailMarketingService', 'Email sequence generated', {
        sequenceId,
        emailCount: steps.length,
      });

      return {
        sequence,
        steps,
      };
    } catch (error) {
      await logger.error('EmailMarketingService', 'Failed to generate email sequence', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create email campaign
   */
  async createCampaign(request: CampaignCreationRequest): Promise<any> {
    try {
      const campaignId = generateId('campaign');

      await insert(
        `INSERT INTO email_campaigns (
          id, campaign_name, campaign_type, subject_line,
          from_name, from_email, segment_criteria, send_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          campaignId,
          request.campaignName,
          request.campaignType,
          request.subjectLine,
          request.fromName,
          request.fromEmail,
          JSON.stringify(request.segmentCriteria || {}),
          request.sendDate || null,
          request.sendDate ? 'scheduled' : 'draft',
        ]
      );

      const campaign = await queryOne(
        'SELECT * FROM email_campaigns WHERE id = ?',
        [campaignId]
      );

      await logger.info('EmailMarketingService', 'Campaign created', {
        campaignId,
      });

      return campaign;
    } catch (error) {
      await logger.error('EmailMarketingService', 'Failed to create campaign', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Add or update subscriber
   */
  async upsertSubscriber(data: SubscriberData): Promise<any> {
    try {
      // Check if subscriber exists
      const existing = await queryOne(
        'SELECT id FROM email_subscribers WHERE email = ?',
        [data.email]
      );

      if (existing) {
        // Update existing subscriber
        await query(
          `UPDATE email_subscribers
           SET first_name = COALESCE(?, first_name),
               last_name = COALESCE(?, last_name),
               phone = COALESCE(?, phone),
               source = COALESCE(?, source),
               source_page_id = COALESCE(?, source_page_id),
               tags = ?,
               custom_fields = ?,
               status = 'subscribed',
               updated_at = NOW()
           WHERE email = ?`,
          [
            data.firstName,
            data.lastName,
            data.phone,
            data.source,
            data.sourcePageId,
            JSON.stringify(data.tags || []),
            JSON.stringify(data.customFields || {}),
            data.email,
          ]
        );

        const subscriber = await queryOne(
          'SELECT * FROM email_subscribers WHERE id = ?',
          [existing.id]
        );

        await logger.info('EmailMarketingService', 'Subscriber updated', {
          subscriberId: existing.id,
          email: data.email,
        });

        return subscriber;
      } else {
        // Create new subscriber
        const subscriberId = generateId('subscriber');

        await insert(
          `INSERT INTO email_subscribers (
            id, email, first_name, last_name, phone, source, source_page_id,
            tags, custom_fields, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'subscribed')`,
          [
            subscriberId,
            data.email,
            data.firstName || null,
            data.lastName || null,
            data.phone || null,
            data.source || null,
            data.sourcePageId || null,
            JSON.stringify(data.tags || []),
            JSON.stringify(data.customFields || {}),
          ]
        );

        const subscriber = await queryOne(
          'SELECT * FROM email_subscribers WHERE id = ?',
          [subscriberId]
        );

        await logger.info('EmailMarketingService', 'New subscriber created', {
          subscriberId,
          email: data.email,
        });

        return subscriber;
      }
    } catch (error) {
      await logger.error('EmailMarketingService', 'Failed to upsert subscriber', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: data.email,
      });
      throw error;
    }
  }

  /**
   * Enroll subscriber in sequence
   */
  async enrollInSequence(sequenceId: string, subscriberId: string): Promise<any> {
    try {
      // Check if already enrolled
      const existing = await queryOne(
        'SELECT id FROM email_sequence_enrollments WHERE sequence_id = ? AND subscriber_id = ?',
        [sequenceId, subscriberId]
      );

      if (existing) {
        throw new Error('Subscriber already enrolled in this sequence');
      }

      // Get first step send time
      const firstStep = await queryOne(
        'SELECT delay_value, delay_unit FROM email_sequence_steps WHERE sequence_id = ? ORDER BY step_number LIMIT 1',
        [sequenceId]
      );

      const enrollmentId = generateId('enrollment');
      const nextSendAt = this.calculateNextSendTime(0, 'days'); // Send immediately for first email

      await insert(
        `INSERT INTO email_sequence_enrollments (
          id, sequence_id, subscriber_id, current_step, status, next_send_at
        ) VALUES (?, ?, ?, 0, 'active', ?)`,
        [enrollmentId, sequenceId, subscriberId, nextSendAt]
      );

      // Update sequence enrollment count
      await query(
        'UPDATE email_sequences SET total_enrolled = total_enrolled + 1 WHERE id = ?',
        [sequenceId]
      );

      const enrollment = await queryOne(
        'SELECT * FROM email_sequence_enrollments WHERE id = ?',
        [enrollmentId]
      );

      await logger.info('EmailMarketingService', 'Subscriber enrolled in sequence', {
        enrollmentId,
        sequenceId,
        subscriberId,
      });

      return enrollment;
    } catch (error) {
      await logger.error('EmailMarketingService', 'Failed to enroll subscriber', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sequenceId,
        subscriberId,
      });
      throw error;
    }
  }

  /**
   * Unsubscribe subscriber
   */
  async unsubscribe(email: string): Promise<void> {
    await query(
      `UPDATE email_subscribers
       SET status = 'unsubscribed', unsubscribed_at = NOW()
       WHERE email = ?`,
      [email]
    );

    // Pause all active enrollments
    await query(
      `UPDATE email_sequence_enrollments
       SET status = 'exited'
       WHERE subscriber_id = (SELECT id FROM email_subscribers WHERE email = ?)
       AND status = 'active'`,
      [email]
    );

    await logger.info('EmailMarketingService', 'Subscriber unsubscribed', {
      email,
    });
  }

  /**
   * Send single email using Resend
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    fromName?: string
  ): Promise<any> {
    try {
      await logger.info('EmailMarketingService', 'Sending email', {
        to,
        subject,
      });

      const result = await resend.emails.send({
        from: fromName ? `${fromName} <${FROM_EMAIL}>` : FROM_EMAIL,
        to,
        subject,
        html: htmlContent,
      });

      await logger.info('EmailMarketingService', 'Email sent successfully', {
        to,
        messageId: result.data?.id,
      });

      return result;
    } catch (error) {
      await logger.error('EmailMarketingService', 'Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to,
      });
      throw error;
    }
  }

  /**
   * Send campaign to all subscribers matching criteria
   */
  async sendCampaign(campaignId: string): Promise<any> {
    try {
      // Get campaign details
      const campaign = await queryOne(
        'SELECT * FROM email_campaigns WHERE id = ?',
        [campaignId]
      );

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status === 'sent') {
        throw new Error('Campaign has already been sent');
      }

      // Get subscribers matching segment criteria
      const subscribers = await this.getSubscribersBySegment(
        campaign.segment_criteria ? JSON.parse(campaign.segment_criteria) : {}
      );

      if (subscribers.length === 0) {
        throw new Error('No subscribers match the segment criteria');
      }

      await logger.info('EmailMarketingService', 'Starting campaign send', {
        campaignId,
        subscriberCount: subscribers.length,
      });

      // Update campaign status
      await query(
        'UPDATE email_campaigns SET status = "sending", sent_at = NOW() WHERE id = ?',
        [campaignId]
      );

      let sentCount = 0;
      let failedCount = 0;

      // Send emails
      for (const subscriber of subscribers) {
        try {
          const htmlContent = this.personalizeContent(
            campaign.html_content || '',
            subscriber
          );

          await resend.emails.send({
            from: campaign.from_name
              ? `${campaign.from_name} <${FROM_EMAIL}>`
              : FROM_EMAIL,
            to: subscriber.email,
            subject: campaign.subject_line,
            html: htmlContent,
          });

          sentCount++;

          // Log successful send
          await insert(
            `INSERT INTO email_campaign_logs (
              id, campaign_id, subscriber_id, status, sent_at
            ) VALUES (?, ?, ?, 'sent', NOW())`,
            [generateId('log'), campaignId, subscriber.id]
          );
        } catch (error) {
          failedCount++;

          // Log failed send
          await insert(
            `INSERT INTO email_campaign_logs (
              id, campaign_id, subscriber_id, status, error_message, failed_at
            ) VALUES (?, ?, ?, 'failed', ?, NOW())`,
            [
              generateId('log'),
              campaignId,
              subscriber.id,
              error instanceof Error ? error.message : 'Unknown error',
            ]
          );

          await logger.error('EmailMarketingService', 'Failed to send campaign email', {
            campaignId,
            subscriberEmail: subscriber.email,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update campaign with final stats
      await query(
        `UPDATE email_campaigns
         SET status = 'sent', sent_count = ?, failed_count = ?
         WHERE id = ?`,
        [sentCount, failedCount, campaignId]
      );

      await logger.info('EmailMarketingService', 'Campaign send completed', {
        campaignId,
        sentCount,
        failedCount,
      });

      return {
        campaignId,
        totalRecipients: subscribers.length,
        sentCount,
        failedCount,
      };
    } catch (error) {
      await logger.error('EmailMarketingService', 'Campaign send failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId,
      });
      throw error;
    }
  }

  /**
   * Process email sequences (called by cron job)
   */
  async processSequences(): Promise<void> {
    try {
      // Get all active enrollments that are due to send
      const dueEnrollments = await query(
        `SELECT e.*, s.email as subscriber_email, s.first_name, s.last_name,
                seq.id as sequence_id
         FROM email_sequence_enrollments e
         JOIN email_subscribers s ON e.subscriber_id = s.id
         JOIN email_sequences seq ON e.sequence_id = seq.id
         WHERE e.status = 'active'
         AND e.next_send_at <= NOW()
         AND s.status = 'subscribed'`,
        []
      );

      await logger.info('EmailMarketingService', 'Processing sequences', {
        dueEnrollments: dueEnrollments.length,
      });

      for (const enrollment of dueEnrollments) {
        try {
          // Get next step to send
          const nextStepNumber = enrollment.current_step + 1;
          const step = await queryOne(
            `SELECT * FROM email_sequence_steps
             WHERE sequence_id = ? AND step_number = ?`,
            [enrollment.sequence_id, nextStepNumber]
          );

          if (!step) {
            // No more steps - complete the sequence
            await query(
              `UPDATE email_sequence_enrollments
               SET status = 'completed', completed_at = NOW()
               WHERE id = ?`,
              [enrollment.id]
            );
            continue;
          }

          // Personalize content
          const subscriber = {
            email: enrollment.subscriber_email,
            firstName: enrollment.first_name,
            lastName: enrollment.last_name,
          };

          const htmlContent = this.personalizeContent(step.html_content, subscriber);

          // Send email
          await resend.emails.send({
            from: FROM_EMAIL,
            to: subscriber.email,
            subject: step.subject_line,
            html: htmlContent,
          });

          // Calculate next send time
          const nextStep = await queryOne(
            `SELECT delay_value, delay_unit FROM email_sequence_steps
             WHERE sequence_id = ? AND step_number = ?`,
            [enrollment.sequence_id, nextStepNumber + 1]
          );

          const nextSendAt = nextStep
            ? this.calculateNextSendTime(nextStep.delay_value, nextStep.delay_unit)
            : null;

          // Update enrollment
          await query(
            `UPDATE email_sequence_enrollments
             SET current_step = ?, last_sent_at = NOW(), next_send_at = ?
             WHERE id = ?`,
            [nextStepNumber, nextSendAt, enrollment.id]
          );

          await logger.info('EmailMarketingService', 'Sequence email sent', {
            enrollmentId: enrollment.id,
            stepNumber: nextStepNumber,
            subscriberEmail: subscriber.email,
          });
        } catch (error) {
          await logger.error('EmailMarketingService', 'Failed to send sequence email', {
            enrollmentId: enrollment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Mark enrollment as error
          await query(
            `UPDATE email_sequence_enrollments
             SET status = 'error'
             WHERE id = ?`,
            [enrollment.id]
          );
        }
      }

      await logger.info('EmailMarketingService', 'Sequence processing completed');
    } catch (error) {
      await logger.error('EmailMarketingService', 'Sequence processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get subscribers by segment criteria
   */
  private async getSubscribersBySegment(criteria: any): Promise<any[]> {
    // Default: all subscribed users
    if (!criteria || Object.keys(criteria).length === 0) {
      return await query(
        'SELECT * FROM email_subscribers WHERE status = "subscribed"',
        []
      );
    }

    // Build query based on criteria
    let whereClause = 'status = "subscribed"';
    const params: any[] = [];

    if (criteria.tags && criteria.tags.length > 0) {
      whereClause += ' AND JSON_CONTAINS(tags, ?)';
      params.push(JSON.stringify(criteria.tags));
    }

    if (criteria.source) {
      whereClause += ' AND source = ?';
      params.push(criteria.source);
    }

    return await query(
      `SELECT * FROM email_subscribers WHERE ${whereClause}`,
      params
    );
  }

  /**
   * Personalize email content with subscriber data
   */
  private personalizeContent(content: string, subscriber: any): string {
    let personalized = content;

    // Replace common variables
    personalized = personalized.replace(/\{\{firstName\}\}/g, subscriber.firstName || '');
    personalized = personalized.replace(/\{\{lastName\}\}/g, subscriber.lastName || '');
    personalized = personalized.replace(/\{\{email\}\}/g, subscriber.email || '');

    return personalized;
  }

  /**
   * Build specialized prompt for email generation
   */
  private buildEmailPrompt(request: EmailTemplateGenerationRequest): string {
    return `You are an expert email copywriter specializing in conversion-focused marketing emails.

EMAIL REQUIREMENTS:
- Type: ${request.templateType}
- Purpose: ${request.purpose}
- Tone: ${request.tone || 'professional'}
${request.offerName ? `- Offer: ${request.offerName}` : ''}
${request.targetAudience ? `- Target Audience: ${request.targetAudience}` : ''}

CRITICAL REQUIREMENTS:
1. Subject line must be compelling, under 50 characters
2. Preview text (first line) must hook attention, under 100 characters
3. Email must be mobile-friendly and scannable
4. Use psychological triggers: curiosity, urgency, social proof
5. Include clear call-to-action
6. Use personalization variables: {{firstName}}, {{lastName}}
7. Keep paragraphs short (2-3 sentences max)
8. Use bullet points for benefits
9. Email should build trust and provide value
10. Must comply with CAN-SPAM regulations

RESPONSE FORMAT:
Return JSON with this structure:
{
  "subjectLine": "Compelling subject under 50 chars",
  "previewText": "Hook text under 100 chars",
  "htmlContent": "<html email with inline CSS>",
  "plainTextContent": "Plain text version",
  "variables": ["firstName", "lastName"]
}

Generate the email now:`;
  }

  /**
   * Build prompt for email sequence generation
   */
  private buildSequencePrompt(request: SequenceGenerationRequest): string {
    return `You are an expert at creating email drip sequences that nurture leads and drive conversions.

SEQUENCE REQUIREMENTS:
- Sequence Name: ${request.sequenceName}
- Offer/Product: ${request.offerName}
- Purpose: ${request.purpose}
- Number of Emails: ${request.numberOfEmails}
- Days Between Emails: ${request.daysBetweenEmails}
- Tone: ${request.tone || 'professional'}

EMAIL SEQUENCE STRATEGY:
Email 1: Welcome + Set expectations + Deliver immediate value
Email 2: Educate + Build authority + Soft introduction to offer
Email 3: Social proof + Case study or testimonial + Benefits
Email 4: Address objections + FAQ + Trust builders
Email 5+: Urgency + Scarcity + Strong CTA + Bonus

CRITICAL REQUIREMENTS:
1. Each email builds on the previous one
2. Progressive disclosure - reveal benefits gradually
3. Each email provides standalone value
4. Use storytelling and emotion
5. Include clear CTAs in every email
6. Subject lines must create curiosity
7. Personalization variables: {{firstName}}, {{lastName}}
8. Mobile-friendly formatting

RESPONSE FORMAT:
Return JSON with this structure:
{
  "emails": [
    {
      "stepName": "Email 1: Welcome Email",
      "subjectLine": "Subject line",
      "previewText": "Preview text",
      "htmlContent": "<html email>",
      "plainTextContent": "Plain text version"
    }
  ]
}

Generate the ${request.numberOfEmails}-email sequence now:`;
  }

  /**
   * Parse Claude's email template response
   */
  private parseClaudeEmailResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Failed to parse Claude response as JSON');
    }
  }

  /**
   * Parse Claude's sequence response
   */
  private parseClaudeSequenceResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Failed to parse Claude response as JSON');
    }
  }

  /**
   * Calculate next send time based on delay
   */
  private calculateNextSendTime(delayValue: number, delayUnit: string): Date {
    const now = new Date();

    switch (delayUnit) {
      case 'minutes':
        now.setMinutes(now.getMinutes() + delayValue);
        break;
      case 'hours':
        now.setHours(now.getHours() + delayValue);
        break;
      case 'days':
        now.setDate(now.getDate() + delayValue);
        break;
      case 'weeks':
        now.setDate(now.getDate() + delayValue * 7);
        break;
    }

    return now;
  }
}

// Export singleton instance
export const emailMarketingService = new EmailMarketingService();
