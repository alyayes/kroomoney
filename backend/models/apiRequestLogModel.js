import { pool } from '../config/db.js';

class ApiRequestLogModel {
  // Create log entry
  static async create({ client_id, method, endpoint, request_body, response_status, response_body, ip_address, user_agent, duration_ms }) {
    const [result] = await pool.query(
      `INSERT INTO api_request_log (client_id, method, endpoint, request_body, response_status, response_body, ip_address, user_agent, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_id || null, method, endpoint, request_body || null, response_status, response_body || null, ip_address, user_agent || null, duration_ms || null]
    );
    return result.insertId;
  }

  // Get paginated logs for a client
  static async findAll({ client_id, limit = 50, offset = 0 } = {}) {
    let query = 'SELECT * FROM api_request_log';
    const params = [];

    if (client_id) {
      query += ' WHERE client_id = ?';
      params.push(client_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Clear logs older than N days
  static async prune(days = 90) {
    const [result] = await pool.query(
      'DELETE FROM api_request_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );
    return result.affectedRows;
  }
}

export default ApiRequestLogModel;
