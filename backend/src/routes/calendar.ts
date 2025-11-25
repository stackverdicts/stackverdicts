import { Router, Request, Response } from 'express';
import { query, queryOne, insert } from '../config/database';
import { generateId } from '../utils/id-generator';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get calendar events
 * GET /api/calendar/events?month=2025-01&status=all
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { month, status, limit = 100, offset = 0 } = req.query;

    let sql = `
      SELECT
        cc.*,
        ys.title as script_title,
        ys.video_type,
        ys.offer_id
      FROM content_calendar cc
      LEFT JOIN youtube_scripts ys ON cc.script_id = ys.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by month if provided
    if (month) {
      sql += ' AND DATE_FORMAT(cc.scheduled_publish_date, "%Y-%m") = ?';
      params.push(month);
    }

    // Filter by status if provided and not 'all'
    if (status && status !== 'all') {
      sql += ' AND cc.production_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY cc.scheduled_publish_date ASC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const events = await query(sql, params);

    res.json({ events });
  } catch (error) {
    await logger.error('CalendarAPI', 'Failed to fetch calendar events', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to fetch calendar events',
    });
  }
});

/**
 * Add to calendar
 * POST /api/calendar/events
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    const { scriptId, scheduledDate, priority, notes } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({
        error: 'scheduledDate is required',
      });
    }

    const eventId = generateId('event');

    // Determine production status based on whether there's a script
    const productionStatus = scriptId ? 'scripted' : 'idea';

    await insert(
      `INSERT INTO content_calendar (
        id, script_id, scheduled_publish_date, production_status, priority, notes
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        scriptId || null,
        scheduledDate,
        productionStatus,
        priority || 'medium',
        notes || null,
      ]
    );

    const event = await queryOne(
      'SELECT * FROM content_calendar WHERE id = ?',
      [eventId]
    );

    res.json({ event });
  } catch (error) {
    await logger.error('CalendarAPI', 'Failed to create calendar event', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to create calendar event',
    });
  }
});

/**
 * Update calendar event
 * PATCH /api/calendar/events/:id
 */
router.patch('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'scheduled_publish_date',
      'actual_publish_date',
      'production_status',
      'priority',
      'notes',
      'recording_date',
      'thumbnail_status',
      'thumbnail_url',
      'editor_assigned',
      'publish_time',
    ];

    const updateFields: string[] = [];
    const params: any[] = [];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await query(
      `UPDATE content_calendar SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const event = await queryOne(
      'SELECT * FROM content_calendar WHERE id = ?',
      [id]
    );

    res.json({ event });
  } catch (error) {
    await logger.error('CalendarAPI', 'Failed to update calendar event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to update calendar event',
    });
  }
});

/**
 * Delete calendar event
 * DELETE /api/calendar/events/:id
 */
router.delete('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM content_calendar WHERE id = ?', [id]);

    res.json({ message: 'Calendar event deleted successfully' });
  } catch (error) {
    await logger.error('CalendarAPI', 'Failed to delete calendar event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to delete calendar event',
    });
  }
});

/**
 * Bulk reschedule
 * POST /api/calendar/bulk-reschedule
 */
router.post('/bulk-reschedule', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({
        error: 'events array is required',
      });
    }

    let updated = 0;

    for (const event of events) {
      if (event.id && event.newDate) {
        await query(
          'UPDATE content_calendar SET scheduled_publish_date = ?, updated_at = NOW() WHERE id = ?',
          [event.newDate, event.id]
        );
        updated++;
      }
    }

    res.json({ updated });
  } catch (error) {
    await logger.error('CalendarAPI', 'Failed to bulk reschedule', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to bulk reschedule',
    });
  }
});

/**
 * Get production status summary
 * GET /api/calendar/production-status
 */
router.get('/production-status', async (req: Request, res: Response) => {
  try {
    const statusCounts = await query(`
      SELECT
        production_status as status,
        COUNT(*) as count
      FROM content_calendar
      GROUP BY production_status
    `);

    const result: any = {
      idea: 0,
      scripted: 0,
      recording: 0,
      editing: 0,
      thumbnail: 0,
      scheduled: 0,
      published: 0,
    };

    statusCounts.forEach((row: any) => {
      result[row.status] = row.count;
    });

    res.json(result);
  } catch (error) {
    await logger.error('CalendarAPI', 'Failed to get production status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get production status',
    });
  }
});

/**
 * Get AI suggestions for next videos
 * GET /api/calendar/suggestions?count=5
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const { count = 5 } = req.query;

    // TODO: Implement AI-powered suggestions based on:
    // - Performance of similar videos
    // - Trending keywords
    // - Gaps in content calendar
    // - Seasonal relevance

    // For now, return placeholder
    res.json({
      suggestions: [
        {
          videoType: 'review',
          reason: 'Review videos have 25% higher CTR in your channel',
          suggestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          videoType: 'comparison',
          reason: 'No comparison videos published this month',
          suggestedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ].slice(0, parseInt(count as string)),
    });
  } catch (error) {
    await logger.error('CalendarAPI', 'Failed to get suggestions', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get suggestions',
    });
  }
});

export default router;
