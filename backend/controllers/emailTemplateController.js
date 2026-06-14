import EmailTemplateModel from '../models/emailTemplateModel.js';
import { pool } from '../config/db.js';

export const getAllTemplates = async (req, res) => {
  try {
    const rows = await EmailTemplateModel.findAll();
    return res.status(200).json({ status: 'success', data: rows, total: rows.length });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil template email.' });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const tpl = await EmailTemplateModel.findById(req.params.id);
    if (!tpl) return res.status(404).json({ status: 'error', message: 'Template tidak ditemukan.' });
    return res.status(200).json({ status: 'success', data: tpl });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil template.' });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const { nama_template, tipe_reminder, subject, body_html, body_text, is_active, is_default } = req.body;
    if (!nama_template || !subject || !body_html) return res.status(400).json({ status: 'error', message: 'nama_template, subject, dan body_html wajib diisi.' });
    const id = await EmailTemplateModel.create({ nama_template, tipe_reminder: tipe_reminder || 'custom', subject, body_html, body_text, is_active: is_active ?? 1, is_default: is_default ?? 0, created_by: req.user.id });
    await logAudit(req, `Buat template email: ${nama_template}`);
    return res.status(201).json({ status: 'success', message: 'Template berhasil dibuat.', data: { id } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ status: 'error', message: 'Nama template sudah digunakan.' });
    return res.status(500).json({ status: 'error', message: 'Gagal membuat template.' });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const tpl = await EmailTemplateModel.findById(req.params.id);
    if (!tpl) return res.status(404).json({ status: 'error', message: 'Template tidak ditemukan.' });
    await EmailTemplateModel.update(req.params.id, req.body);
    await logAudit(req, `Update template email: ${tpl.nama_template}`);
    return res.status(200).json({ status: 'success', message: 'Template berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal memperbarui template.' });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const tpl = await EmailTemplateModel.findById(req.params.id);
    if (!tpl) return res.status(404).json({ status: 'error', message: 'Template tidak ditemukan.' });
    if (tpl.is_default) return res.status(400).json({ status: 'error', message: 'Template default tidak dapat dihapus.' });
    await EmailTemplateModel.delete(req.params.id);
    await logAudit(req, `Hapus template email: ${tpl.nama_template}`);
    return res.status(200).json({ status: 'success', message: 'Template berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus template.' });
  }
};

export const previewTemplate = async (req, res) => {
  try {
    const { template_id, subject, body_html, body_text, data } = req.body;
    let template;
    if (template_id) {
      template = await EmailTemplateModel.findById(template_id);
      if (!template) return res.status(404).json({ status: 'error', message: 'Template tidak ditemukan.' });
    } else {
      if (!subject || !body_html) return res.status(400).json({ status: 'error', message: 'Butuh template_id atau (subject + body_html).' });
      template = { subject, body_html, body_text };
    }
    const dummyData = { customer_name: 'Budi Santoso', invoice_number: 'INV-2026-00001', amount: 500000, due_date: new Date(Date.now() + 7*86400000).toISOString().split('T')[0], days_remaining: 7, payment_link: 'https://kroomoney.com/pay', company_name: 'Kroomoney', support_email: 'support@kroomoney.com', ...data };
    const rendered = EmailTemplateModel.render(template, dummyData);
    return res.status(200).json({ status: 'success', data: rendered });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal merender preview.' });
  }
};

async function logAudit(req, aktivitas) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await pool.query('INSERT INTO user_audit_trails (user_id, aktivitas, ip_address) VALUES (?, ?, ?)', [req.user.id, aktivitas, ip]);
  } catch {}
}
