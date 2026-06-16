import { pool } from '../config/db.js';

class CustomerModel {
  // Helper to construct select query with aliases for backward compatibility
  static get selectFields() {
    return `
      id,
      customer_code,
      customer_code AS id_pelanggan,
      name,
      name AS nama_pelanggan,
      phone,
      phone AS no_whatsapp,
      email,
      hosting_package,
      hosting_package AS paket_hosting,
      billing_amount,
      billing_amount AS nominal_tagihan,
      billing_due_date,
      billing_due_date AS tanggal_jatuh_tempo,
      source_type,
      external_customer_id,
      api_client_id,
      metadata,
      created_at,
      updated_at
    `;
  }

  // Get all customers (active)
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields} FROM customers WHERE deleted_at IS NULL ORDER BY created_at DESC`
    );
    return rows;
  }

  // Find customer by internal auto-increment ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields} FROM customers WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  // Find customer by customer code (old id_pelanggan)
  static async findByCode(code) {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields} FROM customers WHERE customer_code = ? AND deleted_at IS NULL`,
      [code]
    );
    return rows[0] || null;
  }

  // Create a new customer record
  static async create({ id_pelanggan, nama_pelanggan, no_whatsapp, email, paket_hosting, nominal_tagihan, tanggal_jatuh_tempo, source_type = 'manual', external_customer_id = null, api_client_id = null, metadata = null }) {
    const [result] = await pool.query(
      `INSERT INTO customers (
        customer_code, name, phone, email, hosting_package, 
        billing_amount, billing_due_date, source_type, 
        external_customer_id, api_client_id, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_pelanggan,
        nama_pelanggan,
        no_whatsapp,
        email || null,
        paket_hosting,
        Number(nominal_tagihan) || 0,
        tanggal_jatuh_tempo || null,
        source_type,
        external_customer_id,
        api_client_id,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
    return result.insertId;
  }

  // Update customer record
  static async update(customer_code, { nama_pelanggan, no_whatsapp, email, paket_hosting, nominal_tagihan, tanggal_jatuh_tempo }) {
    await pool.query(
      `UPDATE customers SET 
        name = ?, 
        phone = ?, 
        email = ?, 
        hosting_package = ?, 
        billing_amount = ?, 
        billing_due_date = ? 
      WHERE customer_code = ? AND deleted_at IS NULL`,
      [
        nama_pelanggan,
        no_whatsapp,
        email !== undefined ? email : null,
        paket_hosting,
        Number(nominal_tagihan) || 0,
        tanggal_jatuh_tempo || null,
        customer_code
      ]
    );
  }

  // Soft delete customer record
  static async delete(customer_code) {
    await pool.query(
      'UPDATE customers SET deleted_at = CURRENT_TIMESTAMP WHERE customer_code = ? AND deleted_at IS NULL',
      [customer_code]
    );
  }

  // Find external customer mapping
  static async findByExternalId(externalCustomerId, apiClientId) {
    const [rows] = await pool.query(
      `SELECT ${this.selectFields} FROM customers 
       WHERE external_customer_id = ? AND api_client_id = ? AND deleted_at IS NULL`,
      [externalCustomerId, apiClientId]
    );
    return rows[0] || null;
  }
}

export default CustomerModel;
