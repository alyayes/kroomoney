import ReceiptModel from '../models/receiptModel.js';
import InvoiceModel from '../models/invoiceModel.js';
import AuditLogModel from '../models/auditLogModel.js';
import { pool } from '../config/db.js';
import { generateReceiptPdf, getReceiptPreviewHtml } from '../services/pdfService.js';
import { sendEmail } from '../services/emailService.js';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function mapReceipt(r) {
  return {
    id: r.id,
    nomorKwitansi: r.nomor_kwitansi,
    invoiceId: r.invoice_id,
    nomorInvoice: r.nomor_invoice || null,
    pelangganId: r.pelanggan_id,
    namaPelanggan: r.nama_pelanggan || r.nama_manual || 'Manual',
    noWhatsapp: r.no_whatsapp || '-',
    tanggalTerbit: r.tanggal_terbit,
    nominalDiterima: r.nominal_diterima,
    metodePembayaran: r.metode_pembayaran,
    diterimaOleh: r.diterima_oleh,
    keterangan: r.keterangan,
    pdfPath: r.pdf_path || null,
    tanggalKirimWa: r.tanggal_kirim_wa,
    tanggalKirimEmail: r.tanggal_kirim_email,
    statusKirim: r.status_kirim,
    createdAt: r.created_at,
  };
}

// GET /api/receipts
export const getAllReceipts = async (req, res) => {
  try {
    const rows = await ReceiptModel.findAll();
    return res.status(200).json({ status: 'success', data: rows.map(mapReceipt), total: rows.length });
  } catch (err) {
    console.error('getAllReceipts error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data kwitansi.' });
  }
};

// GET /api/receipts/:id
export const getReceiptById = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });
    return res.status(200).json({ status: 'success', data: mapReceipt(r) });
  } catch (err) {
    console.error('getReceiptById error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil kwitansi.' });
  }
};

// POST /api/receipts/generate/:invoiceId
export const generateReceipt = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const inv = await InvoiceModel.findById(invoiceId);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });
    if (inv.status_invoice !== 'dibayar') {
      return res.status(400).json({ status: 'error', message: 'Kwitansi hanya bisa dibuat untuk invoice yang sudah dibayar.' });
    }
    const existing = await ReceiptModel.findByInvoiceId(invoiceId);
    if (existing) {
      return res.status(409).json({ status: 'error', message: `Kwitansi sudah ada: ${existing.nomor_kwitansi}` });
    }

    const { metodePembayaran, diterimaOleh, keterangan } = req.body;
    const [userRow] = await pool.query('SELECT nama_lengkap, tanda_tangan FROM users WHERE id = ?', [req.user.id]);

    const { insertId, nomor_kwitansi } = await ReceiptModel.create({
      invoice_id: parseInt(invoiceId),
      pelanggan_id: inv.pelanggan_id || null,
      nama_manual: inv.nama_manual || null,
      tanggal_terbit: new Date().toISOString().split('T')[0],
      nominal_diterima: inv.total,
      metode_pembayaran: metodePembayaran || 'Transfer Bank',
      diterima_oleh: diterimaOleh || userRow[0]?.nama_lengkap || 'Bendahara',
      keterangan: keterangan || null,
      created_by: req.user.id,
    });

    // Generate PDF
    try {
      const receipt = await ReceiptModel.findById(insertId);
      const ttd = userRow[0]?.tanda_tangan || null;
      const pdfPath = await generateReceiptPdf(receipt, inv, ttd);
      await ReceiptModel.updatePdfPath(insertId, pdfPath);
    } catch (pdfErr) {
      console.error('Kwitansi PDF warning:', pdfErr.message);
    }

    await logAudit(req, `Generate Kwitansi ${nomor_kwitansi} dari Invoice ${inv.nomor_invoice}`);
    return res.status(201).json({ status: 'success', message: `Kwitansi ${nomor_kwitansi} berhasil dibuat!`, data: { id: insertId, nomorKwitansi: nomor_kwitansi } });
  } catch (err) {
    console.error('generateReceipt error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal membuat kwitansi.' });
  }
};

// GET /api/receipts/:id/preview — returns HTML
export const previewReceipt = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });
    const inv = r.invoice_id ? await InvoiceModel.findById(r.invoice_id) : null;
    const [userRow] = await pool.query('SELECT tanda_tangan FROM users WHERE id = ?', [r.created_by || req.user.id]);
    const ttd = userRow[0]?.tanda_tangan || null;
    const html = await getReceiptPreviewHtml(r, inv, ttd);
    return res.setHeader('Content-Type', 'text/html').send(html);
  } catch (err) {
    console.error('previewReceipt error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal memuat preview.' });
  }
};

// GET /api/receipts/:id/pdf
export const downloadReceiptPdf = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });

    let pdfRelPath = r.pdf_path;
    if (!pdfRelPath || !existsSync(join(join(__dirname, '..'), pdfRelPath))) {
      const inv = r.invoice_id ? await InvoiceModel.findById(r.invoice_id) : null;
      const [userRow] = await pool.query('SELECT tanda_tangan FROM users WHERE id = ?', [r.created_by || req.user.id]);
      const ttd = userRow[0]?.tanda_tangan || null;
      pdfRelPath = await generateReceiptPdf(r, inv, ttd);
      await ReceiptModel.updatePdfPath(r.id, pdfRelPath);
    }

    const absPath = join(join(__dirname, '..'), pdfRelPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${r.nomor_kwitansi}.pdf"`);
    return res.sendFile(absPath);
  } catch (err) {
    console.error('downloadReceiptPdf error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengunduh PDF.' });
  }
};

// POST /api/receipts/:id/send-email
export const sendReceiptEmail = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });

    const to = req.body.emailTujuan || req.body.email;
    if (!to) return res.status(400).json({ status: 'error', message: 'Email tujuan wajib diisi.' });

    let pdfRelPath = r.pdf_path;
    if (!pdfRelPath || !existsSync(join(join(__dirname, '..'), pdfRelPath))) {
      const inv = r.invoice_id ? await InvoiceModel.findById(r.invoice_id) : null;
      const [userRow] = await pool.query('SELECT tanda_tangan FROM users WHERE id = ?', [r.created_by || req.user.id]);
      const ttd = userRow[0]?.tanda_tangan || null;
      pdfRelPath = await generateReceiptPdf(r, inv, ttd);
      await ReceiptModel.updatePdfPath(r.id, pdfRelPath);
    }

    const nominal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(r.nominal_diterima);
    const customerName = r.nama_pelanggan || r.nama_manual || 'Pelanggan';

    await sendEmail({
      to,
      subject: `Kwitansi Pembayaran ${r.nomor_kwitansi} — Kroombox`,
      html: `<p>Halo <strong>${customerName}</strong>,</p>
             <p>Terlampir adalah kwitansi pembayaran Anda: <strong>${r.nomor_kwitansi}</strong></p>
             <p>Nominal diterima: <strong>${nominal}</strong></p>
             <p>Terima kasih atas pembayaran Anda.<br><strong>Tim Kroombox</strong></p>`,
      attachments: [{ filename: `${r.nomor_kwitansi}.pdf`, path: join(join(__dirname, '..'), pdfRelPath) }],
    });

    await ReceiptModel.markSentEmail(r.id);
    await logAudit(req, `Kirim Kwitansi ${r.nomor_kwitansi} via Email ke ${to}`);
    return res.status(200).json({ status: 'success', message: `Kwitansi berhasil dikirim ke ${to}.` });
  } catch (err) {
    console.error('sendReceiptEmail error:', err);
    return res.status(500).json({ status: 'error', message: `Gagal kirim email: ${err.message}` });
  }
};

// PATCH /api/receipts/:id/send-wa
export const markReceiptSentWa = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });

    const noWa = req.body.noWhatsapp || r.no_whatsapp;
    const nominal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(r.nominal_diterima);
    const customerName = r.nama_pelanggan || r.nama_manual || 'Pelanggan';

    let waLink = null;
    if (noWa) {
      const waNumber = noWa.replace(/\D/g, '').replace(/^0/, '62');
      const msg = encodeURIComponent(`Halo ${customerName},\n\nKwitansi pembayaran Anda:\n*${r.nomor_kwitansi}*\nNominal: *${nominal}*\n\nTerima kasih! 🙏\n- Kroombox`);
      waLink = `https://wa.me/${waNumber}?text=${msg}`;
    }

    await ReceiptModel.markSentWa(r.id);
    await logAudit(req, `Kirim Kwitansi ${r.nomor_kwitansi} via WhatsApp`);
    return res.status(200).json({ status: 'success', waLink, message: 'Status kwitansi diperbarui.' });
  } catch (err) {
    console.error('markReceiptSentWa error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal update status.' });
  }
};

// PATCH /api/receipts/:id/send-email (legacy compatibility)
export const markReceiptSentEmail = async (req, res) => {
  return sendReceiptEmail(req, res);
};

// DELETE /api/receipts/:id
export const deleteReceipt = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });
    await ReceiptModel.delete(req.params.id);
    await logAudit(req, `Hapus Kwitansi ${r.nomor_kwitansi}`);
    return res.status(200).json({ status: 'success', message: 'Kwitansi berhasil dihapus.' });
  } catch (err) {
    console.error('deleteReceipt error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus kwitansi.' });
  }
};

async function logAudit(req, aktivitas) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await AuditLogModel.create({
      user_id: req.user.id,
      action: aktivitas,
      ip_address: ip
    });
  } catch {}
}
