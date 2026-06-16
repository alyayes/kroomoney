import { pool } from '../config/db.js';

class ApiLogModel {
  // Create an API incoming request log entry
  static async createRequestLog({ client_id, method, endpoint, request_body, response_status, response_body, ip_address, user_agent, duration_ms }) {
    const status = response_status >= 200 && response_status < 300 ? 'success' : 'failed';
    
    const [result] = await pool.query(
      `INSERT INTO api_logs (
        log_type, api_client_id, method, endpoint, request_body, 
        response_status, response_body, ip_address, user_agent, 
        duration_ms, attempt_count, status
      ) VALUES ('request', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        client_id || null, 
        method, 
        endpoint, 
        request_body || null, 
        response_status, 
        response_body || null, 
        ip_address, 
        user_agent || null, 
        duration_ms || null, 
        status
      ]
    );
    return result.insertId;
  }

  // Create an API callback outgoing log entry
  static async createCallbackLog({ ext_transaction_id, client_id, callback_url, event_type, payload, http_status, response_body, status, error_message }) {
    const [result] = await pool.query(
      `INSERT INTO api_logs (
        log_type, api_client_id, method, endpoint, ref_transaction_id, 
        request_body, response_status, response_body, attempt_count, 
        status, error_message
      ) VALUES ('callback', ?, 'POST', ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        client_id,
        callback_url,
        ext_transaction_id || null, // mapping external transaction ID
        payload ? JSON.stringify(payload) : null,
        http_status || null,
        response_body || null,
        status || 'pending',
        error_message || null
      ]
    );
    return result.insertId;
  }

  // Update callback execution attempt result
  static async updateCallbackResult(id, { http_status, response_body, status, error_message, attempt_count }) {
    const fields = ['response_status = ?', 'response_body = ?', 'status = ?'];
    const values = [http_status, response_body || null, status];
    if (error_message !== undefined) { fields.push('error_message = ?'); values.push(error_message); }
    if (attempt_count !== undefined) { fields.push('attempt_count = ?'); values.push(attempt_count); }
    values.push(id);
    
    await pool.query(`UPDATE api_logs SET ${fields.join(', ')} WHERE id = ? AND log_type = 'callback'`, values);
  }

  // Find callback logs by transaction ID
  static async findByTransaction(ref_transaction_id) {
    const [rows] = await pool.query(
      `SELECT *, 
              response_status AS http_status,
              request_body AS payload,
              ref_transaction_id AS ext_transaction_id
       FROM api_logs 
       WHERE ref_transaction_id = ? AND log_type = 'callback' 
       ORDER BY created_at DESC`,
      [ref_transaction_id]
    );
    
    return rows.map(r => ({
      ...r,
      payload: r.payload ? JSON.parse(r.payload) : null
    }));
  }

  // Find pending callbacks for retry
  static async findPendingCallbacks() {
    const [rows] = await pool.query(
      `SELECT *,
              response_status AS http_status,
              request_body AS payload,
              ref_transaction_id AS ext_transaction_id
       FROM api_logs 
       WHERE status = 'failed' AND attempt_count < 3 AND log_type = 'callback' 
       ORDER BY created_at ASC 
       LIMIT 20`
    );
    
    return rows.map(r => ({
      ...r,
      payload: r.payload ? JSON.parse(r.payload) : null
    }));
  }

  // Get paginated incoming request logs
  static async findAllRequests({ client_id, limit = 50, offset = 0 } = {}) {
    let query = `SELECT *, response_status AS response_status FROM api_logs WHERE log_type = 'request'`;
    const params = [];

    if (client_id) {
      query += ' AND api_client_id = ?';
      params.push(client_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    
    // Alias key names if expected by controller
    return rows.map(r => ({
      ...r,
      client_id: r.api_client_id
    }));
  }

  // Prune old request logs
  static async pruneRequests(days = 90) {
    const [result] = await pool.query(
      "DELETE FROM api_logs WHERE log_type = 'request' AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
      [days]
    );
    return result.affectedRows;
  }
}

export default ApiLogModel;
