import { pool } from '../config/db.js';

class SettingModel {
  // Get all global settings
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM global_settings');
    return rows;
  }

  // Find setting by its key
  static async findByKey(key) {
    const [rows] = await pool.query('SELECT * FROM global_settings WHERE setting_key = ?', [key]);
    return rows[0] || null;
  }

  // Upsert (Insert or Update if exists) a setting key
  static async upsert({ key, value, model, temperature, now }) {
    await pool.query(
      `INSERT INTO global_settings (setting_key, setting_value, gemini_model_version, gemini_temperature, updated_at) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       setting_value = VALUES(setting_value), 
       gemini_model_version = VALUES(gemini_model_version), 
       gemini_temperature = VALUES(gemini_temperature),
       updated_at = VALUES(updated_at)`,
      [key, value, model || null, temperature !== undefined ? Number(temperature) : 0.2, now]
    );
  }
}

export default SettingModel;
