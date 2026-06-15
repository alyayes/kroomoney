import { pool } from '../config/db.js';

class ExtCustomerModel {
  // Find by external customer ID + source client
  static async findByExternalId(external_customer_id, source_client_id) {
    const [rows] = await pool.query(
      'SELECT * FROM ext_customers WHERE external_customer_id = ? AND source_client_id = ?',
      [external_customer_id, source_client_id]
    );
    return rows[0] || null;
  }

  // Find by internal customer ID
  static async findByInternalId(internal_customer_id) {
    const [rows] = await pool.query(
      'SELECT * FROM ext_customers WHERE internal_customer_id = ?',
      [internal_customer_id]
    );
    return rows;
  }

  // Upsert — create or update external customer mapping
  static async upsert({ external_customer_id, source_client_id, internal_customer_id, customer_name, customer_email, customer_phone, raw_data }) {
    const [result] = await pool.query(
      `INSERT INTO ext_customers (external_customer_id, source_client_id, internal_customer_id, customer_name, customer_email, customer_phone, raw_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         internal_customer_id = VALUES(internal_customer_id),
         customer_name = VALUES(customer_name),
         customer_email = VALUES(customer_email),
         customer_phone = VALUES(customer_phone),
         raw_data = VALUES(raw_data),
         updated_at = NOW()`,
      [
        external_customer_id,
        source_client_id,
        internal_customer_id || null,
        customer_name,
        customer_email || null,
        customer_phone || null,
        raw_data ? JSON.stringify(raw_data) : null
      ]
    );
    // affectedRows = 1 (insert) or 2 (update via ON DUPLICATE)
    return { id: result.insertId, isNew: result.affectedRows === 1 };
  }

  // List all external customers for a source
  static async findAll(source_client_id) {
    const [rows] = await pool.query(
      `SELECT ec.*, mc.nama_pelanggan, mc.no_whatsapp, mc.email AS mc_email
       FROM ext_customers ec
       LEFT JOIN master_customers mc ON ec.internal_customer_id = mc.id_pelanggan
       WHERE ec.source_client_id = ?
       ORDER BY ec.created_at DESC`,
      [source_client_id]
    );
    return rows;
  }

  // Find by ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM ext_customers WHERE id = ?', [id]);
    return rows[0] || null;
  }
}

export default ExtCustomerModel;
