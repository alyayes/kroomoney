import {
  runReminderCycle,
  scheduleReminders,
  processReminderJobs,
  previewReminders,
  sendManualReminder,
} from '../services/reminderService.js';
import { verifySmtpConnection } from '../services/emailService.js';
import ReminderModel from '../models/reminderModel.js';
import SettingModel from '../models/settingModel.js';
import { pool } from '../config/db.js';

export const runReminders = async (req, res) => {
  try {
    const result = await runReminderCycle();
    await logAudit(req, `Manual trigger reminder cycle - ${result.process.sent} terkirim, ${result.process.failed} gagal`);
    return res.status(200).json({ status: 'success', message: 'Reminder cycle selesai.', data: result });
  } catch (err) {
    console.error('runReminders error:', err);
    return res.status(500).json({ status: 'error', message: err.message || 'Gagal menjalankan reminder cycle.' });
  }
};

export const scheduleOnly = async (req, res) => {
  try {
    const result = await scheduleReminders();
    return res.status(200).json({ status: 'success', message: 'Jobs berhasil dijadwalkan.', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal menjadwalkan reminder.' });
  }
};

export const processOnly = async (req, res) => {
  try {
    const result = await processReminderJobs();
    return res.status(200).json({ status: 'success', message: 'Jobs berhasil diproses.', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal memproses reminder jobs.' });
  }
};

export const getReminderPreview = async (req, res) => {
  try {
    const preview = await previewReminders();
    const willSend = preview.filter(p => p.will_send).length;
    const willSkip = preview.filter(p => !p.will_send).length;
    return res.status(200).json({
      status: 'success',
      summary: { total: preview.length, will_send: willSend, will_skip: willSkip },
      data: preview
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal menampilkan preview reminder.' });
  }
};

export const getReminderHistory = async (req, res) => {
  try {
    const rows = await ReminderModel.findAll();
    const mapped = rows.map(r => ({
      id: r.id,
      invoiceId: r.invoice_id,
      nomorInvoice: r.nomor_invoice || null,
      customer: r.nama_pelanggan || r.nama_manual || 'Manual',
      tipeReminder: r.tipe_reminder,
      channel: r.channel,
      noTujuan: r.email_tujuan || r.recipient_contact,
      statusKirim: r.status,
      responseGateway: r.gateway_response || r.error_message,
      createdAt: r.created_at,
    }));
    return res.status(200).json({ status: 'success', data: mapped, total: mapped.length });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil histori reminder.' });
  }
};

export const getReminderJobs = async (req, res) => {
  try {
    const { status, tipe } = req.query;
    const jobs = await ReminderModel.findAll({ status, tipe_reminder: tipe });
    return res.status(200).json({ status: 'success', data: jobs, total: jobs.length });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data reminder jobs.' });
  }
};

export const sendManual = async (req, res) => {
  try {
    const { invoice_id, tipe_reminder, email_tujuan } = req.body;
    if (!invoice_id || !email_tujuan) {
      return res.status(400).json({ status: 'error', message: 'invoice_id dan email_tujuan wajib diisi.' });
    }
    const result = await sendManualReminder({ invoice_id, tipe_reminder: tipe_reminder || 'manual', email_tujuan, dikirim_oleh: req.user?.id || null });
    await logAudit(req, `Manual send reminder ke ${email_tujuan} untuk Invoice #${invoice_id}`);
    return res.status(200).json({ status: 'success', message: 'Reminder berhasil dikirim!', data: result });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message || 'Gagal mengirim reminder.' });
  }
};

export const getReminderSettings = async (req, res) => {
  try {
    const [cfgRows] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_group = 'scheduler'");
    const cfg = {};
    cfgRows.forEach(r => { cfg[r.setting_key] = r.setting_value === 'true' || r.setting_value === '1'; });
    const allRows = await SettingModel.findAll();
    return res.status(200).json({ status: 'success', data: { scheduler: cfg, all: allRows } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil konfigurasi.' });
  }
};

export const updateReminderSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) return res.status(400).json({ status: 'error', message: 'Format: { settings: [{ key, value, group }] }' });
    for (const s of settings) {
      await SettingModel.upsert({ key: s.key, value: s.value, group: s.group || 'scheduler' });
    }
    await logAudit(req, 'Update konfigurasi reminder service');
    return res.status(200).json({ status: 'success', message: 'Konfigurasi berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal update konfigurasi.' });
  }
};

export const testSmtpConnection = async (req, res) => {
  try {
    const result = await verifySmtpConnection();
    return res.status(200).json({ status: result.ok ? 'success' : 'error', message: result.message });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

async function logAudit(req, aktivitas) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || '';
    await pool.query('INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)', [req.user?.id || null, aktivitas, ip, ua]);
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
