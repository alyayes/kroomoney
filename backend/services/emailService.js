/**
 * emailService.js
 * Layanan pengiriman email via Nodemailer.
 * Membaca konfigurasi SMTP dari global_settings (DB) atau env sebagai fallback.
 */

import nodemailer from 'nodemailer';
import { pool } from '../config/db.js';

// Cache transporter agar tidak dibuat ulang setiap pengiriman
let _transporter = null;
let _transporterBuiltAt = null;
const TRANSPORTER_TTL_MS = 5 * 60 * 1000; // Refresh config setiap 5 menit

/**
 * Ambil konfigurasi SMTP dari database (global_settings) atau .env
 */
async function getSmtpConfig() {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM global_settings WHERE setting_key IN ('smtp_host','smtp_port','smtp_user','smtp_password','smtp_from_name','smtp_from_email','smtp_encryption')"
    );
    const cfg = {};
    rows.forEach(r => { cfg[r.setting_key] = r.setting_value; });
    return {
      host: cfg.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(cfg.smtp_port || process.env.SMTP_PORT || '587'),
      secure: (cfg.smtp_encryption || process.env.SMTP_ENCRYPTION || 'tls') === 'ssl',
      user: cfg.smtp_user || process.env.SMTP_USER || '',
      pass: cfg.smtp_password || process.env.SMTP_PASSWORD || '',
      fromName: cfg.smtp_from_name || process.env.SMTP_FROM_NAME || 'Kroomoney Finance',
      fromEmail: cfg.smtp_from_email || process.env.SMTP_FROM_EMAIL || cfg.smtp_user || process.env.SMTP_USER || 'noreply@kroomoney.com',
    };
  } catch {
    // Fallback to env-only if DB not available
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: (process.env.SMTP_ENCRYPTION || 'tls') === 'ssl',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
      fromName: process.env.SMTP_FROM_NAME || 'Kroomoney Finance',
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@kroomoney.com',
    };
  }
}

/**
 * Build atau refresh Nodemailer transporter
 */
async function getTransporter() {
  const now = Date.now();
  if (_transporter && _transporterBuiltAt && (now - _transporterBuiltAt) < TRANSPORTER_TTL_MS) {
    return _transporter;
  }

  const config = await getSmtpConfig();

  if (!config.user || !config.pass) {
    throw new Error('SMTP belum dikonfigurasi. Isi smtp_user dan smtp_password di Konfigurasi Sistem.');
  }

  _transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: false },
  });

  _transporter._fromName = config.fromName;
  _transporter._fromEmail = config.fromEmail;
  _transporterBuiltAt = now;

  return _transporter;
}

/**
 * Kirim email
 * @param {Object} opts
 * @param {string} opts.to - Alamat email tujuan
 * @param {string} opts.subject - Subject email (sudah di-render)
 * @param {string} opts.html - Body HTML (sudah di-render)
 * @param {string} [opts.text] - Plain text fallback
 * @param {string} [opts.replyTo] - Reply-to address
 * @returns {{ messageId: string, accepted: string[] }}
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const transporter = await getTransporter();

  const mailOptions = {
    from: `"${transporter._fromName}" <${transporter._fromEmail}>`,
    to,
    subject,
    html,
    text: text || stripHtml(html),
    ...(replyTo ? { replyTo } : {}),
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}

/**
 * Verifikasi koneksi SMTP (untuk testing di panel admin)
 */
export async function verifySmtpConnection() {
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    return { ok: true, message: 'Koneksi SMTP berhasil!' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/**
 * Reset transporter cache (dipanggil saat config SMTP diupdate)
 */
export function resetTransporterCache() {
  _transporter = null;
  _transporterBuiltAt = null;
}

/**
 * Strip HTML tags untuk plain text fallback
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
