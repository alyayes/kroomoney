import { pool } from '../config/db.js';

class NotificationSettingModel {
  // Get all settings as key-value object
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM notification_settings ORDER BY setting_group, setting_key');
    const result = {};
    for (const row of rows) {
      result[row.setting_key] = {
        value: row.setting_value,
        group: row.setting_group,
        deskripsi: row.deskripsi,
        updated_at: row.updated_at
      };
    }
    return result;
  }

  // Get single setting value by key
  static async get(key) {
    const [rows] = await pool.query('SELECT * FROM notification_settings WHERE setting_key = ?', [key]);
    return rows[0]?.setting_value ?? null;
  }

  // Upsert a setting
  static async set(key, value, { group, deskripsi } = {}) {
    await pool.query(
      `INSERT INTO notification_settings (setting_key, setting_value, setting_group, deskripsi)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
      [key, value, group || 'general', deskripsi || null]
    );
  }

  // Upsert multiple settings at once
  static async setMany(settings) {
    for (const s of settings) {
      await NotificationSettingModel.set(s.key, s.value, { group: s.group, deskripsi: s.deskripsi });
    }
  }

  // Get scheduler config as structured object
  static async getSchedulerConfig() {
    const [rows] = await pool.query("SELECT * FROM notification_settings WHERE setting_group = 'scheduler'");
    const cfg = {
      enabled: true,
      cron_expression: '0 8 * * *', // default: every day at 08:00
      reminder_h30_enabled: true,
      reminder_h7_enabled: true,
      reminder_h1_enabled: true,
      reminder_overdue_enabled: true,
      max_retry_attempts: 3,
      retry_interval_minutes: 30,
    };
    for (const row of rows) {
      const v = row.setting_value;
      switch (row.setting_key) {
        case 'scheduler_enabled': cfg.enabled = v === '1' || v === 'true'; break;
        case 'scheduler_cron': cfg.cron_expression = v || cfg.cron_expression; break;
        case 'h30_enabled': cfg.reminder_h30_enabled = v !== '0'; break;
        case 'h7_enabled': cfg.reminder_h7_enabled = v !== '0'; break;
        case 'h1_enabled': cfg.reminder_h1_enabled = v !== '0'; break;
        case 'overdue_enabled': cfg.reminder_overdue_enabled = v !== '0'; break;
        case 'max_retry_attempts': cfg.max_retry_attempts = parseInt(v) || 3; break;
        case 'retry_interval_minutes': cfg.retry_interval_minutes = parseInt(v) || 30; break;
      }
    }
    return cfg;
  }
}

export default NotificationSettingModel;
