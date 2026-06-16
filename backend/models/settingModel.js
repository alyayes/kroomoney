import { pool } from '../config/db.js';

class SettingModel {
  // Get all settings, adding backward-compatible attributes
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM settings');
    // Map to simulate old global_settings fields if expected
    const [modelRow] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = "gemini_model_version"');
    const [tempRow] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = "gemini_temperature"');
    const geminiModel = modelRow[0]?.setting_value || 'gemini-1.5-flash';
    const geminiTemp = parseFloat(tempRow[0]?.setting_value || '0.2');

    return rows.map(r => ({
      ...r,
      gemini_model_version: r.setting_key === 'gemini_api_key' ? geminiModel : null,
      gemini_temperature: r.setting_key === 'gemini_api_key' ? geminiTemp : null
    }));
  }

  // Find setting by its key
  static async findByKey(key) {
    const [rows] = await pool.query('SELECT * FROM settings WHERE setting_key = ?', [key]);
    if (rows.length === 0) return null;
    const setting = rows[0];
    
    // Polyfill gemini columns for backwards compatibility
    if (key === 'gemini_api_key') {
      const [modelRow] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = "gemini_model_version"');
      const [tempRow] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = "gemini_temperature"');
      setting.gemini_model_version = modelRow[0]?.setting_value || 'gemini-1.5-flash';
      setting.gemini_temperature = parseFloat(tempRow[0]?.setting_value || '0.2');
    } else {
      setting.gemini_model_version = null;
      setting.gemini_temperature = null;
    }
    
    return setting;
  }

  // Upsert (Insert or Update if exists) a setting key
  static async upsert({ key, value, model, temperature, group = 'general' }) {
    await pool.query(
      `INSERT INTO settings (setting_key, setting_value, setting_group, description) 
       VALUES (?, ?, ?, 'Dynamic configuration setting') 
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value, group]
    );

    // If key is gemini_api_key, upsert model version and temperature as separate rows
    if (key === 'gemini_api_key') {
      if (model) {
        await pool.query(
          `INSERT INTO settings (setting_key, setting_value, setting_group, description) 
           VALUES ('gemini_model_version', ?, 'gemini', 'Gemini model version') 
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [model]
        );
      }
      if (temperature !== undefined && temperature !== null) {
        await pool.query(
          `INSERT INTO settings (setting_key, setting_value, setting_group, description) 
           VALUES ('gemini_temperature', ?, 'gemini', 'Gemini temperature') 
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [String(temperature)]
        );
      }
    }
  }
}

export default SettingModel;
