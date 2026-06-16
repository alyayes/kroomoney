import { pool } from '../config/db.js';

class UserModel {
  // Find user by email
  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    return rows[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // Create a new user (default registration)
  static async create({ nama, email, passwordHash, role, status, now }) {
    const [result] = await pool.query(
      'INSERT INTO users (nama_lengkap, email, password_hash, role, status_akun, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nama, email.toLowerCase(), passwordHash, role, status, now, now]
    );
    return result.insertId;
  }

  // Update password reset OTP
  static async updateResetOtp(email, otp, expiry) {
    await pool.query(
      'UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?',
      [otp, expiry, email.toLowerCase()]
    );
  }

  // Reset password using OTP
  static async resetPassword(email, hashedPassword, now) {
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expiry = NULL, updated_at = ? WHERE email = ?',
      [hashedPassword, now, email.toLowerCase()]
    );
  }

  // Get all users from the system
  static async findAllTreasurers() {
    const [rows] = await pool.query(
      "SELECT id, nama_lengkap, email, role, status_akun, created_at FROM users ORDER BY created_at DESC"
    );
    return rows;
  }

  // Update treasurer status (activate/deactivate)
  static async updateStatus(id, status) {
    await pool.query('UPDATE users SET status_akun = ? WHERE id = ?', [status, id]);
  }

  // Delete treasurer
  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  }

  // Update treasurer biodata by Admin
  static async updateTreasurer(id, { nama, email, status }) {
    await pool.query(
      'UPDATE users SET nama_lengkap = ?, email = ?, status_akun = ? WHERE id = ?',
      [nama, email.toLowerCase(), status, id]
    );
  }

  // Create treasurer by Admin
  static async createByAdmin({ nama, email, passwordHash, status }) {
    await pool.query(
      'INSERT INTO users (nama_lengkap, email, password_hash, role, status_akun) VALUES (?, ?, ?, ?, ?)',
      [nama, email.toLowerCase(), passwordHash, 'bendahara', status]
    );
  }

  // Update profile details (replaces pengguna queries)
  static async updateProfile(id, { nama, email, tandaTangan, fotoProfil, now }) {
    await pool.query(
      'UPDATE users SET nama_lengkap = COALESCE(?, nama_lengkap), email = COALESCE(?, email), tanda_tangan = COALESCE(?, tanda_tangan), foto_profil = COALESCE(?, foto_profil), updated_at = ? WHERE id = ?',
      [
        nama || null,
        email ? email.toLowerCase() : null,
        tandaTangan !== undefined ? tandaTangan : null,
        fotoProfil !== undefined ? fotoProfil : null,
        now,
        id
      ]
    );
  }
}

export default UserModel;
