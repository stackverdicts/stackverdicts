import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { randomUUID } from 'crypto';

const router = Router();

// Subscribe from popup (with honeypot protection)
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { name, email, popup_id, website } = req.body;

    // Honeypot check - if website field is filled, it's a bot
    if (website) {
      // Return success to not tip off bots, but don't save
      return res.json({ message: 'Subscribed successfully' });
    }

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const id = randomUUID();
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Check if email already exists
    const existingResult = await query(
      'SELECT id FROM email_subscribers WHERE email = ?',
      [email]
    ) as any;

    const existingSubscribers = Array.isArray(existingResult[0]) ? existingResult[0] : existingResult;

    if (existingSubscribers.length > 0) {
      // Update existing subscriber with new info
      await query(
        `UPDATE email_subscribers
         SET first_name = COALESCE(NULLIF(?, ''), first_name),
             last_name = COALESCE(NULLIF(?, ''), last_name),
             status = 'subscribed',
             updated_at = NOW()
         WHERE email = ?`,
        [firstName, lastName, email]
      );
    } else {
      // Create new subscriber
      await query(
        `INSERT INTO email_subscribers (id, email, first_name, last_name, source, ip_address, user_agent, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          email,
          firstName,
          lastName,
          popup_id ? `popup_${popup_id}` : 'marketing_popup',
          ipAddress,
          userAgent,
          JSON.stringify(['popup_subscriber'])
        ]
      );
    }

    res.json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Failed to subscribe:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Get active popup for public frontend
router.get('/active', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, title, content, image_url, button_text, button_url, display_frequency, delay_seconds
       FROM marketing_popups
       WHERE is_active = TRUE
       ORDER BY updated_at DESC
       LIMIT 1`
    ) as any;

    const popups = Array.isArray(result[0]) ? result[0] : result;
    const popup = popups[0] || null;

    res.json({ popup });
  } catch (error) {
    console.error('Failed to fetch active popup:', error);
    res.status(500).json({ error: 'Failed to fetch popup' });
  }
});

// Get all popups (admin)
router.get('/admin/all', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, title, content, image_url, button_text, button_url, display_frequency, is_active, delay_seconds, created_at, updated_at
       FROM marketing_popups
       ORDER BY created_at DESC`
    ) as any;

    const popups = Array.isArray(result[0]) ? result[0] : result;

    res.json({ popups });
  } catch (error) {
    console.error('Failed to fetch popups:', error);
    res.status(500).json({ error: 'Failed to fetch popups' });
  }
});

// Get single popup (admin)
router.get('/admin/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT * FROM marketing_popups WHERE id = ?`,
      [id]
    ) as any;

    const popups = Array.isArray(result[0]) ? result[0] : result;
    const popup = popups[0];

    if (!popup) {
      return res.status(404).json({ error: 'Popup not found' });
    }

    res.json({ popup });
  } catch (error) {
    console.error('Failed to fetch popup:', error);
    res.status(500).json({ error: 'Failed to fetch popup' });
  }
});

// Create popup (admin)
router.post('/admin', async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      image_url,
      button_text,
      button_url,
      display_frequency = 'once_per_session',
      is_active = false,
      delay_seconds = 0
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const id = randomUUID();

    await query(
      `INSERT INTO marketing_popups (id, title, content, image_url, button_text, button_url, display_frequency, is_active, delay_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, content, image_url || null, button_text || null, button_url || null, display_frequency, is_active, delay_seconds]
    );

    res.status(201).json({
      message: 'Popup created successfully',
      popup: { id, title, content, image_url, button_text, button_url, display_frequency, is_active, delay_seconds }
    });
  } catch (error) {
    console.error('Failed to create popup:', error);
    res.status(500).json({ error: 'Failed to create popup' });
  }
});

// Update popup (admin)
router.put('/admin/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      image_url,
      button_text,
      button_url,
      display_frequency,
      is_active,
      delay_seconds
    } = req.body;

    // If activating this popup, deactivate all others first
    if (is_active) {
      await query(`UPDATE marketing_popups SET is_active = FALSE WHERE id != ?`, [id]);
    }

    await query(
      `UPDATE marketing_popups
       SET title = ?, content = ?, image_url = ?, button_text = ?, button_url = ?, display_frequency = ?, is_active = ?, delay_seconds = ?
       WHERE id = ?`,
      [title, content, image_url || null, button_text || null, button_url || null, display_frequency, is_active, delay_seconds, id]
    );

    res.json({ message: 'Popup updated successfully' });
  } catch (error) {
    console.error('Failed to update popup:', error);
    res.status(500).json({ error: 'Failed to update popup' });
  }
});

// Delete popup (admin)
router.delete('/admin/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query(`DELETE FROM marketing_popups WHERE id = ?`, [id]);

    res.json({ message: 'Popup deleted successfully' });
  } catch (error) {
    console.error('Failed to delete popup:', error);
    res.status(500).json({ error: 'Failed to delete popup' });
  }
});

// Toggle popup active status (admin)
router.patch('/admin/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get current status
    const result = await query(`SELECT is_active FROM marketing_popups WHERE id = ?`, [id]) as any;
    const popups = Array.isArray(result[0]) ? result[0] : result;
    const popup = popups[0];

    if (!popup) {
      return res.status(404).json({ error: 'Popup not found' });
    }

    const newStatus = !popup.is_active;

    // If activating, deactivate all others
    if (newStatus) {
      await query(`UPDATE marketing_popups SET is_active = FALSE`);
    }

    await query(`UPDATE marketing_popups SET is_active = ? WHERE id = ?`, [newStatus, id]);

    res.json({ message: 'Popup status toggled', is_active: newStatus });
  } catch (error) {
    console.error('Failed to toggle popup:', error);
    res.status(500).json({ error: 'Failed to toggle popup' });
  }
});

export default router;
