import { query } from '../config/database';
import { logger } from '../utils/logger';

export interface Setting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  is_encrypted: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SettingsByCategory {
  [category: string]: Setting[];
}

class SettingsService {
  /**
   * Get all settings grouped by category
   */
  async getAllSettings(): Promise<SettingsByCategory> {
    try {
      const rows = await query<Setting[]>(
        'SELECT * FROM settings ORDER BY category, setting_key'
      );

      // Group by category
      const grouped: SettingsByCategory = {};
      for (const setting of rows) {
        if (!grouped[setting.category]) {
          grouped[setting.category] = [];
        }
        grouped[setting.category].push(this.parseSettingValue(setting));
      }

      await logger.info('SettingsService', 'Retrieved all settings', {
        categories: Object.keys(grouped).length,
        total: rows.length,
      });

      return grouped;
    } catch (error) {
      await logger.error('SettingsService', 'Failed to get all settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: string): Promise<Setting[]> {
    try {
      const rows = await query<Setting[]>(
        'SELECT * FROM settings WHERE category = ? ORDER BY setting_key',
        [category]
      );

      await logger.info('SettingsService', 'Retrieved settings by category', {
        category,
        count: rows.length,
      });

      return rows.map((setting) => this.parseSettingValue(setting));
    } catch (error) {
      await logger.error('SettingsService', 'Failed to get settings by category', {
        category,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a single setting by key
   */
  async getSetting(key: string): Promise<any> {
    try {
      const rows = await query<Setting[]>(
        'SELECT * FROM settings WHERE setting_key = ?',
        [key]
      );

      if (rows.length === 0) {
        throw new Error(`Setting not found: ${key}`);
      }

      const setting = this.parseSettingValue(rows[0]);

      await logger.info('SettingsService', 'Retrieved setting', {
        key,
        type: setting.setting_type,
      });

      return setting.setting_value;
    } catch (error) {
      await logger.error('SettingsService', 'Failed to get setting', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update a setting value
   */
  async updateSetting(key: string, value: any): Promise<void> {
    try {
      // Get the setting to know its type
      const rows = await query<Setting[]>(
        'SELECT * FROM settings WHERE setting_key = ?',
        [key]
      );

      if (rows.length === 0) {
        throw new Error(`Setting not found: ${key}`);
      }

      const setting = rows[0];
      const stringValue = this.serializeSettingValue(value, setting.setting_type);

      await query(
        'UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
        [stringValue, key]
      );

      await logger.info('SettingsService', 'Updated setting', {
        key,
        type: setting.setting_type,
      });
    } catch (error) {
      await logger.error('SettingsService', 'Failed to update setting', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update multiple settings at once
   */
  async updateMultipleSettings(updates: { key: string; value: any }[]): Promise<void> {
    try {
      for (const update of updates) {
        await this.updateSetting(update.key, update.value);
      }

      await logger.info('SettingsService', 'Updated multiple settings', {
        count: updates.length,
      });
    } catch (error) {
      await logger.error('SettingsService', 'Failed to update multiple settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create a new setting
   */
  async createSetting(data: {
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'json';
    category: string;
    description?: string;
    is_encrypted?: boolean;
  }): Promise<void> {
    try {
      const stringValue = this.serializeSettingValue(data.value, data.type);

      await query(
        `INSERT INTO settings (id, setting_key, setting_value, setting_type, category, description, is_encrypted)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
        [
          data.key,
          stringValue,
          data.type,
          data.category,
          data.description || null,
          data.is_encrypted || false,
        ]
      );

      await logger.info('SettingsService', 'Created setting', {
        key: data.key,
        category: data.category,
      });
    } catch (error) {
      await logger.error('SettingsService', 'Failed to create setting', {
        key: data.key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete a setting
   */
  async deleteSetting(key: string): Promise<void> {
    try {
      await query('DELETE FROM settings WHERE setting_key = ?', [key]);

      await logger.info('SettingsService', 'Deleted setting', { key });
    } catch (error) {
      await logger.error('SettingsService', 'Failed to delete setting', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Parse setting value based on type
   */
  private parseSettingValue(setting: Setting): Setting {
    if (setting.setting_value === null) {
      return setting;
    }

    let parsedValue: any = setting.setting_value;

    switch (setting.setting_type) {
      case 'number':
        parsedValue = parseFloat(setting.setting_value);
        break;
      case 'boolean':
        parsedValue = setting.setting_value === 'true';
        break;
      case 'json':
        try {
          parsedValue = JSON.parse(setting.setting_value);
        } catch {
          parsedValue = setting.setting_value;
        }
        break;
      case 'string':
      default:
        parsedValue = setting.setting_value;
    }

    return {
      ...setting,
      setting_value: parsedValue,
    };
  }

  /**
   * Serialize setting value to string for storage
   */
  private serializeSettingValue(
    value: any,
    type: 'string' | 'number' | 'boolean' | 'json'
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (type) {
      case 'json':
        return JSON.stringify(value);
      case 'boolean':
        return value ? 'true' : 'false';
      case 'number':
        return value.toString();
      case 'string':
      default:
        return value.toString();
    }
  }
}

export const settingsService = new SettingsService();
