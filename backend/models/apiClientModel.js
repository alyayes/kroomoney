import { pool } from '../config/db.js';
import crypto from 'crypto';

class ApiClientModel {
  // Find client by API key
  static async findByApiKey(api_key) {
    const [rows] = await pool.query(
      'SELECT * FROM api_clients WHERE api_key = ? AND is_active = 1',
      [api_key]
    );
    return rows[0] || null;
  }

  // Find client by ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM api_clients WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // Find client by code
  static async findByCode(client_code) {
    const [rows] = await pool.query('SELECT * FROM api_clients WHERE client_code = ?', [client_code]);
    return rows[0] || null;
  }

  // List all clients
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM api_clients ORDER BY created_at DESC');
    return rows;
  }

  // Generate random API key (64-char hex)
  static generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate random API secret (128-char hex)
  static generateApiSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Create new API client
  static async create({ client_name, client_code, callback_url, description, created_by }) {
    const api_key = ApiClientModel.generateApiKey();
    const api_secret = ApiClientModel.generateApiSecret();
    const callback_secret = crypto.randomBytes(32).toString('hex');

    const [result] = await pool.query(
      `INSERT INTO api_clients (client_name, client_code, api_key, api_secret, callback_url, callback_secret, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_name, client_code, api_key, api_secret, callback_url || null, callback_secret, description || null, created_by || null]
    );
    return { insertId: result.insertId, api_key, api_secret, callback_secret };
  }

  // Update client
  static async update(id, { client_name, callback_url, description, is_active, rate_limit_per_minute, allowed_ips }) {
    const fields = [];
    const values = [];
    const map = { client_name, callback_url, description, is_active, rate_limit_per_minute, allowed_ips };
    for (const [k, v] of Object.entries(map)) {
      if (v !== undefined) { fields.push(`${k} = ?`); values.push(v); }
    }
    if (fields.length === 0) return;
    values.push(id);
    await pool.query(`UPDATE api_clients SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  // Deactivate client (soft delete)
  static async deactivate(id) {
    await pool.query('UPDATE api_clients SET is_active = 0 WHERE id = ?', [id]);
  }

  // Rotate keys — generate new api_key & api_secret
  static async rotateKeys(id) {
    const api_key = ApiClientModel.generateApiKey();
    const api_secret = ApiClientModel.generateApiSecret();
    await pool.query(
      'UPDATE api_clients SET api_key = ?, api_secret = ? WHERE id = ?',
      [api_key, api_secret, id]
    );
    return { api_key, api_secret };
  }

  // Revoke all tokens for a client
  static async revokeTokens(id) {
    await pool.query(
      'UPDATE api_clients SET token_revoked_at = NOW() WHERE id = ?',
      [id]
    );
  }

  // Validate HMAC signature
  static validateSignature(body, secret, signature) {
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}

export default ApiClientModel;
