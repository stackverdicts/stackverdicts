import { Router, Request, Response } from 'express';
import { settingsService } from '../services/settings';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get all settings grouped by category
 * GET /api/settings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getAllSettings();

    res.json({ settings });
  } catch (error) {
    await logger.error('SettingsAPI', 'Failed to get all settings', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to retrieve settings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get settings by category
 * GET /api/settings/category/:category
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const settings = await settingsService.getSettingsByCategory(category);

    res.json({ settings });
  } catch (error) {
    await logger.error('SettingsAPI', 'Failed to get settings by category', {
      category: req.params.category,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to retrieve settings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get a single setting by key
 * GET /api/settings/:key
 */
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const value = await settingsService.getSetting(key);

    res.json({ key, value });
  } catch (error) {
    await logger.error('SettingsAPI', 'Failed to get setting', {
      key: req.params.key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        error: 'Setting not found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Failed to retrieve setting',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

/**
 * Update a single setting
 * PUT /api/settings/:key
 */
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        error: 'Value is required',
      });
    }

    await settingsService.updateSetting(key, value);

    res.json({
      success: true,
      message: 'Setting updated successfully',
      key,
      value,
    });
  } catch (error) {
    await logger.error('SettingsAPI', 'Failed to update setting', {
      key: req.params.key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        error: 'Setting not found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Failed to update setting',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

/**
 * Update multiple settings at once
 * POST /api/settings/bulk-update
 */
router.post('/bulk-update', async (req: Request, res: Response) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        error: 'updates array is required',
      });
    }

    // Validate format
    for (const update of updates) {
      if (!update.key || update.value === undefined) {
        return res.status(400).json({
          error: 'Each update must have key and value',
        });
      }
    }

    await settingsService.updateMultipleSettings(updates);

    res.json({
      success: true,
      message: `Updated ${updates.length} settings successfully`,
      count: updates.length,
    });
  } catch (error) {
    await logger.error('SettingsAPI', 'Failed to bulk update settings', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to update settings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create a new setting
 * POST /api/settings
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { key, value, type, category, description, is_encrypted } = req.body;

    if (!key || !type || !category) {
      return res.status(400).json({
        error: 'key, type, and category are required',
      });
    }

    const validTypes = ['string', 'number', 'boolean', 'json'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `type must be one of: ${validTypes.join(', ')}`,
      });
    }

    await settingsService.createSetting({
      key,
      value,
      type,
      category,
      description,
      is_encrypted,
    });

    res.status(201).json({
      success: true,
      message: 'Setting created successfully',
      key,
    });
  } catch (error) {
    await logger.error('SettingsAPI', 'Failed to create setting', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to create setting',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete a setting
 * DELETE /api/settings/:key
 */
router.delete('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    await settingsService.deleteSetting(key);

    res.json({
      success: true,
      message: 'Setting deleted successfully',
      key,
    });
  } catch (error) {
    await logger.error('SettingsAPI', 'Failed to delete setting', {
      key: req.params.key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to delete setting',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
