import { pool } from '../config/db.js';

class AuditLogModel {
  // Create audit log entry
  static async create({ user_id, action, entity_type = null, entity_id = null, old_values = null, new_values = null, ip_address, user_agent = null }) {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        action,
        entity_type,
        entity_id,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address,
        user_agent
      ]
    );
  }

  // Get all logs joined with user details (with backward-compatible aliases)
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT a.id, 
              a.user_id,
              a.action,
              a.action AS aktivitas, 
              a.ip_address, 
              a.created_at, 
              u.nama_lengkap AS user 
       FROM audit_logs a 
       JOIN users u ON a.user_id = u.id 
       ORDER BY a.created_at DESC`
    );
    return rows;
  }
}

export default AuditLogModel;
