import { pool } from '../config/db.js';

class CallbackLogModel {
  // Create callback log entry
  static async create({ ext_transaction_id, client_id, callback_url, event_type, payload, http_status, response_body, status, error_message }) {
    const [result] = await pool.query(
      `INSERT INTO callback_log (ext_transaction_id, client_id, callback_url, event_type, payload, http_status, response_body, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ext_transaction_id,
        client_id,
        callback_url,
        event_type,
        JSON.stringify(payload),
        http_status || null,
        response_body || null,
        status || 'pending',
        error_message || null
      ]
    );
    return result.insertId;
  }

  // Update callback result
  static async updateResult(id, { http_status, response_body, status, error_message, attempt_count }) {
    const fields = ['http_status = ?', 'response_body = ?', 'status = ?'];
    const values = [http_status, response_body || null, status];
    if (error_message !== undefined) { fields.push('error_message = ?'); values.push(error_message); }
    if (attempt_count !== undefined) { fields.push('attempt_count = ?'); values.push(attempt_count); }
    values.push(id);
    await pool.query(`UPDATE callback_log SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  // Find by ext_transaction_id
  static async findByTransaction(ext_transaction_id) {
    const [rows] = await pool.query(
      'SELECT * FROM callback_log WHERE ext_transaction_id = ? ORDER BY created_at DESC',
      [ext_transaction_id]
    );
    return rows;
  }

  // Find pending callbacks for retry
  static async findPending() {
    const [rows] = await pool.query(
      `SELECT * FROM callback_log WHERE status = 'failed' AND attempt_count < 3 ORDER BY created_at ASC LIMIT 20`
    );
    return rows;
  }
}

export default CallbackLogModel;
