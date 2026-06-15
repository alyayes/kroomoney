import { pool } from '../config/db.js';

class ApiTokenModel {
  // Create new token record
  static async create(client_id, token, expires_at) {
    const [result] = await pool.query(
      'INSERT INTO api_tokens (client_id, token, expires_at) VALUES (?, ?, ?)',
      [client_id, token, expires_at]
    );
    return result.insertId;
  }

  // Find valid token
  static async findByToken(token) {
    const [rows] = await pool.query(
      'SELECT * FROM api_tokens WHERE token = ? AND is_revoked = 0 AND expires_at > NOW() LIMIT 1',
      [token]
    );
    return rows[0] || null;
  }

  // Revoke a token
  static async revoke(id) {
    await pool.query('UPDATE api_tokens SET is_revoked = 1 WHERE id = ?', [id]);
  }

  // Revoke all tokens for a client
  static async revokeAllForClient(client_id) {
    await pool.query('UPDATE api_tokens SET is_revoked = 1 WHERE client_id = ?', [client_id]);
  }

  // Cleanup expired tokens (housekeeping)
  static async cleanupExpired() {
    const [result] = await pool.query('DELETE FROM api_tokens WHERE expires_at < NOW() OR is_revoked = 1');
    return result.affectedRows;
  }
}

export default ApiTokenModel;
