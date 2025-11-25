import { insert } from '../config/database';
import { generateId } from './id-generator';

type LogType = 'info' | 'warning' | 'error' | 'success';

interface LogOptions {
  category: string;
  message: string;
  details?: Record<string, any>;
  consoleLog?: boolean;
}

/**
 * Logger utility that writes to both console and database
 */
class Logger {
  async log(type: LogType, options: LogOptions): Promise<void> {
    const { category, message, details, consoleLog = true } = options;

    // Console logging
    if (consoleLog) {
      const emoji = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
        success: '✅',
      }[type];

      const timestamp = new Date().toISOString();
      console.log(`${emoji} [${timestamp}] [${category}] ${message}`);
      if (details) {
        console.log('Details:', JSON.stringify(details, null, 2));
      }
    }

    // Database logging
    try {
      await insert(
        `INSERT INTO system_logs (id, log_type, category, message, details)
         VALUES (?, ?, ?, ?, ?)`,
        [generateId('log'), type, category, message, details ? JSON.stringify(details) : null]
      );
    } catch (error) {
      console.error('Failed to write log to database:', error);
    }
  }

  info(category: string, message: string, details?: Record<string, any>): Promise<void> {
    return this.log('info', { category, message, details });
  }

  warning(category: string, message: string, details?: Record<string, any>): Promise<void> {
    return this.log('warning', { category, message, details });
  }

  error(category: string, message: string, details?: Record<string, any>): Promise<void> {
    return this.log('error', { category, message, details });
  }

  success(category: string, message: string, details?: Record<string, any>): Promise<void> {
    return this.log('success', { category, message, details });
  }
}

export const logger = new Logger();
