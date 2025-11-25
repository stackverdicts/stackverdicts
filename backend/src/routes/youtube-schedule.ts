import { Router, Request, Response } from 'express';
import { query, insert } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get scheduled posts for a specific month
 * GET /api/youtube-schedule?year=2024&month=11
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    let sql = `
      SELECT
        ys.*,
        bp.title as post_title,
        bp.youtube_video_id
      FROM youtube_schedule ys
      LEFT JOIN blog_posts bp ON ys.post_id = bp.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (year && month) {
      sql += ' AND YEAR(ys.scheduled_date) = ? AND MONTH(ys.scheduled_date) = ?';
      params.push(year, month);
    }

    sql += ' ORDER BY ys.scheduled_date ASC, ys.scheduled_time ASC';

    const scheduled = await query(sql, params);

    res.json({
      scheduled: scheduled || [],
    });
  } catch (error) {
    await logger.error('YouTubeSchedule', 'Failed to fetch scheduled posts', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to fetch scheduled posts',
    });
  }
});

/**
 * Schedule a post
 * POST /api/youtube-schedule
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { post_id, scheduled_date, scheduled_time, notes } = req.body;

    if (!post_id || !scheduled_date) {
      return res.status(400).json({
        error: 'post_id and scheduled_date are required',
      });
    }

    const id = uuidv4();

    await insert('youtube_schedule', {
      id,
      post_id,
      scheduled_date,
      scheduled_time: scheduled_time || '10:00',
      notes: notes || null,
    });

    await logger.info('YouTubeSchedule', 'Post scheduled', {
      id,
      post_id,
      scheduled_date,
    });

    res.json({
      message: 'Post scheduled successfully',
      id,
    });
  } catch (error) {
    await logger.error('YouTubeSchedule', 'Failed to schedule post', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to schedule post',
    });
  }
});

/**
 * Update scheduled post
 * PATCH /api/youtube-schedule/:id
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduled_date, scheduled_time, notes } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (scheduled_date) {
      updates.push('scheduled_date = ?');
      params.push(scheduled_date);
    }

    if (scheduled_time) {
      updates.push('scheduled_time = ?');
      params.push(scheduled_time);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await query(
      `UPDATE youtube_schedule SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Scheduled post updated successfully' });
  } catch (error) {
    await logger.error('YouTubeSchedule', 'Failed to update scheduled post', {
      error: error instanceof Error ? error.message : 'Unknown error',
      scheduleId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to update scheduled post',
    });
  }
});

/**
 * Delete scheduled post
 * DELETE /api/youtube-schedule/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM youtube_schedule WHERE id = ?', [id]);

    await logger.info('YouTubeSchedule', 'Scheduled post deleted', {
      id,
    });

    res.json({ message: 'Scheduled post deleted successfully' });
  } catch (error) {
    await logger.error('YouTubeSchedule', 'Failed to delete scheduled post', {
      error: error instanceof Error ? error.message : 'Unknown error',
      scheduleId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to delete scheduled post',
    });
  }
});

export default router;
