import { pool } from '../config/db.js';

class ExtTransactionModel {
  // Find by external transaction ID + source client
  static async findByExternalId(external_transaction_id, source_client_id) {
    const [rows] = await pool.query(
      'SELECT * FROM ext_transactions WHERE external_transaction_id = ? AND source_client_id = ?',
      [external_transaction_id, source_client_id]
    );
    return rows[0] || null;
  }

  // Find by internal transaction ID
  static async findByInternalId(internal_transaction_id) {
    const [rows] = await pool.query(
      'SELECT * FROM ext_transactions WHERE internal_transaction_id = ?',
      [internal_transaction_id]
    );
    return rows[0] || null;
  }

  // Create new external transaction mapping
  static async create({ external_transaction_id, source_client_id, source_application, internal_transaction_id, ext_customer_id, service_name, description, amount, quantity, due_date, raw_payload }) {
    const [result] = await pool.query(
      `INSERT INTO ext_transactions 
       (external_transaction_id, source_client_id, source_application, internal_transaction_id, ext_customer_id, service_name, description, amount, quantity, due_date, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        external_transaction_id,
        source_client_id,
        source_application,
        internal_transaction_id || null,
        ext_customer_id || null,
        service_name,
        description || null,
        amount,
        quantity || 1,
        due_date,
        raw_payload ? JSON.stringify(raw_payload) : null
      ]
    );
    return result.insertId;
  }

  // Update status
  static async updateStatus(id, status) {
    await pool.query(
      'UPDATE ext_transactions SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
  }

  // Update internal transaction ID (after creating transaksi record)
  static async updateInternalId(id, internal_transaction_id) {
    await pool.query(
      'UPDATE ext_transactions SET internal_transaction_id = ? WHERE id = ?',
      [internal_transaction_id, id]
    );
  }

  // Mark callback sent
  static async markCallbackSent(id) {
    await pool.query(
      'UPDATE ext_transactions SET callback_sent_at = NOW() WHERE id = ?',
      [id]
    );
  }

  // Find all for a source client (paginated)
  static async findAll({ source_client_id, status, page = 1, limit = 50 }) {
    let query = `
      SELECT et.*, ec.external_customer_id, ec.customer_name, ec.customer_email
      FROM ext_transactions et
      LEFT JOIN ext_customers ec ON et.ext_customer_id = ec.id
      WHERE et.source_client_id = ?
    `;
    const values = [source_client_id];

    if (status) {
      query += ' AND et.status = ?';
      values.push(status);
    }

    query += ' ORDER BY et.created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, (page - 1) * limit);

    const [rows] = await pool.query(query, values);

    // Count total
    let countQuery = 'SELECT COUNT(*) AS total FROM ext_transactions WHERE source_client_id = ?';
    const countValues = [source_client_id];
    if (status) { countQuery += ' AND status = ?'; countValues.push(status); }
    const [countRows] = await pool.query(countQuery, countValues);

    return { data: rows, total: countRows[0].total, page, limit };
  }

  // Find by ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT et.*, ec.external_customer_id, ec.customer_name, ec.customer_email
       FROM ext_transactions et
       LEFT JOIN ext_customers ec ON et.ext_customer_id = ec.id
       WHERE et.id = ?`,
      [id]
    );
    return rows[0] || null;
  }
}

export default ExtTransactionModel;
